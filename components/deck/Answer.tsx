'use client';

import type { Question } from '@/lib/types';

/** 정답 상자. 열려 있지 않을 때도 자리는 만들어 둡니다 —
    인쇄할 때 hidden 인 정답까지 강제로 펼치는 규칙이 CSS 에 있기 때문입니다 */
export function Answer({ item, open }: { item: Question; open: boolean }) {
  if (!item.a && !item.list && !item.note && !item.full) return null;
  return (
    <div className="answer" hidden={!open}>
      <span className="alabel">ANSWER</span>
      {/* 이어 듣기 문제는 원래 문제 전문을 정답과 같이 보여줍니다 */}
      {item.full ? <p className="aquote">{item.full}</p> : null}
      {item.list ? (
        <ul className="alist">
          {item.list.map(([k, v], i) => (
            <li key={i}>
              <dfn>{k}</dfn>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {item.a ? <p className="atext">{item.a}</p> : null}
      {item.note ? <p className="anote">{item.note}</p> : null}
    </div>
  );
}
