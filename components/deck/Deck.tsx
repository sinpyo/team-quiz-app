'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildSlides, hasAnswer, scoreKeyOf, type Slide } from '@/lib/buildSlides';
import { vars } from '@/lib/css';
import { LS, load, save } from '@/lib/storage';
import type { Pack, Scores, Team } from '@/lib/types';

import { Answer } from './Answer';
import { Bar } from './Bar';
import { Menu } from './Menu';
import { StatsBody } from './StatsBody';
import { WinPicker } from './WinPicker';
import { YouTubeBar, type YouTubeHandle } from './YouTubeBar';
import { useOffline } from './useOffline';
import {
  CheerBody,
  CoverBody,
  FinaleBody,
  QuestionBody,
  RoundBody,
  StopBody,
  TeamsBody,
  TocBody,
} from './bodies';

const DEFAULT_TEAMS: Team[] = [
  { id: 't1', name: '1팀' },
  { id: 't2', name: '2팀' },
];

interface Props {
  pack: Pack;
  /** 문제를 고칠 수 있는 사람이면 그 주소. 보기 권한만 있으면 비워 둡니다 */
  editHref?: string | null;
  /** 보기 권한만 있는 사람에게 '내 문제집으로 복사' 를 내줍니다 (이 문제집의 보기 링크 값) */
  copyFrom?: string | null;
}

