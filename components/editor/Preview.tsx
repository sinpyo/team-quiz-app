'use client';

import { useEffect, useRef, useState } from 'react';

import type { PreviewMessage, PreviewTarget } from '@/lib/previewTarget';
import type { Pack } from '@/lib/types';

/* 실제 퀴즈 화면을 1280×720 으로 그린 다음 칸에 맞게 줄여서 보여줍니다.
   퀴즈 화면의 글자 크기가 화면 높이(vh)를 따라가므로, 이렇게 해야 진짜와 똑같은 비율이 나옵니다. */
const W = 1280;
const H = 720;

interface Props {
  pack: Pack;
  target: PreviewTarget;
  reveal: boolean;
  /** 정답 상자가 있는 문제인지 — 있으면 문제/정답 전환 단추를 띄웁니다 */
  canReveal: boolean;
  /** 정답 공개 단추가 없을 때 대신 띄우는 말 */
  noRevealHint: string;
  label: string;
  onReveal: (on: boolean) => void;
  /** 진행 화면에서 이 장부터 열기. 이 장이 퀴즈에 안 나오면 null */
  playHref: string | null;
}

export function Preview({ pack, target, reveal, canReveal, noRevealHint, label, onReveal, playHref }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  // 미리보기 창이 (다시) 준비될 때마다 올라갑니다 — 그때마다 지금 상태를 다시 보냅니다
  const [ready, setReady] = useState(0);
  const [small, setSmall] = useState(false);

  /* 칸 너비에 맞춰 줄입니다 */
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W));
    ro.observe(el);
    setScale(el.clientWidth / W);
    return () => ro.disconnect();
  }, [small]);

  /* 미리보기 창이 준비됐다고 알려 오면 그때부터 보냅니다 */
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source === frame.current?.contentWindow && (e.data as { type?: string })?.type === 'preview-ready') {
        setReady((n) => n + 1);
      }
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);

  /* 고칠 때마다 보냅니다. 글자를 빨리 쳐도 한 프레임에 한 번만 */
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => {
      const msg: PreviewMessage = { type: 'preview', pack, target, reveal };
      frame.current?.contentWindow?.postMessage(msg, window.location.origin);
    });
    return () => cancelAnimationFrame(id);
  }, [ready, pack, target, reveal]);

  return (
    <div className={'pv' + (small ? ' min' : '')}>
      <div className="pv-h">
        <b>미리보기</b>
        <span className="where">{label}</span>
        <button type="button" className="btn sm pv-toggle" onClick={() => setSmall((v) => !v)}>
          {small ? '펼치기' : '접기'}
        </button>
      </div>
      <div className="pv-frame" ref={wrap}>
        <iframe
          ref={frame}
          src="/preview"
          title="슬라이드 미리보기"
          tabIndex={-1}
          style={{ width: W, height: H, transform: `scale(${scale})` }}
        />
      </div>
      <div className="pv-foot">
        {canReveal ? (
          <div className="seg" role="radiogroup" aria-label="미리보기 화면">
            <button type="button" role="radio" aria-checked={!reveal} className={!reveal ? 'on' : undefined} onClick={() => onReveal(false)}>
              문제 화면
            </button>
            <button type="button" role="radio" aria-checked={reveal} className={reveal ? 'on' : undefined} onClick={() => onReveal(true)}>
              정답 공개
            </button>
          </div>
        ) : (
          <span className="hint" style={{ margin: 0 }}>
            {noRevealHint}
          </span>
        )}
        {playHref ? (
          <a className="btn sm" href={playHref} target="_blank" rel="noopener">
            ▶ 이 장부터 진행
          </a>
        ) : null}
      </div>
    </div>
  );
}
