'use client';

import { useEffect, useRef } from 'react';

import { PRESETS, SOLO, type Preset } from './presets';

/** 유형 카드 목록. 창 안에서도, 빈 라운드 화면에서도 씁니다 */
export function PresetGrid({ onPick, compact }: { onPick: (p: Preset) => void; compact?: boolean }) {
  return (
    <div className={'presets' + (compact ? ' compact' : '')}>
      {PRESETS.map((p) => (
        <button key={p.id} type="button" className="preset" onClick={() => onPick(p)}>
          <span className="ic" aria-hidden="true">
            {p.icon}
          </span>
          <b>{p.name}</b>
          <span className="d">{p.desc}</span>
          {p.ex && !compact ? <span className="ex">{p.ex}</span> : null}
        </button>
      ))}
    </div>
  );
}

interface Props {
  /** round 면 '게임 한 장' 도 고를 수 있습니다 */
  mode: 'round' | 'question';
  onPick: (p: Preset | null) => void;
  onClose: () => void;
}

/** 무엇을 추가할지 고르는 창 */
export function Picker({ mode, onPick, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    box.current?.querySelector<HTMLButtonElement>('button.preset, button.solo')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="picker-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="picker" role="dialog" aria-modal="true" aria-label="추가할 것 고르기" ref={box}>
        <div className="picker-h">
          <h2>{mode === 'round' ? '어떤 라운드를 넣을까요?' : '어떤 문제를 넣을까요?'}</h2>
          <button type="button" className="btn sm" onClick={onClose}>
            닫기
          </button>
        </div>

        {mode === 'round' ? (
          <>
            <h3>화면 한 장으로 하는 게임</h3>
            <button type="button" className="solo" onClick={() => onPick(null)}>
              <span className="ic" aria-hidden="true">
                {SOLO.icon}
              </span>
              <span>
                <b>{SOLO.name}</b>
                <span className="d">{SOLO.desc}</span>
                <span className="ex">{SOLO.ex}</span>
              </span>
            </button>
            <h3>문제가 이어지는 라운드 — 첫 문제의 유형을 고르세요</h3>
          </>
        ) : (
          <p className="hint" style={{ marginTop: 0 }}>
            유형은 출발점일 뿐입니다. 고른 뒤에도 블록을 마음대로 붙이고 뗄 수 있습니다.
          </p>
        )}
        <PresetGrid onPick={onPick} />
      </div>
    </div>
  );
}