export function Deck({ pack, editHref = null, copyFrom = null }: Props) {
  // 인터넷이 끊겨도 이 화면은 다시 열립니다
  useOffline();

  const built = useMemo(() => buildSlides(pack), [pack]);
  const { slides, rounds, roundStart, tocAt, statsAt, roundOfKey } = built;
  const total = slides.length;
  const canEdit = !!editHref;

  /* ── 넘기기 ─────────────────────────────────────── */
  const [cur, setCur] = useState(0);
  const curRef = useRef(0);

  // 정답이 열린 화면들. 넘어갈 때마다 그 화면의 상태를 새로 정합니다
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const revealedRef = useRef<Record<number, boolean>>({});
  const setReveal = useCallback((i: number, on: boolean) => {
    if (revealedRef.current[i] === on) return;
    revealedRef.current = { ...revealedRef.current, [i]: on };
    setRevealed(revealedRef.current);
  }, []);

  const ytRef = useRef<YouTubeHandle>(null);

  const show = useCallback(
    (i: number) => {
      const from = curRef.current;
      const to = Math.max(0, Math.min(total - 1, i));
      curRef.current = to;
      setCur(to);
      // 어느 방향으로 움직이든 문제 → 정답 차례가 흐트러지지 않게 맞춰 둡니다.
      // 앞으로 가면 문제부터, 뒤로 가면 그 화면의 정답부터 보입니다
      setReveal(to, to < from);
      // 장을 넘기면 노래는 멈춥니다 (정답 공개는 같은 장이라 계속 흘러갑니다)
      ytRef.current?.pause();
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', to ? '#' + to : window.location.pathname + window.location.search);
      }
    },
    [total, setReveal],
  );

  const next = useCallback(() => {
    const i = curRef.current;
    if (hasAnswer(slides[i]) && !revealedRef.current[i]) {
      setReveal(i, true);
      return;
    }
    if (i < total - 1) show(i + 1);
  }, [slides, total, show, setReveal]);

  // ← 를 누르면 정답을 먼저 덮어서, 문제만 있던 화면을 다시 볼 수 있습니다
  const prev = useCallback(() => {
    const i = curRef.current;
    if (hasAnswer(slides[i]) && revealedRef.current[i]) {
      setReveal(i, false);
      return;
    }
    if (i > 0) show(i - 1);
  }, [slides, show, setReveal]);

  // [ ] 로 라운드를 통째로 건너뜁니다. 지금 어디에 있든 라운드 첫 화면으로 갑니다
  const roundAt = useMemo(() => rounds.map((r) => roundStart[r.n]), [rounds, roundStart]);
  const jumpRound = useCallback(
    (dir: number) => {
      const i = curRef.current;
      if (dir > 0) {
        const nx = roundAt.find((at) => at > i);
        show(nx === undefined ? Math.max(i, statsAt) : nx);
        return;
      }
      let k = -1;
      for (let j = 0; j < roundAt.length; j++) if (roundAt[j] <= i) k = j;
      show(k > 0 ? roundAt[k - 1] : 0);
    },
    [roundAt, statsAt, show],
  );

  /* ── 팀 · 점수 ──────────────────────────────────── */
  const [teams, setTeamsState] = useState<Team[]>(DEFAULT_TEAMS);
  const teamsRef = useRef<Team[]>(DEFAULT_TEAMS);
  const seqRef = useRef(DEFAULT_TEAMS.length);
  const setTeams = useCallback((v: Team[]) => {
    teamsRef.current = v;
    setTeamsState(v);
    save(LS.teams, v);
  }, []);

  const [scores, setScoresState] = useState<Scores>({});
  const scoresRef = useRef<Scores>({});
  const setScores = useCallback((v: Scores) => {
    scoresRef.current = v;
    setScoresState(v);
    save(LS.scores, v);
  }, []);

  const [ytLinks, setYtLinksState] = useState<Record<string, string>>({});
  const ytLinksRef = useRef<Record<string, string>>({});
  const setYtLinks = useCallback((v: Record<string, string>) => {
    ytLinksRef.current = v;
    setYtLinksState(v);
    save(LS.yt, v);
  }, []);

  /* 서버에서 그린 화면과 어긋나지 않도록, 저장된 값은 켜진 뒤에 읽습니다 */
  useEffect(() => {
    const t = load<Team[]>(LS.teams, DEFAULT_TEAMS);
    if (Array.isArray(t) && t.length) {
      teamsRef.current = t;
      setTeamsState(t);
      seqRef.current = t.length;
    }
    const s = load<Scores>(LS.scores, {});
    scoresRef.current = s;
    setScoresState(s);
    const y = load<Record<string, string>>(LS.yt, {});
    ytLinksRef.current = y;
    setYtLinksState(y);

    const at = parseInt(window.location.hash.slice(1), 10);
    if (Number.isFinite(at) && at > 0) {
      curRef.current = Math.min(at, total - 1);
      setCur(curRef.current);
    }
  }, [total]);

  const addTeam = useCallback(() => {
    const list = teamsRef.current;
    const name = window.prompt('팀 이름을 입력하세요', list.length + 1 + '팀');
    if (name === null) return;
    seqRef.current += 1;
    setTeams([
      ...list,
      { id: 't' + Date.now().toString(36) + seqRef.current, name: name.trim() || list.length + 1 + '팀' },
    ]);
  }, [setTeams]);

  const renameTeam = useCallback(
    (id: string, name: string) => {
      setTeams(teamsRef.current.map((t) => (t.id === id ? { ...t, name } : t)));
    },
    [setTeams],
  );

  const deleteTeam = useCallback(
    (id: string) => {
      if (teamsRef.current.length <= 1) return;
      setTeams(teamsRef.current.filter((t) => t.id !== id));
    },
    [setTeams],
  );

  const pickWinner = useCallback(
    (key: string, teamId: string) => {
      const nx = { ...scoresRef.current };
      if (nx[key] === teamId) delete nx[key];
      else nx[key] = teamId;
      setScores(nx);
    },
    [setScores],
  );

  /* ── 알림 ───────────────────────────────────────── */
  const [toastMsg, setToastMsg] = useState('');
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToastMsg(''), 1800);
  }, []);

  // 기록을 모두 지웁니다 (팀 이름은 그대로 둡니다)
  const resetScores = useCallback(
    (toStart: boolean) => {
      setScores({});
      revealedRef.current = {};
      setRevealed({});
      if (toStart) {
        show(0);
        toast('처음부터 다시 시작합니다');
      } else {
        toast('점수를 지웠습니다');
      }
    },
    [setScores, show, toast],
  );

  /* ── 라운드 이동 메뉴 ───────────────────────────── */
  const [menuOn, setMenuOn] = useState(false);
  const menuOnRef = useRef(false);
  const toggleMenu = useCallback((on: boolean) => {
    menuOnRef.current = on;
    setMenuOn(on);
  }, []);

  /* ── 키보드 ─────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleMenu(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // 팀 이름 입력 중에도 넘기지 않습니다
      const t = e.target as HTMLElement | null;
      if (t && typeof t.matches === 'function' && t.matches('input, textarea')) return;

      const k = e.key.toLowerCase();
      if (k === 'm') {
        e.preventDefault();
        toggleMenu(!menuOnRef.current);
        return;
      }
      if (menuOnRef.current) return;

      if (k === 'arrowright' || k === ' ' || k === 'enter' || k === 'pagedown') {
        e.preventDefault();
        next();
      } else if (k === 'arrowleft' || k === 'pageup' || k === 'backspace') {
        e.preventDefault();
        prev();
      } else if (k === '[') {
        e.preventDefault();
        jumpRound(-1);
      } else if (k === ']') {
        e.preventDefault();
        jumpRound(1);
      } else if (k === 'home') {
        e.preventDefault();
        show(0);
      } else if (k === 'end') {
        e.preventDefault();
        show(total - 1);
      } else if (k === 'e') {
        if (!editHref) return;
        e.preventDefault();
        window.location.href = editHref;
      } else if (k === 'p') {
        e.preventDefault();
        ytRef.current?.act('toggle');
      } else if (k === 'f') {
        e.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, jumpRound, show, toggleMenu, total, editHref]);

  /* ── 화면 제목 ──────────────────────────────────── */
  useEffect(() => {
    if (pack.title) document.title = pack.title;
  }, [pack.title]);

  /* 퀴즈를 보는 동안에만 바탕이 안 밀리게 합니다.
     목록 같은 보통 화면으로 넘어가면 다시 스크롤됩니다 */
  useEffect(() => {
    document.body.classList.add('deck');
    return () => document.body.classList.remove('deck');
  }, []);

  /* ── 내 문제집으로 복사 (보기 권한만 있는 사람) ── */
  const [copying, setCopying] = useState(false);
  const copyToMine = useCallback(async () => {
    if (!copyFrom || copying) return;
    setCopying(true);
    try {
      const res = await fetch('/api/packs/copy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: copyFrom }),
      });
      if (res.status === 401) {
        // 로그인하고 돌아오면 바로 이어서 복사합니다
        window.location.href = '/api/auth/kakao?next=' + encodeURIComponent(window.location.pathname + '?copy=1');
        return;
      }
      const out = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !out.id) {
        toast(out.error || '복사하지 못했습니다');
        setCopying(false);
        return;
      }
      window.location.href = '/edit/' + out.id;
    } catch {
      toast('복사하지 못했습니다');
      setCopying(false);
    }
  }, [copyFrom, copying, toast]);

  /* 로그인하고 돌아왔으면 이어서 복사합니다 */
  useEffect(() => {
    if (!copyFrom) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('copy') === '1') void copyToMine();
    // 한 번만 시도합니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copyFrom]);

  /* ── 지금 화면의 노래 ───────────────────────────── */
  const here = slides[cur];
  const songKey = here && here.type === 'q' && here.item.yt ? scoreKeyOf(here) : null;
  const videoId = songKey ? ytLinks[songKey] || (here.type === 'q' ? here.item.yt ?? null : null) : null;

  const relink = useCallback(
    (key: string, id: string) => {
      setYtLinks({ ...ytLinksRef.current, [key]: id });
    },
    [setYtLinks],
  );

  /* ── 그리기 ─────────────────────────────────────── */
  const body = (s: Slide, i: number) => {
    switch (s.type) {
      case 'cover':
        return <CoverBody pack={pack} canEdit={canEdit} />;
      case 'cheer':
        return <CheerBody pack={pack} />;
      case 'toc':
        return <TocBody rounds={rounds} roundStart={roundStart} onGo={show} />;
      case 'stop':
        return <StopBody pack={pack} />;
      case 'teams':
        return <TeamsBody teams={teams} onRename={renameTeam} onDelete={deleteTeam} onAdd={addTeam} />;
      case 'stats':
        return (
          <StatsBody
            rounds={rounds}
            teams={teams}
            scores={scores}
            roundOfKey={roundOfKey}
            onRestart={() => {
              if (window.confirm('점수를 모두 지우고 표지로 돌아갈까요? 팀 이름은 그대로 둡니다.')) resetScores(true);
            }}
            onClear={() => {
              if (window.confirm('기록된 점수를 모두 지울까요?')) resetScores(false);
            }}
          />
        );
      case 'finale':
        return <FinaleBody pack={pack} />;
      case 'round':
        return <RoundBody r={s.r} />;
      case 'q':
        return <QuestionBody item={s.item} i={s.i} />;
      default:
        return null;
    }
  };

  const foot = (s: Slide, i: number) => {
    const key = scoreKeyOf(s);
    if (!key) return null;
    const withAnswer = hasAnswer(s);
    const open = withAnswer ? !!revealed[i] : true;
    return (
      <div className="foot">
        {s.type === 'q' ? <Answer item={s.item} open={!!revealed[i]} /> : null}
        <WinPicker
          label={s.type === 'q' || s.type === 'round' ? s.scoreLabel : ''}
          teams={teams}
          won={scores[key]}
          open={open}
          onPick={(teamId) => pickWinner(key, teamId)}
          onAddTeam={addTeam}
        />
      </div>
    );
  };

  const padded = (s: Slide) =>
    s.type === 'q' ? false : s.type === 'round' ? !s.scoreKey : true;

  return (
    <>
      {/* 150장을 모두 그려 둡니다. 지금 장만 .on 이 붙어 보이고, 나머지는 숨어 있습니다.
          Ctrl+P 로 뽑을 때 인쇄 규칙이 전부 펼치므로 이 구조라야 150쪽이 나옵니다 */}
      <main id="deck" aria-live="polite">
        {slides.map((s, i) => {
          const shown = hasAnswer(s) && !!revealed[i];
          return (
            <section
              key={i}
              className={
                'slide' + (padded(s) ? ' pad' : '') + (i === cur ? ' on' : '') + (shown ? ' shown' : '')
              }
              style={vars({ '--accent': s.c })}
            >
              <Bar
                slide={s}
                rounds={rounds}
                roundStart={roundStart}
                tocAt={tocAt}
                onGo={show}
                onMenu={() => toggleMenu(true)}
              />
              {body(s, i)}
              {foot(s, i)}
            </section>
          );
        })}
      </main>

      <div id="dock">
        <YouTubeBar ref={ytRef} videoId={videoId} songKey={songKey} onRelink={relink} onToast={toast} />
        <div id="rail">
          <i style={{ width: (((cur + 1) / total) * 100).toFixed(2) + '%' }} />
        </div>
      </div>

      {canEdit ? (
        <div id="tools">
          <a id="btn-admin" href={editHref}>
            ✏️ 문제 고치기
          </a>
        </div>
      ) : copyFrom ? (
        <div id="tools">
          {/* 보기 권한만 있는 사람은 못 고칩니다. 대신 자기 것으로 베껴 갈 수 있습니다 */}
          <button id="btn-admin" type="button" onClick={copyToMine} disabled={copying}>
            {copying ? '복사하는 중…' : '📄 내 문제집으로 복사'}
          </button>
        </div>
      ) : null}

      <div id="toast" role="status" className={toastMsg ? 'on' : undefined}>
        {toastMsg}
      </div>

      <Menu built={built} pack={pack} on={menuOn} onGo={show} onClose={() => toggleMenu(false)} />
    </>
  );
}
