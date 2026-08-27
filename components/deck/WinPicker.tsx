'use client';

import type { Team } from '@/lib/types';

interface Props {
  label: string;
  teams: Team[];
  /** 지금 이 문제에서 이긴 팀 */
  won: string | undefined;
  open: boolean;
  onPick: (teamId: string) => void;
  onAddTeam: () => void;
}

/** 승리 팀 고르기 — 정답이 뜬 그 화면 안에 그립니다 */
export function WinPicker({ label, teams, won, open, onPick, onAddTeam }: Props) {
  return (
    <div className="win" hidden={!open}>
      <span className="lab">{label}</span>
      {teams.map((t) => (
        <button
          key={t.id}
          type="button"
          className={won === t.id ? 'won' : ''}
          onClick={() => onPick(t.id)}
        >
          {t.name}
        </button>
      ))}
      <button type="button" className="ghost" onClick={onAddTeam}>
        + 팀
      </button>
    </div>
  );
}
