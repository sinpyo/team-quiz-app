'use client';

import type { ReactNode } from 'react';

import type { Glyph, Question } from '@/lib/types';
import { BLOCKS, peekOf, type BlockDef, type BlockId, type Zone } from './blocks';
import { Area, Text } from './Field';
import { PairsInput, StringsInput } from './ListInput';
import { parseYt } from './paths';

const GLYPHS: { v: Glyph; n: string; ph: string }[] = [
  { v: 'cho', n: '초성', ph: '예: ㄱㅂㅈ' },
  { v: 'emoji', n: '이모티콘', ph: '예: 🐧🎬' },
  { v: 'sym', n: '기호 · 글자', ph: '예: dB' },
];

const ZONES: { z: Zone; name: string; sub: string }[] = [
  { z: 'show', name: '문제 화면', sub: '넘기자마자 보이는 것' },
  { z: 'answer', name: '정답', sub: '→ 를 한 번 더 누르면 열립니다' },
];

interface Props {
  it: Question;
  i: number;
  ri: number;
  open: boolean;
  onToggle: () => void;
  /** 글자를 칠 때 */
  onPut: (path: string, value: unknown) => void;
  /** 블록을 붙이고 뗄 때 — 되돌리기에 한 번씩 담습니다 */
  onPatch: (i: number, fn: (it: Question) => Question) => void;
  onMove: (i: number, dir: number) => void;
  onDup: (i: number) => void;
  onDel: (i: number) => void;
  /** 이 문제의 어느 쪽을 만지고 있는지 — 미리보기가 따라옵니다 */
  onFocusZone: (zone: Zone) => void;
}

function Shell({ def, onRemove, children }: { def: BlockDef; onRemove: () => void; children: ReactNode }) {
  return (
    <div className="blk" data-blk={def.id}>
      <div className="blk-h">
        <span className="ic" aria-hidden="true">
          {def.icon}
        </span>
        <b>{def.name}</b>
        <button type="button" className="x" title="이 블록 빼기" aria-label={def.name + ' 빼기'} onClick={onRemove}>
          ✕
        </button>
      </div>
      {children}
    </div>
  );
}

