'use client';

import type { PreviewTarget } from '@/lib/previewTarget';
import type { Pack, Question } from '@/lib/types';
import type { Zone } from './blocks';
import { Area, Field, Text } from './Field';
import { PresetGrid } from './Picker';
import type { Preset } from './presets';
import { QuestionCard } from './QuestionCard';

interface Common {
  pack: Pack;
  onSet: (path: string, raw: string) => void;
  /** 이 칸을 만지면 미리보기가 그 장으로 갑니다 */
  onFocusTarget: (t: PreviewTarget) => void;
}

/* ── 표지 · 앞뒤 장 ───────────────────────────────── */

interface CoverProps extends Common {
  onAddStep: () => void;
  onDelStep: (i: number) => void;
  onHot: (i: number, on: boolean) => void;
  onAddCard: () => void;
  onDelCard: (i: number) => void;
}

export function CoverPane({ pack, onSet, onFocusTarget, onAddStep, onDelStep, onHot, onAddCard, onDelCard }: CoverProps) {
  const ch = pack.cheer || {};
  const st = pack.stop || {};
  const f = pack.finale || {};
  const noteStyle = { fontStyle: 'normal' as const, textTransform: 'none' as const, letterSpacing: 0 };
  const watch = (type: 'cover' | 'cheer' | 'stop' | 'finale') => ({
    onFocusCapture: () => onFocusTarget({ type }),
    onPointerDown: () => onFocusTarget({ type }),
  });

  return (
    <>
      <div className="card" {...watch('cover')}>
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

      <div className="card" {...watch('cheer')}>
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

      <div className="card" {...watch('stop')}>
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

      <div className="card" {...watch('finale')}>
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
  onPut: (path: string, value: unknown) => void;
  onPatchQ: (i: number, fn: (it: Question) => Question) => void;
  onMoveQ: (i: number, dir: number) => void;
  onDupQ: (i: number) => void;
  onDelQ: (i: number) => void;
  /** 마지막 문제와 같은 모양으로 하나 더 */
  onAddSame: () => void;
  /** 유형을 골라서 하나 더 — preset 이 없으면 고르는 창을 엽니다 */
  onAddPreset: (p?: Preset) => void;
  onMoveRound: (dir: number) => void;
  onDelRound: () => void;
  onFocusQ: (qid: string, zone: Zone) => void;
}

export function RoundPane(props: RoundProps) {
  const { pack, ri, onSet, onFocusTarget, open, onToggleQ, onPut, onPatchQ, onMoveQ, onDupQ, onDelQ } = props;
  const { onAddSame, onAddPreset, onMoveRound, onDelRound, onFocusQ } = props;
  const r = pack.rounds[ri];
  if (!r) return null;
  const qs: Question[] = r.q || [];
  const watchRound = {
    onFocusCapture: () => onFocusTarget({ type: 'round', ri }),
    onPointerDown: () => onFocusTarget({ type: 'round', ri }),
  };

  return (
    <>
      <div className="card" {...watchRound}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '.7rem' }}>
          <h2 style={{ margin: 0 }}>
            라운드 {ri + 1} <em className="kind">{qs.length ? `문제 ${qs.length}개` : '게임 한 장'}</em>
          </h2>
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
      </div>

      {qs.length ? (
        <>
          <div className="row" style={{ justifyContent: 'space-between', margin: '0 .2rem .5rem' }}>
            <h2 style={{ margin: 0 }}>문제 {qs.length}개</h2>
            <span className="hint" style={{ margin: 0 }}>
              문제를 누르면 펼쳐집니다
            </span>
          </div>
          {qs.map((it, i) => (
            <QuestionCard
              key={it.id ?? i}
              it={it}
              i={i}
              ri={ri}
              open={open.has(it.id ?? String(i))}
              onToggle={() => {
                onToggleQ(it.id ?? String(i));
                if (it.id) onFocusQ(it.id, 'show');
              }}
              onPut={onPut}
              onPatch={onPatchQ}
              onMove={onMoveQ}
              onDup={onDupQ}
              onDel={onDelQ}
              onFocusZone={(z) => it.id && onFocusQ(it.id, z)}
            />
          ))}
          <div className="addbar">
            <button className="btn" type="button" onClick={onAddSame}>
              + 같은 모양으로 문제 추가
            </button>
            <button className="btn" type="button" onClick={() => onAddPreset()}>
              + 다른 유형으로 추가…
            </button>
          </div>
        </>
      ) : (
        <div className="card solo-card">
          <h2>지금은 &lsquo;게임 한 장&rsquo; 라운드입니다</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            위에 적은 이름 · 하는 방법 · 벌칙이 라운드 표지 한 장으로 나오고, 그 화면에서 이긴 팀을 고릅니다.
            줄자 맞추기처럼 화면이 필요 없는 게임이면 이대로 두세요. 문제 화면이 필요하면 유형을 고르세요.
          </p>
          <PresetGrid compact onPick={(p) => onAddPreset(p)} />
        </div>
      )}
    </>
  );
}
