'use client';

import { useEffect, useMemo, useState } from 'react';

import { buildSlides, hasAnswer, scoreKeyOf } from '@/lib/buildSlides';
import { vars } from '@/lib/css';
import { findSlide, type PreviewMessage } from '@/lib/previewTarget';
import type { Team } from '@/lib/types';

import { Answer } from './Answer';
import { Bar } from './Bar';
import { CheerBody, CoverBody, FinaleBody, QuestionBody, RoundBody, StopBody } from './bodies';
import { WinPicker } from './WinPicker';

const TEAMS: Team[] = [
  { id: 't1', name: '1팀' },
  { id: 't2', name: '2팀' },
];
const noop = () => {};

/* 문제 고치기 화면 오른쪽의 미리보기. 편집기가 iframe 으로 이 화면을 띄우고,
   고칠 때마다 문제집과 보여줄 장을 쪽지로 보내 줍니다.
   퀴즈 화면과 같은 부품 · 같은 CSS 로 그리므로 실제 진행 화면과 똑같이 보입니다.
   한 장만 그리고, 점수 · 노래 · 키보드는 붙이지 않습니다. */
export function PreviewStage() {
  const [msg, setMsg] = useState<PreviewMessage | null>(null);

  useEffect(() => {
    document.body.classList.add('deck');
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as PreviewMessage | undefined;
      if (d && d.type === 'preview') setMsg(d);
    };
    window.addEventListener('message', on);
    // 준비됐다고 알려야 편집기가 첫 쪽지를 보냅니다
    window.parent?.postMessage({ type: 'preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', on);
  }, []);

  const built = useMemo(() => (msg ? buildSlides(msg.pack) : null), [msg]);
  if (!msg || !built) return <main id="deck" />;

  const at = findSlide(built, msg.target);
  if (at < 0) {
    return (
      <main id="deck">
        <section className="slide pad on" style={vars({ '--accent': '#9a8db6' })}>
          <span />
          <div className="cheer">
            <span className="kicker">EMPTY</span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 6vh, 3rem)' }}>이 장은 비어 있습니다</h2>
            <p className="qsub">글을 하나라도 적으면 퀴즈에 이 장이 나타납니다</p>
          </div>
        </section>
      </main>
    );
  }

  const s = built.slides[at];
  const pack = msg.pack;
  const shown = hasAnswer(s) && msg.reveal;
  const key = scoreKeyOf(s);
  const padded = s.type === 'q' ? false : s.type === 'round' ? !s.scoreKey : true;

  let body = null;
  if (s.type === 'cover') body = <CoverBody pack={pack} canEdit={false} />;
  else if (s.type === 'cheer') body = <CheerBody pack={pack} />;
  else if (s.type === 'stop') body = <StopBody pack={pack} />;
  else if (s.type === 'finale') body = <FinaleBody pack={pack} />;
  else if (s.type === 'round') body = <RoundBody r={s.r} />;
  else if (s.type === 'q') body = <QuestionBody item={s.item} i={s.i} />;

  return (
    <main id="deck">
      <section
        className={'slide on' + (padded ? ' pad' : '') + (shown ? ' shown' : '')}
        style={vars({ '--accent': s.c })}
      >
        <Bar
          slide={s}
          rounds={built.rounds}
          roundStart={built.roundStart}
          tocAt={built.tocAt}
          onGo={noop}
          onMenu={noop}
        />
        {body}
        {key ? (
          <div className="foot">
            {s.type === 'q' ? <Answer item={s.item} open={msg.reveal} /> : null}
            <WinPicker
              label={s.type === 'q' || s.type === 'round' ? s.scoreLabel : ''}
              teams={TEAMS}
              won={undefined}
              open={hasAnswer(s) ? msg.reveal : true}
              onPick={noop}
              onAddTeam={noop}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
