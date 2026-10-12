'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildSlides, hasAnswer } from '@/lib/buildSlides';
import { newItemId } from '@/lib/ids';
import { findSlide, type PreviewTarget } from '@/lib/previewTarget';
import type { PackKind } from '@/lib/schema';
import { LS, drop } from '@/lib/storage';
import type { Pack, Question } from '@/lib/types';

import { saveAsTemplate } from '../saveAsTemplate';
import type { Zone } from './blocks';
import { CoverPane, RoundPane } from './Panes';
import { setPath } from './paths';
import { Picker } from './Picker';
import { newRound, questionFrom, sameShape, type Preset } from './presets';
import { Preview } from './Preview';

type Where = 'cover' | number;
type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict';

interface Props {
  packId: string;
  title: string;
  initial: Pack;
  initialUpdatedAt: string;
  viewToken: string;
  /** 내가 주인이면 공유 설정으로 갈 수 있습니다 */
  mine: boolean;
  /** 문제집인지 템플릿인지 — 템플릿이면 공유 대신 '템플릿으로 돌아가기' 가 붙습니다 */
  kind: PackKind;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const COVER_LABEL = { cover: '표지', cheer: '표지 다음 장', stop: '규칙 장', finale: '마지막 장' } as const;

export function Editor({ packId, title, initial, initialUpdatedAt, viewToken, mine, kind }: Props) {
  const [pack, setPackState] = useState<Pack>(initial);
  const packRef = useRef<Pack>(initial);

  const [sel, setSel] = useState<Where>('cover');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [state, setState] = useState<SaveState>('clean');
  const [toastMsg, setToastMsg] = useState('');
  const [picker, setPicker] = useState<null | 'round' | 'question'>(null);

  /* 미리보기가 보여줄 장. 칸을 만질 때마다 따라갑니다 */
  const [focus, setFocus] = useState<PreviewTarget>({ type: 'cover' });
  const [reveal, setReveal] = useState(false);
  const focusOn = useCallback((t: PreviewTarget) => setFocus((prev) => (same(prev, t) ? prev : t)), []);

  const stamp = useRef(initialUpdatedAt);
  const undoStack = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingPath = useRef<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 방금 넣은 문제 — 그리고 나면 그 자리로 화면을 옮깁니다 */
  const scrollTo = useRef<string | null>(null);
  /** 라운드를 바꾸면서 미리보기를 라운드 표지가 아닌 다른 장으로 보내고 싶을 때 */
  const pendingFocus = useRef<PreviewTarget | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  /* ── 저장 ──────────────────────────────────────── */
  const save = useCallback(async () => {
    const body = JSON.stringify({ data: packRef.current, updatedAt: stamp.current });
    setState('saving');
    try {
      const res = await fetch('/api/packs/' + packId, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body,
      });
      const out = (await res.json()) as { updatedAt?: string; error?: string; conflict?: boolean };
      if (res.status === 409) {
        setState('conflict');
        return;
      }
      if (!res.ok) {
        setState('error');
        toast(out.error || '저장하지 못했습니다');
        return;
      }
      if (out.updatedAt) stamp.current = out.updatedAt;
      setState('saved');
    } catch {
      setState('error');
      toast('저장하지 못했습니다 — 인터넷을 확인해 주세요');
    }
  }, [packId, toast]);

  const scheduleSave = useCallback(() => {
    setState('dirty');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // 글자를 치는 동안에는 기다렸다가, 손을 뗀 뒤 한 번만 보냅니다
    saveTimer.current = setTimeout(() => void save(), 900);
  }, [save]);

