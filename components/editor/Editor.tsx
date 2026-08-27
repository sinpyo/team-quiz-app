'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { newItemId } from '@/lib/ids';
import { LS, drop } from '@/lib/storage';
import type { Pack, Question } from '@/lib/types';

import { CoverPane, RoundPane } from './Panes';
import { blankRound, changeKind, kindOf, readField, setPath, type KindValue } from './paths';

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
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function Editor({ packId, title, initial, initialUpdatedAt, viewToken, mine }: Props) {
  const [pack, setPackState] = useState<Pack>(initial);
  const packRef = useRef<Pack>(initial);

  const [sel, setSel] = useState<Where>('cover');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [state, setState] = useState<SaveState>('clean');
  const [toastMsg, setToastMsg] = useState('');

  const stamp = useRef(initialUpdatedAt);
  const undoStack = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingPath = useRef<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ── 고치기 ─────────────────────────────────────── */
  const pushUndo = useCallback(() => {
    undoStack.current.push(JSON.stringify(packRef.current));
    if (undoStack.current.length > 40) undoStack.current.shift();
    setCanUndo(true);
  }, []);

  const apply = useCallback(
    (next: Pack, snapshot = true) => {
      if (snapshot) pushUndo();
      packRef.current = next;
      setPackState(next);
      scheduleSave();
    },
    [pushUndo, scheduleSave],
  );

  /** 칸에 글자를 칠 때. 되돌리기는 칸마다 한 번만 담습니다 */
  const onSet = useCallback(
    (path: string, raw: string) => {
      if (typingPath.current !== path) {
        pushUndo();
        typingPath.current = path;
      }
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        typingPath.current = null;
      }, 900);

      apply(setPath(packRef.current, path, readField(path, raw)), false);
    },
    [apply, pushUndo],
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    setCanUndo(undoStack.current.length > 0);
    if (!prev) return;
    const next = JSON.parse(prev) as Pack;
    packRef.current = next;
    setPackState(next);
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

  /* ── 라운드 ────────────────────────────────────── */
  const rounds = pack.rounds || [];
  const ri = typeof sel === 'number' ? sel : -1;

  const addRound = () => {
    const next = clone(packRef.current);
    next.rounds = [...(next.rounds || []), blankRound((next.rounds || []).length + 1)];
    apply(next);
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

  const addQ = () => withQs((qs) => [...qs, { id: newItemId(), k: 'cho', g: '' }]);
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
  const delQ = (i: number) =>
    withQs((qs) => {
      const it = qs[i];
      const label = it.g || it.q || it.a || '이 문제';
      if (!window.confirm(`"${label}" 을(를) 지울까요?`)) return qs;
      return qs.filter((_, k) => k !== i);
    });
  const setKind = (i: number, v: KindValue) =>
    withQs((qs) => qs.map((it, k) => (k === i ? changeKind(it, v) : it)));

  const toggleQ = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

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
      : `${ri + 1}번째 라운드 · 문제 ${(rounds[ri]?.q || []).length}개`;

  return (
    <div className="ed">
      <header className="top">
        <h1>
          문제 고치기
          <small>
            {where} · <b style={{ color: state === 'error' || state === 'conflict' ? '#ff6b81' : 'inherit' }}>{label[state]}</b>
          </small>
        </h1>
        <button className="btn sm" type="button" title="되돌리기 (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          ↶ 되돌리기
        </button>
        <button className="btn" type="button" onClick={exportPack}>
          ⬇ 문제집 내보내기
        </button>
        <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
          ⬆ 불러오기
        </button>
        <button className="btn danger" type="button" onClick={wipeLocal}>
          점수·팀 지우기
        </button>
        {mine ? (
          <a className="btn" href={'/share/' + packId}>
            🔗 공유
          </a>
        ) : null}
        <a className="btn" href="/">
          내 문제집
        </a>
        <a className="btn go" href={'/play/' + viewToken} target="_blank" rel="noopener">
          ▶ 퀴즈 열기
        </a>
      </header>

      {state === 'conflict' ? (
        <p style={{ margin: '.6rem 1rem 0', padding: '.7em .9em', borderRadius: 10, background: '#3a1a25', color: '#ffc9c9', fontSize: '.86rem' }}>
          다른 사람이 방금 이 문제집을 고쳤습니다. 덮어쓰지 않으려고 저장을 멈췄습니다 —{' '}
          <button className="btn sm" type="button" onClick={() => window.location.reload()}>
            새로고침
          </button>{' '}
          해서 최신 내용을 받아주세요. (지금 화면의 내용은 <b>⬇ 문제집 내보내기</b> 로 먼저 챙겨두실 수 있습니다.)
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
                <em>{(r.q || []).length}</em>
              </button>
            ))}
          </div>
          <button className="btn sm" type="button" onClick={addRound}>
            + 라운드 추가
          </button>
        </aside>

        <section className="pane">
          {sel === 'cover' ? (
            <CoverPane
              pack={pack}
              onSet={onSet}
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
              open={open}
              onToggleQ={toggleQ}
              onKind={setKind}
              onMoveQ={moveQ}
              onDupQ={dupQ}
              onDelQ={delQ}
              onAddQ={addQ}
              onMoveRound={moveRound}
              onDelRound={delRound}
            />
          )}
        </section>
      </main>

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
