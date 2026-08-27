'use client';

import { vars } from '@/lib/css';
import type { NumberedRound } from '@/lib/buildSlides';
import type { Scores, Team } from '@/lib/types';

interface Props {
  rounds: NumberedRound[];
  teams: Team[];
  scores: Scores;
  /** 점수 열쇠 → 라운드 번호 */
  roundOfKey: Record<string, number>;
  onRestart: () => void;
  onClear: () => void;
}

/** 최종 결과표 */
export function StatsBody({ rounds, teams, scores, roundOfKey, onRestart, onClear }: Props) {
  const totals: Record<string, number> = {};
  for (const t of teams) totals[t.id] = 0;

  const rows = rounds.map((r) => {
    const cells: Record<string, number> = {};
    for (const t of teams) cells[t.id] = 0;
    for (const [key, winner] of Object.entries(scores)) {
      // 예전에는 열쇠에서 라운드 번호를 뽑아 썼는데, 나중에 추가한 문제는
      // 열쇠 모양이 달라 결과표에서 빠졌습니다. 이제는 짝지어 둔 표를 봅니다
      if (roundOfKey[key] === r.n && cells[winner] !== undefined) {
        cells[winner] += 1;
        totals[winner] += 1;
      }
    }
    return { r, cells };
  });

  const best = Math.max(0, ...Object.values(totals));
  const champs = teams.filter((t) => totals[t.id] === best && best > 0).map((t) => t.name);

  return (
    <div className="stats">
      <h2>최종 결과</h2>
      <div className="wrap">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>라운드</th>
              {teams.map((t) => (
                <th key={t.id}>{t.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, cells }) => (
              <tr key={r.n}>
                <th style={vars({ '--rc': r.c })}>
                  <i>{r.n}</i>
                  {r.t}
                </th>
                {teams.map((t) => (
                  <td key={t.id} className={cells[t.id] ? 'has' : ''}>
                    {cells[t.id] || '·'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th style={{ textAlign: 'left' }}>합계</th>
              {teams.map((t) => (
                <td key={t.id} className={totals[t.id] === best && best > 0 ? 'win' : ''}>
                  {totals[t.id]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="champ">
        {champs.length ? (
          <>
            🏆 우승 — <em>{champs.join(' · ')}</em>
          </>
        ) : (
          '아직 기록된 점수가 없습니다'
        )}
      </p>
      <div className="actions">
        <button type="button" className="primary" onClick={onRestart}>
          ↺ 점수 지우고 처음부터
        </button>
        <button type="button" onClick={onClear}>
          점수만 지우기
        </button>
      </div>
    </div>
  );
}