  /** 기다리는 저장이 있으면 지금 바로 보냅니다 */
  const flush = useCallback(async () => {
    if (!saveTimer.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    await save();
  }, [save]);

  /* ── 고치기 ─────────────────────────────────────── */
  const pushUndo = useCallback(() => {
    undoStack.current.push(JSON.stringify(packRef.current));
    if (undoStack.current.length > 40) undoStack.current.shift();
    setCanUndo(true);
  }, []);

  const apply = useCallback(
    (next: Pack, snapshot = true) => {
      if (snapshot) {
        pushUndo();
        typingPath.current = null;
      }
      packRef.current = next;
      setPackState(next);
      scheduleSave();
    },
    [pushUndo, scheduleSave],
  );

  /** 글자를 칠 때. 되돌리기는 칸마다 한 번만 담습니다 */
  const typed = useCallback(
    (path: string, next: Pack) => {
      if (typingPath.current !== path) {
        pushUndo();
        typingPath.current = path;
      }
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        typingPath.current = null;
      }, 900);
      apply(next, false);
    },
    [apply, pushUndo],
  );

  /** 표지 · 라운드 칸 — 비우면 그 칸이 없어집니다 */
  const onSet = useCallback(
    (path: string, raw: string) => typed(path, setPath(packRef.current, path, raw)),
    [typed],
  );

  /** 문제 블록 칸 — 비워도 블록은 남아 있습니다 */
  const onPut = useCallback(
    (path: string, value: unknown) => typed(path, setPath(packRef.current, path, value, true)),
    [typed],
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    setCanUndo(undoStack.current.length > 0);
    if (!prev) return;
    const next = JSON.parse(prev) as Pack;
    packRef.current = next;
    setPackState(next);
    typingPath.current = null;
    scheduleSave();
    toast('되돌렸습니다');
  }, [scheduleSave, toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  /* 나가기 전에 저장이 안 끝났으면 붙잡습니다 */
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (state === 'dirty' || state === 'saving') e.preventDefault();
    };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [state]);

  /* 왼쪽에서 고른 곳으로 미리보기도 옮깁니다 */
  useEffect(() => {
    const t = pendingFocus.current;
    pendingFocus.current = null;
    focusOn(t ?? (sel === 'cover' ? { type: 'cover' } : { type: 'round', ri: sel }));
    setReveal(false);
  }, [sel, focusOn]);

  /* 방금 넣은 문제로 화면을 옮기고 첫 칸에 커서를 둡니다 */
  useEffect(() => {
    const id = scrollTo.current;
    if (!id) return;
    scrollTo.current = null;
    const el = document.querySelector<HTMLElement>(`[data-qid="${id}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.querySelector<HTMLElement>('.qbody input, .qbody textarea')?.focus({ preventScroll: true });
  }, [pack]);

  /* ── 라운드 ────────────────────────────────────── */
  const rounds = pack.rounds || [];
  const ri = typeof sel === 'number' ? sel : -1;

  const addRound = (p: Preset | null) => {
    const next = clone(packRef.current);
    const r = newRound(next.rounds || [], p);
    next.rounds = [...(next.rounds || []), r];
    const first = r.q?.[0];
    if (first?.id) {
      // 문제가 있는 라운드면 미리보기를 라운드 표지 대신 첫 문제로 보냅니다
      setOpen((s) => new Set(s).add(first.id!));
      scrollTo.current = first.id;
      pendingFocus.current = { type: 'q', ri: next.rounds.length - 1, qid: first.id };
    }
    apply(next);
    setPicker(null);
    setSel(next.rounds.length - 1);
  };

  const moveRound = (dir: number) => {
    if (ri < 0) return;
    const to = ri + dir;
    if (to < 0 || to >= rounds.length) return;
    const next = clone(packRef.current);
    const list = next.rounds;
    [list[ri], list[to]] = [list[to], list[ri]];
    apply(next);
    setSel(to);
  };

  const delRound = () => {
    if (ri < 0) return;
    const r = rounds[ri];
    if (!window.confirm(`"${r.t}" 라운드를 지울까요? 문제 ${(r.q || []).length}개가 같이 사라집니다.`)) return;
    const next = clone(packRef.current);
    next.rounds = next.rounds.filter((_, i) => i !== ri);
    if (!next.rounds.length) {
      toast('라운드가 하나는 있어야 합니다');
      return;
    }
    apply(next);
    setSel(Math.max(0, ri - 1));
  };

  /* ── 문제 ──────────────────────────────────────── */
  const withQs = (fn: (qs: Question[]) => Question[]) => {
    if (ri < 0) return;
    const next = clone(packRef.current);
    next.rounds[ri].q = fn(next.rounds[ri].q || []);
    apply(next);
  };

  /** 새 문제를 넣고, 펼치고, 미리보기도 그 문제로 */
  const pushQ = (it: Question) => {
    withQs((qs) => [...qs, it]);
    setOpen((s) => new Set(s).add(it.id!));
    scrollTo.current = it.id!;
    focusOn({ type: 'q', ri, qid: it.id! });
    setReveal(false);
  };

  const addSame = () => pushQ(sameShape(rounds[ri]?.q || []));
  const addPreset = (p?: Preset) => {
    if (!p) {
      setPicker('question');
      return;
    }
    setPicker(null);
    pushQ(questionFrom(p));
  };

  const patchQ = (i: number, fn: (it: Question) => Question) =>
    withQs((qs) => qs.map((it, k) => (k === i ? fn(it) : it)));
  const moveQ = (i: number, dir: number) =>
    withQs((qs) => {
      const to = i + dir;
      if (to < 0 || to >= qs.length) return qs;
      const list = [...qs];
      [list[i], list[to]] = [list[to], list[i]];
      return list;
    });
  const dupQ = (i: number) =>
    withQs((qs) => {
      const copy = { ...clone(qs[i]), id: newItemId() };
      return [...qs.slice(0, i + 1), copy, ...qs.slice(i + 1)];
    });
  const delQ = (i: number) => {
    const it = rounds[ri]?.q?.[i];
    if (!it) return;
    const label = it.g || it.q || it.a || '이 문제';
    if (!window.confirm(`"${label}" 을(를) 지울까요?`)) return;
    withQs((qs) => qs.filter((_, k) => k !== i));
    if (focus.type === 'q' && focus.qid === it.id) focusOn({ type: 'round', ri });
  };

  const toggleQ = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const onFocusQ = useCallback(
    (qid: string, zone: Zone) => {
      if (ri < 0) return;
      focusOn({ type: 'q', ri, qid });
      setReveal(zone === 'answer');
    },
    [ri, focusOn],
  );

  /* ── 앞뒤 장 ───────────────────────────────────── */
  const addStep = () => {
    const next = clone(packRef.current);
    next.stop ??= {};
    next.stop.steps = [...(next.stop.steps || []), { text: '' }];
    apply(next);
  };
  const delStep = (i: number) => {
    const next = clone(packRef.current);
    next.stop!.steps = (next.stop?.steps || []).filter((_, k) => k !== i);
    apply(next);
  };
  const setHot = (i: number, on: boolean) => {
    const next = clone(packRef.current);
    const steps = next.stop?.steps || [];
    if (steps[i]) {
      if (on) steps[i].hot = true;
      else delete steps[i].hot;
    }
    apply(next);
  };
  const addCard = () => {
    const next = clone(packRef.current);
    next.finale ??= {};
    next.finale.cards = [...(next.finale.cards || []), { face: '🎲', name: '', desc: '' }];
    apply(next);
  };
  const delCard = (i: number) => {
    const next = clone(packRef.current);
    next.finale!.cards = (next.finale?.cards || []).filter((_, k) => k !== i);
    apply(next);
  };

  /* ── 주고받기 ──────────────────────────────────── */
  const exportPack = () => {
    const blob = new Blob([JSON.stringify(packRef.current, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (packRef.current.title || '문제집') + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const importPack = (file: File) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const got = JSON.parse(String(fr.result)) as Pack;
        if (!got || !Array.isArray(got.rounds) || !got.rounds.length) throw new Error('모양이 다릅니다');
        if (!window.confirm('지금 문제집을 이 파일로 바꿀까요? 되돌리기(Ctrl+Z)로 한 번은 되돌릴 수 있습니다.')) return;
        // 이름표가 없는 문제에는 새로 붙여 줍니다
        got.rounds.forEach((r, i) => {
          r.id ??= 'r' + (i + 1);
          (r.q || []).forEach((it) => {
            it.id ??= newItemId();
          });
        });
        apply(got);
        setSel('cover');
        toast('불러왔습니다');
      } catch {
        toast('이 파일은 문제집이 아닌 것 같습니다');
      }
    };
    fr.readAsText(file);
  };

  const wipeLocal = () => {
    if (!window.confirm('이 브라우저에 저장된 팀 이름과 점수를 지울까요? 문제는 그대로입니다.')) return;
    drop(LS.teams);
    drop(LS.scores);
    drop(LS.yt);
    toast('점수와 팀 이름을 지웠습니다');
  };

  const [savingTpl, setSavingTpl] = useState(false);
  const toTemplate = async () => {
    setSavingTpl(true);
    await flush(); // 지금 화면의 내용이 템플릿에 들어가도록 먼저 저장합니다
    const out = await saveAsTemplate(packId, packRef.current.title || title);
    setSavingTpl(false);
    if (out.error) toast(out.error);
    if (out.id) toast('템플릿으로 저장했습니다 — 처음 화면의 템플릿 목록에 있습니다');
  };

  /* ── 미리보기 ──────────────────────────────────── */
  const built = useMemo(() => buildSlides(pack), [pack]);
  const at = findSlide(built, focus);
  const atSlide = at >= 0 ? built.slides[at] : undefined;
  const canReveal = hasAnswer(atSlide);
  const noRevealHint = (() => {
    if (atSlide?.type !== 'q') return '정답 상자가 없는 장입니다';
    const it = atSlide.item;
    // 정답 블록은 있는데 아직 비어 있으면, 적는 순간 정답 화면이 생깁니다
    if (it.a !== undefined || it.note !== undefined || it.list !== undefined || it.full !== undefined) {
      return '정답을 적으면 정답 공개 화면도 볼 수 있습니다';
    }
    return '정답 없이 → 한 번에 넘어가는 장입니다';
  })();
  const pvLabel = (() => {
    if (focus.type === 'round') return `${focus.ri + 1}라운드 표지`;
    if (focus.type === 'q') {
      const qi = (rounds[focus.ri]?.q || []).findIndex((q) => q.id === focus.qid);
      return `${focus.ri + 1}라운드 · ${atSlide?.type === 'q' && atSlide.item.tag ? atSlide.item.tag : 'Q' + (qi + 1)}`;
    }
    return COVER_LABEL[focus.type];
  })();
  const playHref = at < 0 ? null : '/play/' + viewToken + (at > 0 ? '#' + at : '');

  /* ── 화면 ──────────────────────────────────────── */
  const label: Record<SaveState, string> = {
    clean: '고치면 저절로 저장됩니다',
    dirty: '고치는 중…',
    saving: '저장하는 중…',
    saved: '저장했습니다',
    error: '저장하지 못했습니다',
    conflict: '다른 사람이 방금 고쳤습니다',
  };
  const where =
    sel === 'cover'
      ? '표지와 앞뒤 장의 글을 고칩니다'
      : `${ri + 1}번째 라운드 · ${(rounds[ri]?.q || []).length ? `문제 ${(rounds[ri]?.q || []).length}개` : '게임 한 장'}`;
  const isTpl = kind === 'template';

  return (
    <div className="ed">
      <header className="top">
        <a className="btn sm quiet" href={isTpl ? '/templates/' + packId : '/'}>
          ← {isTpl ? '템플릿' : '처음으로'}
        </a>
        <h1>
          {isTpl ? <span className="tpl-tag">템플릿</span> : null}
          {pack.title || title}
          <small>
            {where} · <b style={{ color: state === 'error' || state === 'conflict' ? '#ff6b81' : 'inherit' }}>{label[state]}</b>
          </small>
        </h1>
        <button className="btn sm" type="button" title="되돌리기 (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          ↶ 되돌리기
        </button>
        <details className="more-menu">
          <summary className="btn" title="더 보기">
            ⋯
          </summary>
          <div className="menu-pop">
            <button type="button" onClick={exportPack}>
              ⬇ 파일로 내보내기 (.json)
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}>
              ⬆ 파일에서 불러오기
            </button>
            <button type="button" className="danger" onClick={wipeLocal}>
              이 브라우저의 점수 · 팀 이름 지우기
            </button>
          </div>
        </details>
        {!isTpl ? (
          <button className="btn" type="button" onClick={toTemplate} disabled={savingTpl}>
            📑 템플릿으로 저장
          </button>
        ) : null}
        {!isTpl && mine ? (
          <a className="btn" href={'/share/' + packId}>
            🔗 공유
          </a>
        ) : null}
        <a className="btn go" href={'/play/' + viewToken} target="_blank" rel="noopener">
          ▶ 퀴즈 열기
        </a>
      </header>

      {state === 'conflict' ? (
        <p className="conflict">
          다른 사람이 방금 이 {isTpl ? '템플릿' : '문제집'}을 고쳤습니다. 덮어쓰지 않으려고 저장을 멈췄습니다 —{' '}
          <button className="btn sm" type="button" onClick={() => window.location.reload()}>
            새로고침
          </button>{' '}
          해서 최신 내용을 받아주세요. (지금 화면의 내용은 <b>⋯ → 파일로 내보내기</b> 로 먼저 챙겨두실 수 있습니다.)
        </p>
      ) : null}

      <main>
        <aside>
          <h2>전체</h2>
          <div className="rlist">
            <button
              className={'ritem' + (sel === 'cover' ? ' on' : '')}
              type="button"
              onClick={() => setSel('cover')}
            >
              <i style={{ ['--dot' as string]: '#ff4d5e' }} />
              <b>표지 · 앞뒤 장</b>
            </button>
          </div>
          <h2>라운드</h2>
          <div className="rlist">
            {rounds.map((r, i) => (
              <button
                key={r.id ?? i}
                className={'ritem' + (sel === i ? ' on' : '')}
                type="button"
                onClick={() => setSel(i)}
              >
                <i style={{ ['--dot' as string]: r.c || '#9a8db6' }} />
                <b>
                  {i + 1}. {r.t}
                </b>
                {(r.q || []).length ? <em>{(r.q || []).length}</em> : <em className="solo">한 장</em>}
              </button>
            ))}
          </div>
          <button className="btn sm add-round" type="button" onClick={() => setPicker('round')}>
            + 라운드 추가
          </button>
        </aside>

        <section className="pane">
          {sel === 'cover' ? (
            <CoverPane
              pack={pack}
              onSet={onSet}
              onFocusTarget={focusOn}
              onAddStep={addStep}
              onDelStep={delStep}
              onHot={setHot}
              onAddCard={addCard}
              onDelCard={delCard}
            />
          ) : (
            <RoundPane
              pack={pack}
              ri={ri}
              onSet={onSet}
              onFocusTarget={focusOn}
              open={open}
              onToggleQ={toggleQ}
              onPut={onPut}
              onPatchQ={patchQ}
              onMoveQ={moveQ}
              onDupQ={dupQ}
              onDelQ={delQ}
              onAddSame={addSame}
              onAddPreset={addPreset}
              onMoveRound={moveRound}
              onDelRound={delRound}
              onFocusQ={onFocusQ}
            />
          )}
        </section>

        <div className="pvcol">
          <Preview
            pack={pack}
            target={focus}
            reveal={canReveal && reveal}
            canReveal={canReveal}
            noRevealHint={noRevealHint}
            label={pvLabel}
            onReveal={setReveal}
            playHref={playHref}
          />
        </div>
      </main>

      {picker ? (
        <Picker
          mode={picker}
          onPick={(p) => (picker === 'round' ? addRound(p) : p && addPreset(p))}
          onClose={() => setPicker(null)}
        />
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importPack(f);
          e.target.value = '';
        }}
      />
      <div id="toast" role="status" className={toastMsg ? 'on' : undefined}>
        {toastMsg}
      </div>
    </div>
  );
}