export function QuestionCard(props: Props) {
  const { it, i, ri, open, onToggle, onPut, onPatch, onMove, onDup, onDel, onFocusZone } = props;
  const p = `rounds.${ri}.q.${i}.`;
  const peek = peekOf(it);
  const icons = BLOCKS.filter((b) => b.has(it)).map((b) => b.icon);

  const body = (id: BlockId): ReactNode => {
    switch (id) {
      case 'tag':
        return <Text path={p + 'tag'} value={it.tag ?? ''} onSet={onPut} placeholder="예: BONUS" />;
      case 'glyph': {
        const k = it.k ?? 'cho';
        const spec = GLYPHS.find((x) => x.v === k)!;
        return (
          <>
            <div className="seg" role="radiogroup" aria-label="큰 글자 종류">
              {GLYPHS.map((x) => (
                <button
                  key={x.v}
                  type="button"
                  role="radio"
                  aria-checked={k === x.v}
                  className={k === x.v ? 'on' : undefined}
                  onClick={() => onPatch(i, (q) => ({ ...q, k: x.v }))}
                >
                  {x.n}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: '.5rem', alignItems: 'stretch' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text path={p + 'g'} value={it.g ?? ''} onSet={onPut} big placeholder={spec.ph} />
              </div>
              <select
                aria-label="글자 크기"
                title="글자 크기"
                value={it.size || ''}
                onChange={(e) => onPut(p + 'size', e.target.value || undefined)}
                style={{ width: 'auto' }}
              >
                <option value="">크기 자동</option>
                <option value="md">조금 작게</option>
                <option value="sm">작게</option>
              </select>
            </div>
          </>
        );
      }
      case 'song': {
        const thumb = it.art || (it.yt && it.yt.length === 11 ? `https://img.youtube.com/vi/${it.yt}/hqdefault.jpg` : '');
        return (
          <>
            <div className="row" style={{ gap: '.6rem', alignItems: 'center', flexWrap: 'nowrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  value={it.yt ?? ''}
                  placeholder="유튜브 주소를 그대로 붙여 넣으세요"
                  onChange={(e) => onPut(p + 'yt', parseYt(e.target.value))}
                />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {thumb ? <img className="thumb" src={thumb} alt="앨범 사진" /> : null}
            </div>
            <p className="hint">
              {it.art ? (
                <>
                  직접 넣은 앨범 사진을 씁니다 ·{' '}
                  <button type="button" className="linkish" onClick={() => onPatch(i, (q) => ({ ...q, art: undefined }))}>
                    유튜브 표지로 바꾸기
                  </button>
                </>
              ) : (
                '정답을 열면 유튜브 표지가 앨범 사진처럼 뜹니다'
              )}
            </p>
            <Text path={p + 'artText'} value={it.artText ?? ''} onSet={onPut} placeholder="사진 대신 글자를 띄우려면 (없어도 됩니다)" />
          </>
        );
      }
      case 'q':
        return <Area path={p + 'q'} value={it.q ?? ''} onSet={onPut} rows={2} />;
      case 's':
        return <Text path={p + 's'} value={it.s ?? ''} onSet={onPut} placeholder="예: 먼저 손 드는 팀이 답합니다" />;
      case 'opts':
        return (
          <StringsInput
            value={it.opts ?? []}
            addLabel="보기 추가"
            placeholder={(n) => `보기 ${n + 1}`}
            onType={(v) => onPut(p + 'opts', v)}
            onShape={(v) => onPatch(i, (q) => ({ ...q, opts: v }))}
          />
        );
      case 'roles':
        return (
          <StringsInput
            value={it.roles ?? []}
            addLabel="역할 추가"
            placeholder={(n) => ['예: 제목', '예: 가수', '예: 한 소절'][n] ?? '역할'}
            onType={(v) => onPut(p + 'roles', v)}
            onShape={(v) => onPatch(i, (q) => ({ ...q, roles: v }))}
          />
        );
      case 'full':
        return <Area path={p + 'full'} value={it.full ?? ''} onSet={onPut} rows={4} />;
      case 'list':
        return (
          <PairsInput
            value={it.list ?? []}
            onType={(v) => onPut(p + 'list', v)}
            onShape={(v) => onPatch(i, (q) => ({ ...q, list: v }))}
          />
        );
      case 'a':
        return <Area path={p + 'a'} value={it.a ?? ''} onSet={onPut} rows={1} />;
      case 'note':
        return <Area path={p + 'note'} value={it.note ?? ''} onSet={onPut} rows={2} />;
    }
  };

  return (
    <div className="qcard" data-open={open ? 1 : 0} data-qid={it.id}>
      <div className="qrow">
        <button className="qhead" type="button" onClick={onToggle} aria-expanded={open}>
          <span className="no">{it.tag ? it.tag : 'Q' + (i + 1)}</span>
          <span className="peek">
            {peek || <span className="none">(빈 문제)</span>}
            {it.a ? <s> — {it.a}</s> : null}
          </span>
          <span className="kinds" aria-hidden="true">
            {icons.join('')}
          </span>
        </button>
        <div className="qtools">
          <button className="btn sm" type="button" title="위로" onClick={() => onMove(i, -1)}>↑</button>
          <button className="btn sm" type="button" title="아래로" onClick={() => onMove(i, 1)}>↓</button>
          <button className="btn sm" type="button" title="복제" onClick={() => onDup(i)}>⧉</button>
          <button className="btn sm danger" type="button" title="삭제" onClick={() => onDel(i)}>✕</button>
        </div>
      </div>

      {open ? (
        <div className="qbody">
          {ZONES.map(({ z, name, sub }) => {
            const defs = BLOCKS.filter((b) => b.zone === z);
            const here = defs.filter((b) => b.has(it));
            const missing = defs.filter((b) => !b.has(it));
            return (
              <div key={z} className={'zone ' + z} onFocusCapture={() => onFocusZone(z)} onPointerDown={() => onFocusZone(z)}>
                <div className="zone-h">
                  <b>{name}</b>
                  <em>{sub}</em>
                </div>
                {here.map((b) => (
                  <Shell key={b.id} def={b} onRemove={() => onPatch(i, b.remove)}>
                    {body(b.id)}
                  </Shell>
                ))}
                {here.length === 0 ? (
                  <p className="hint">
                    {z === 'answer'
                      ? '정답이 없으면 → 한 번에 다음 화면으로 넘어갑니다. 미션처럼 정답이 필요 없을 때 이대로 두세요.'
                      : '아래에서 화면에 띄울 블록을 골라 넣으세요.'}
                  </p>
                ) : null}
                {missing.length ? (
                  <div className="chips">
                    {missing.map((b) => (
                      <button key={b.id} type="button" className="chip" title={b.hint} onClick={() => onPatch(i, b.add)}>
                        <span aria-hidden="true">{b.icon}</span> {b.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
