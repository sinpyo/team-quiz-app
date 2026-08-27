'use client';

import { vars } from '@/lib/css';
import type { Built } from '@/lib/buildSlides';
import type { Pack } from '@/lib/types';

interface Props {
  built: Built;
  pack: Pack;
  on: boolean;
  onGo: (i: number) => void;
  onClose: () => void;
}

/** M 키로 여는 라운드 이동 메뉴 */
export function Menu({ built, pack, on, onGo, onClose }: Props) {
  const { rounds, roundStart, tocAt, stopAt, teamsAt, statsAt, finaleAt } = built;
  const go = (i: number) => {
    onGo(i);
    onClose();
  };

  return (
    <div
      id="menu"
      className={on ? 'on' : undefined}
      role="dialog"
      aria-label="라운드 이동"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <ul>
        <li>
          <button type="button" style={vars({ '--jc': '#4d8cff' })} onClick={() => go(tocAt)}>
            <i>≡</i>목차
          </button>
        </li>
        {stopAt >= 0 ? (
          <li>
            <button type="button" style={vars({ '--jc': '#ff4d5e' })} onClick={() => go(stopAt)}>
              <i>!</i>
              {pack.stop?.head || '규칙'}
            </button>
          </li>
        ) : null}
        <li>
          <button type="button" style={vars({ '--jc': '#ffd93d' })} onClick={() => go(teamsAt)}>
            <i>@</i>팀 이름 정하기
          </button>
        </li>
        {rounds.map((r) => (
          <li key={r.n}>
            <button type="button" style={vars({ '--jc': r.c })} onClick={() => go(roundStart[r.n])}>
              <i>R{r.n}</i>
              {r.t}
            </button>
          </li>
        ))}
        <li>
          <button type="button" style={vars({ '--jc': '#ffd93d' })} onClick={() => go(statsAt)}>
            <i>#</i>최종 결과
          </button>
        </li>
        <li>
          <button type="button" style={vars({ '--jc': '#a78bfa' })} onClick={() => go(finaleAt)}>
            <i>▶</i>다음 순서 예고
          </button>
        </li>
        <li>
          <button type="button" style={vars({ '--jc': '#9a8db6' })} onClick={() => go(0)}>
            <i>↩</i>표지로
          </button>
        </li>
      </ul>
    </div>
  );
}
