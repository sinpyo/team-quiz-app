'use client';

import { vars } from '@/lib/css';
import type { NumberedRound, Slide } from '@/lib/buildSlides';

interface Props {
  slide: Slide;
  rounds: NumberedRound[];
  roundStart: Record<number, number>;
  tocAt: number;
  onGo: (i: number) => void;
  onMenu: () => void;
}

/** 화면 맨 위 줄. 라운드 탭을 누르면 그 라운드로 바로 넘어갑니다 */
export function Bar({ slide, rounds, roundStart, tocAt, onGo, onMenu }: Props) {
  // 표지는 깨끗하게 — 탭 없이 메뉴 단추만 둡니다
  if (slide.type === 'cover') {
    return (
      <header className="bar">
        <span />
        <button type="button" className="badge" data-menu onClick={onMenu}>
          <b>MENU</b> 라운드 이동
        </button>
      </header>
    );
  }

  const here = slide.type === 'round' || slide.type === 'q' ? slide.round : -1;

  return (
    <header className="bar">
      <nav className="tabs">
        <button type="button" className="tab home" data-tip="목차" onClick={() => onGo(tocAt)}>
          ≡
        </button>
        {rounds.map((r) => {
          const on = r.n === here;
          return (
            <button
              key={r.n}
              type="button"
              className={'tab' + (on ? ' on' : '')}
              style={vars({ '--jc': r.c })}
              data-tip={`${r.n}. ${r.t}`}
              onClick={() => onGo(roundStart[r.n])}
            >
              <i>{r.n}</i>
              {on ? <span>{r.t}</span> : null}
            </button>
          );
        })}
      </nav>
      <button type="button" className="badge" data-menu onClick={onMenu}>
        <b>MENU</b>
      </button>
    </header>
  );
}
