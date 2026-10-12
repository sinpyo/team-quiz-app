import { vars } from '@/lib/css';
import type { Pack, Question } from '@/lib/types';

/** 문제 하나를 한 줄로 — 화면에 크게 뜨는 것, 없으면 문제 문장 */
function shown(it: Question): { text: string; cls: string } {
  if (it.yt !== undefined) return { text: '🎵 노래', cls: 'song' };
  if (it.g) return { text: it.g + (it.q ? '  ' + it.q : ''), cls: it.k || '' };
  return { text: it.q || it.s || '(빈 문제)', cls: '' };
}

function answerOf(it: Question): string {
  if (it.a) return it.a;
  if (it.list?.length) return it.list.map(([k, v]) => (k ? `${k}: ${v}` : v)).join(' · ');
  return '';
}

/** 템플릿을 고르기 전에 무엇이 들어 있는지 훑어보는 목록 */
export function PackOutline({ pack }: { pack: Pack }) {
  const rounds = pack.rounds || [];
  return (
    <ol className="outline">
      {rounds.map((r, i) => {
        const qs = r.q || [];
        return (
          <li key={r.id ?? i} style={vars({ '--rc': r.c })}>
            <details>
              <summary>
                <i>{String(i + 1).padStart(2, '0')}</i>
                <span className="t">
                  <b>{r.t}</b>
                  {r.how ? <span>{r.how}</span> : null}
                </span>
                <em>{qs.length ? `문제 ${qs.length}개` : '게임 한 장'}</em>
              </summary>
              <div className="rbody">
                {r.how ? <p className="how">{r.how}</p> : null}
                {r.pen ? <p className="pen">🍺 {r.pen}</p> : null}
                {qs.length ? (
                  <ol className="qs">
                    {qs.map((it, k) => {
                      const s = shown(it);
                      const a = answerOf(it);
                      return (
                        <li key={it.id ?? k}>
                          <span className="no">{it.tag || 'Q' + (k + 1)}</span>
                          <span className={'what ' + s.cls}>{s.text}</span>
                          {a ? <span className="ans">{a}</span> : null}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="muted">문제 화면 없이 라운드 표지 한 장으로 진행하고, 그 화면에서 이긴 팀을 고릅니다.</p>
                )}
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
