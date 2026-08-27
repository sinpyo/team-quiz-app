'use client';

import type { Pack, Question } from '@/lib/types';
import { Area, Field, Text } from './Field';
import { QuestionCard } from './QuestionCard';
import type { KindValue } from './paths';

interface Common {
  pack: Pack;
  onSet: (path: string, raw: string) => void;
}

/* ── 표지 · 앞뒤 장 ───────────────────────────────── */

interface CoverProps extends Common {
  onAddStep: () => void;
  onDelStep: (i: number) => void;
  onHot: (i: number, on: boolean) => void;
  onAddCard: () => void;
  onDelCard: (i: number) => void;
}

export function CoverPane({ pack, onSet, onAddStep, onDelStep, onHot, onAddCard, onDelCard }: CoverProps) {
  const ch = pack.cheer || {};
  const st = pack.stop || {};
  const f = pack.finale || {};
  const noteStyle = { fontStyle: 'normal' as const, textTransform: 'none' as const, letterSpacing: 0 };

  return (
    <>
      <div className="card">
        <h2>표지</h2>
        <div className="grid two">
          <Field label="제목">
            <Text path="title" value={pack.title || ''} onSet={onSet} />
          </Field>
          <Field label="작은 머리글" hint="제목 위 빨간 글씨">
            <Text path="kicker" value={pack.kicker || ''} onSet={onSet} />
          </Field>
        </div>
        <div className="grid two" style={{ marginTop: '.7rem' }}>
          <Field label="한 줄 설명">
            <Text path="lede" value={pack.lede || ''} onSet={onSet} />
          </Field>
          <Field label="제목 위 그림" hint="이모티콘 하나 · 비우면 안 나옵니다">
            <Text path="face" value={pack.face || ''} onSet={onSet} big />
          </Field>
        </div>
      </div>

      <div className="card">
        <h2>
          표지 다음 장 <em style={noteStyle}>— 다 비우면 이 장은 안 나옵니다</em>
        </h2>
        <div className="grid two">
          <Field label="작은 머리글">
            <Text path="cheer.kicker" value={ch.kicker || ''} onSet={onSet} />
          </Field>
          <Field label="큰 글씨" hint="예: 다 같이 한 잔!">
            <Text path="cheer.head" value={ch.head || ''} onSet={onSet} />
          </Field>
        </div>
        <div style={{ marginTop: '.7rem' }}>
          <Field label="아래 한 줄">
            <Text path="cheer.foot" value={ch.foot || ''} onSet={onSet} />
          </Field>
        </div>
      </div>

      <div className="card">
        <h2>
          규칙 장 <em style={noteStyle}>— 다 비우면 이 장은 안 나옵니다</em>
        </h2>
        <div className="grid two">
          <Field label="작은 머리글">
            <Text path="stop.kicker" value={st.kicker || ''} onSet={onSet} />
          </Field>
          <Field label="제목" hint="예: 스톱워치">
            <Text path="stop.head" value={st.head || ''} onSet={onSet} />
          </Field>
        </div>
        <div style={{ marginTop: '.7rem' }}>
          <Field label="한 줄 설명">
            <Text path="stop.sub" value={st.sub || ''} onSet={onSet} />
          </Field>
        </div>
        <h2 style={{ marginTop: '1rem' }}>차례대로 적는 규칙</h2>
        <div className="grid">
          {(st.steps || []).map((it, i) => (
            <div className="row" key={i} style={{ gap: '.5rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '12rem' }}>
                <Field label={`${i + 1}번`}>
                  <Text path={`stop.steps.${i}.text`} value={it.text || ''} onSet={onSet} />
                </Field>
              </div>
              <label className="f" style={{ flex: 'none' }}>
                <span>강조</span>
                <input
                  type="checkbox"
                  checked={!!it.hot}
                  onChange={(e) => onHot(i, e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem' }}
                />
              </label>
              <button className="btn sm danger" type="button" onClick={() => onDelStep(i)}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <button className="btn sm" type="button" style={{ marginTop: '.6rem' }} onClick={onAddStep}>
          + 규칙 추가
        </button>
      </div>

      <div className="card">
        <h2>마지막 장</h2>
        <div className="grid two">
          <Field label="작은 머리글">
            <Text path="finale.kicker" value={f.kicker || ''} onSet={onSet} />
          </Field>
          <Field label="제목">
            <Text path="finale.head" value={f.head || ''} onSet={onSet} />
          </Field>
        </div>
        <div style={{ marginTop: '.7rem' }}>
          <Field label="맺음말">
            <Text path="finale.foot" value={f.foot || ''} onSet={onSet} />
          </Field>
        </div>
        <h2 style={{ marginTop: '1rem' }}>다음에 할 게임</h2>
        <div className="grid">
          {(f.cards || []).map((c, i) => (
            <div className="row" key={i} style={{ gap: '.5rem', alignItems: 'flex-end' }}>
              <div style={{ width: '4.5rem' }}>
                <Field label="그림">
                  <Text path={`finale.cards.${i}.face`} value={c.face || ''} onSet={onSet} big />
                </Field>
              </div>
              <div style={{ flex: 1, minWidth: '8rem' }}>
                <Field label="이름">
                  <Text path={`finale.cards.${i}.name`} value={c.name || ''} onSet={onSet} />
                </Field>
              </div>
              <div style={{ flex: 2, minWidth: '10rem' }}>
                <Field label="설명">
                  <Text path={`finale.cards.${i}.desc`} value={c.desc || ''} onSet={onSet} />
                </Field>
              </div>
              <button className="btn sm danger" type="button" onClick={() => onDelCard(i)}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <button className="btn sm" type="button" style={{ marginTop: '.6rem' }} onClick={onAddCard}>
          + 게임 추가
        </button>
      </div>
    </>
  );
}

/* ── 라운드 하나 ──────────────────────────────────── */

interface RoundProps extends Common {
  ri: number;
  open: Set<string>;
  onToggleQ: (id: string) => void;
  onKind: (i: number, v: KindValue) => void;
  onMoveQ: (i: number, dir: number) => void;
  onDupQ: (i: number) => void;
  onDelQ: (i: number) => void;
  onAddQ: () => void;
  onMoveRound: (dir: number) => void;
  onDelRound: () => void;
}

export function RoundPane({
  pack,
  ri,
  onSet,
  open,
  onToggleQ,
  onKind,
  onMoveQ,
  onDupQ,
  onDelQ,
  onAddQ,
  onMoveRound,
  onDelRound,
}: RoundProps) {
  const r = pack.rounds[ri];
  if (!r) return null;
  const qs: Question[] = r.q || [];

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '.7rem' }}>
          <h2 style={{ margin: 0 }}>라운드 {ri + 1}</h2>
          <div className="qtools">
            <button className="btn sm" type="button" title="위로" onClick={() => onMoveRound(-1)}>↑</button>
            <button className="btn sm" type="button" title="아래로" onClick={() => onMoveRound(1)}>↓</button>
            <button className="btn sm danger" type="button" onClick={onDelRound}>
              라운드 삭제
            </button>
          </div>
        </div>

        <div className="grid two">
          <Field label="라운드 이름">
            <Text path={`rounds.${ri}.t`} value={r.t || ''} onSet={onSet} />
          </Field>
          <label className="f">
            <span>색</span>
            <span className="swatch">
              <input type="color" value={r.c || '#9a8db6'} onChange={(e) => onSet(`rounds.${ri}.c`, e.target.value)} />
              <Text path={`rounds.${ri}.c`} value={r.c || ''} onSet={onSet} />
            </span>
          </label>
        </div>

        <div style={{ marginTop: '.7rem' }}>
          <Field label="꼬리표" hint="이름 위 작은 글씨 · 없어도 됩니다">
            <Text path={`rounds.${ri}.tag`} value={r.tag || ''} onSet={onSet} />
          </Field>
        </div>
        <div style={{ marginTop: '.7rem' }}>
          <Field label="하는 방법" hint="라운드 표지에 나옵니다">
            <Area path={`rounds.${ri}.how`} value={r.how || ''} onSet={onSet} rows={3} />
          </Field>
        </div>
        <div style={{ marginTop: '.7rem' }}>
          <Field label="벌칙">
            <Text path={`rounds.${ri}.pen`} value={r.pen || ''} onSet={onSet} />
          </Field>
        </div>
        <p className="hint">
          문제를 하나도 넣지 않으면 라운드 표지 한 장만 나옵니다 (줄자·그림 잇기처럼 화면이 필요 없는 게임).
        </p>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', margin: '0 .2rem .5rem' }}>
        <h2 style={{ margin: 0 }}>문제 {qs.length}개</h2>
        <button className="btn sm" type="button" onClick={onAddQ}>
          + 문제 추가
        </button>
      </div>

      {qs.length ? (
        qs.map((it, i) => (
          <QuestionCard
            key={it.id ?? i}
            it={it}
            i={i}
            ri={ri}
            open={open.has(it.id ?? String(i))}
            onToggle={() => onToggleQ(it.id ?? String(i))}
            onSet={onSet}
            onKind={onKind}
            onMove={onMoveQ}
            onDup={onDupQ}
            onDel={onDelQ}
          />
        ))
      ) : (
        <p className="empty">아직 문제가 없습니다. 화면이 필요 없는 게임이면 이대로 두세요.</p>
      )}
    </>
  );
}
