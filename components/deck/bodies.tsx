'use client';

import { vars } from '@/lib/css';
import type { NumberedRound } from '@/lib/buildSlides';
import type { Pack, Question, Team } from '@/lib/types';

/* ── 표지 ─────────────────────────────────────────── */

export function CoverBody({ pack, canEdit }: { pack: Pack; canEdit: boolean }) {
  return (
    <div className="cover">
      {pack.face ? <div className="taegeuk">{pack.face}</div> : null}
      {pack.kicker ? <span className="kicker">{pack.kicker}</span> : null}
      <h1>{pack.title || '퀴즈'}</h1>
      {pack.lede ? <p className="lede">{pack.lede}</p> : null}
      <div className="keys">
        <span>
          <kbd>→</kbd> 정답 공개 · 다음
        </span>
        <span>
          <kbd>←</kbd> 이전
        </span>
        <span>
          <kbd>[</kbd> <kbd>]</kbd> 라운드 건너뛰기
        </span>
        <span>
          <kbd>P</kbd> 노래 재생 · 멈춤
        </span>
        <span>
          <kbd>F</kbd> 전체화면
        </span>
        <span>
          <kbd>M</kbd> 라운드 이동
        </span>
        {/* 고칠 수 있는 사람에게만 알려줍니다 */}
        {canEdit ? (
          <span>
            <kbd>E</kbd> 문제 고치기
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ── 시작 인사 ────────────────────────────────────── */

export function CheerBody({ pack }: { pack: Pack }) {
  const c = pack.cheer || {};
  return (
    <div className="cheer">
      {c.kicker ? <span className="kicker">{c.kicker}</span> : null}
      {c.head ? <h2>{c.head}</h2> : null}
      {c.foot ? <p className="toast">{c.foot}</p> : null}
    </div>
  );
}

/* ── 목차 ─────────────────────────────────────────── */

export function TocBody({
  rounds,
  roundStart,
  onGo,
}: {
  rounds: NumberedRound[];
  roundStart: Record<number, number>;
  onGo: (i: number) => void;
}) {
  return (
    <div className="toc">
      <div className="toc-head">
        <h2>오늘의 순서</h2>
        <span className="always">
          <i>ALWAYS</i> 스톱워치는 처음부터 끝까지
        </span>
      </div>
      <ol>
        {rounds.map((r) => (
          <li key={r.n}>
            <button type="button" style={vars({ '--jc': r.c })} onClick={() => onGo(roundStart[r.n])}>
              <i>{r.n}</i>
              <b>{r.t}</b>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── 상시 게임 ────────────────────────────────────── */

export function StopBody({ pack }: { pack: Pack }) {
  const p = pack.stop || {};
  return (
    <div className="rules">
      {p.kicker ? <span className="kicker">{p.kicker}</span> : null}
      {p.head ? <h2>{p.head}</h2> : null}
      {p.sub ? <p className="sub">{p.sub}</p> : null}
      <ol>
        {(p.steps || []).map((it, i) => (
          <li key={i} className={it.hot ? 'hot' : undefined}>
            <i>{i + 1}</i>
            <span>{it.text || ''}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── 팀 이름 정하기 ───────────────────────────────── */

export function TeamsBody({
  teams,
  onRename,
  onDelete,
  onAdd,
}: {
  teams: Team[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="teams">
      <h2>팀 이름 정하기</h2>
      <p className="lede">여기서 정한 이름이 아래 점수판에 그대로 나옵니다. 게임 중에도 추가할 수 있어요</p>
      <div className="fields">
        {teams.map((t, i) => (
          <div className="row" key={t.id}>
            <i>{i + 1}</i>
            <input
              type="text"
              value={t.name}
              maxLength={14}
              placeholder="팀 이름"
              onChange={(e) => onRename(t.id, e.target.value)}
            />
            <button type="button" aria-label="삭제" onClick={() => onDelete(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="btn-add" type="button" onClick={onAdd}>
        + 팀 추가
      </button>
    </div>
  );
}

/* ── 라운드 표지 ──────────────────────────────────── */

export function RoundBody({ r }: { r: NumberedRound }) {
  return (
    <div
      className="rcard"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 'clamp(.6rem,2vh,1.2rem)',
      }}
    >
      <span
        className="rnum"
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 'clamp(3.2rem,15vh,8.5rem)',
          fontWeight: 800,
          lineHeight: '.9',
          letterSpacing: '-.04em',
          color: 'var(--accent)',
        }}
      >
        {String(r.n).padStart(2, '0')}
      </span>
      {r.tag ? <span className="kicker">{r.tag}</span> : null}
      <h2 style={{ margin: 0, fontSize: 'clamp(1.7rem,6.2vh,3.8rem)', fontWeight: 800, letterSpacing: '-.035em' }}>
        {r.t}
      </h2>
      {r.how ? (
        <p
          style={{
            margin: 0,
            maxWidth: '38ch',
            fontSize: 'clamp(.9rem,2.3vh,1.2rem)',
            lineHeight: 1.6,
            color: 'var(--mute)',
          }}
        >
          {r.how}
        </p>
      ) : null}
      {r.pen ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.5em',
            padding: '.55em 1.1em',
            border: '1px solid color-mix(in oklab,var(--accent) 40%,transparent)',
            borderRadius: '999px',
            background: 'color-mix(in oklab,var(--accent) 10%,transparent)',
            fontSize: 'clamp(.8rem,1.95vh,1.02rem)',
            fontWeight: 700,
          }}
        >
          🍺 {r.pen}
        </span>
      ) : null}
    </div>
  );
}

/* ── 문제 ─────────────────────────────────────────── */

// 이모티콘은 두 글자처럼 보여도 실제로는 한 덩어리라 이렇게 세야 합니다
function glyphCount(str: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('ko', { granularity: 'grapheme' });
    return [...seg.segment(str)].length;
  }
  return [...str].length;
}

// 초성이나 이모티콘이 길면 화면 밖으로 나가지 않게 글자 크기를 낮춥니다
function glyphSize(it: Question): string {
  const g = it.g || '';
  // 점 세 개짜리 기호처럼 글자는 하나인데 작게 보이는 것은 따로 키웁니다
  if (it.size) return ' ' + it.size;
  if (it.k === 'cho') {
    const n = g.replace(/\s/g, '').length;
    return n > 10 ? ' sm' : n > 5 ? ' md' : '';
  }
  if (it.k === 'emoji') {
    const n = glyphCount(g);
    return n > 4 ? ' sm' : n > 2 ? ' md' : '';
  }
  if (it.k === 'sym') {
    const n = g.replace(/\s/g, '').length;
    return n > 8 ? ' sm' : n > 4 ? ' md' : '';
  }
  return '';
}

export function QuestionBody({ item, i }: { item: Question; i: number }) {
  const size = glyphSize(item);
  // 앨범 사진이 따로 없는 노래는 유튜브 표지를 대신 씁니다 (새 노래를 넣어도 사진이 붙습니다)
  const artSrc =
    item.art || (item.yt && !item.artText ? 'https://img.youtube.com/vi/' + item.yt + '/hqdefault.jpg' : '');
  const hasArt = !!(artSrc || item.artText);

  return (
    <div className="stage">
      {/* 문제 번호는 화면 가운데 위쪽 — 보너스 문제는 번호 대신 이름이 뜹니다 */}
      {item.tag ? (
        <div className="qno tag">{item.tag}</div>
      ) : (
        <div className="qno">
          <em>Q</em>
          <b>{i}</b>
        </div>
      )}
      {item.g ? <div className={`glyph ${item.k ?? ''}${size}${hasArt ? ' note' : ''}`}>{item.g}</div> : null}
      {artSrc ? (
        <figure className="art">
          {/* 유튜브 표지는 바깥 주소라 next/image 를 쓰지 않습니다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artSrc} alt="앨범 사진" />
        </figure>
      ) : item.artText ? (
        <figure className="art none">
          <em>ALBUM</em>
          <span>{item.artText}</span>
        </figure>
      ) : null}
      {item.q ? <p className={'qtext' + (item.q.length > 45 ? ' long' : '')}>{item.q}</p> : null}
      {item.s ? <p className="qsub">{item.s}</p> : null}
      {item.opts ? (
        <div className="opts">
          {item.opts.map((o, k) => (
            <span key={k}>{o}</span>
          ))}
        </div>
      ) : null}
      {item.roles ? (
        <div className="roles">
          {item.roles.map((r, k) => (
            <span key={k}>{r}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── 다음 순서 예고 ───────────────────────────────── */

export function FinaleBody({ pack }: { pack: Pack }) {
  const f = pack.finale || {};
  return (
    <div className="finale">
      {f.kicker ? <span className="kicker">{f.kicker}</span> : null}
      {f.head ? <h2>{f.head}</h2> : null}
      <div className="lineup">
        {(f.cards || []).map((c, i) => (
          <div className="card" key={i}>
            <div className="face">{c.face || ''}</div>
            <b>{c.name || ''}</b>
            {c.desc ? <em>{c.desc}</em> : null}
          </div>
        ))}
      </div>
      {f.foot ? <p className="plead">{f.foot}</p> : null}
    </div>
  );
}
