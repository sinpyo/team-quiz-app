/* 문제집 하나를 화면 목록으로 펼칩니다.
   team-quiz 의 index.html 620~662줄을 그대로 옮긴 것입니다.
   라운드 번호는 배열 순서에서 매기므로, 라운드를 넣고 빼도 알아서 맞습니다. */

import type { Pack, Question, Round } from './types';

export interface NumberedRound extends Round {
  n: number;
}

interface Base {
  c: string;
}

export type Slide =
  | (Base & { type: 'cover' })
  | (Base & { type: 'cheer' })
  | (Base & { type: 'toc' })
  | (Base & { type: 'stop' })
  | (Base & { type: 'teams' })
  | (Base & {
      type: 'round';
      r: NumberedRound;
      round: number;
      /** 문제 화면이 없는 라운드는 표지에서 승자를 기록합니다 */
      scoreKey: string | null;
      scoreLabel: string;
    })
  | (Base & {
      type: 'q';
      r: NumberedRound;
      item: Question;
      i: number;
      of: number;
      seen: number;
      round: number;
      scoreKey: string;
      scoreLabel: string;
    })
  | (Base & { type: 'stats' })
  | (Base & { type: 'finale' });

export interface Built {
  rounds: NumberedRound[];
  slides: Slide[];
  /** 라운드 번호 → 그 라운드가 시작하는 화면 자리 */
  roundStart: Record<number, number>;
  tocAt: number;
  /** 상시 게임 화면이 없으면 -1 */
  stopAt: number;
  teamsAt: number;
  statsAt: number;
  finaleAt: number;
  /** 점수 열쇠 → 라운드 번호.
      예전에는 열쇠에서 'r7...' 처럼 번호를 뽑아 썼는데, 나중에 추가한 문제는
      열쇠 모양이 달라 결과표에서 빠졌습니다. 여기서 짝을 지어 두면 그럴 일이 없습니다 */
  roundOfKey: Record<string, number>;
  qTotal: number;
}

export function buildSlides(pack: Pack): Built {
  const rounds: NumberedRound[] = (pack.rounds || []).map((r, i) => ({ ...r, n: i + 1 }));
  const qOf = (r: NumberedRound): Question[] => (Array.isArray(r.q) ? r.q : []);

  const slides: Slide[] = [];
  const roundStart: Record<number, number> = {};
  const roundOfKey: Record<string, number> = {};
  let qTotal = 0;
  for (const r of rounds) qTotal += qOf(r).length;

  slides.push({ type: 'cover', c: '#ff4d5e' });
  // 문제집에서 비워 두면 그 장은 아예 나오지 않습니다
  if (pack.cheer && (pack.cheer.head || pack.cheer.foot)) slides.push({ type: 'cheer', c: '#ff4d5e' });

  slides.push({ type: 'toc', c: '#4d8cff' });
  const tocAt = slides.length - 1;

  let stopAt = -1;
  if (pack.stop && (pack.stop.head || (pack.stop.steps || []).length)) {
    slides.push({ type: 'stop', c: '#ff4d5e' });
    stopAt = slides.length - 1;
  }

  slides.push({ type: 'teams', c: '#ffd93d' });
  const teamsAt = slides.length - 1;

  let qSeen = 0;
  for (const r of rounds) {
    roundStart[r.n] = slides.length;
    const items = qOf(r);
    const empty = items.length === 0;
    const roundKey = empty ? r.id || 'r' + r.n : null;
    if (roundKey) roundOfKey[roundKey] = r.n;
    slides.push({
      type: 'round',
      r,
      c: r.c,
      scoreKey: roundKey,
      scoreLabel: '이 라운드 승리 팀',
      round: r.n,
    });
    items.forEach((item, i) => {
      qSeen += 1;
      // 이름표(id)에 점수를 매답니다. 문제를 넣고 빼도 점수가 안 어긋납니다
      const key = item.id || 'r' + r.n + 'q' + (i + 1);
      roundOfKey[key] = r.n;
      slides.push({
        type: 'q',
        r,
        c: r.c,
        item,
        i: i + 1,
        of: items.length,
        seen: qSeen,
        scoreKey: key,
        scoreLabel: '이 문제 승리 팀',
        round: r.n,
      });
    });
  }

  slides.push({ type: 'stats', c: '#ffd93d' });
  const statsAt = slides.length - 1;
  slides.push({ type: 'finale', c: '#a78bfa' });
  const finaleAt = slides.length - 1;

  return { rounds, slides, roundStart, tocAt, stopAt, teamsAt, statsAt, finaleAt, roundOfKey, qTotal };
}

/** 이 화면에 정답 상자가 있는지 — 넘기기가 두 번에 나뉘는지를 가릅니다 */
export function hasAnswer(s: Slide | undefined): boolean {
  if (!s || s.type !== 'q') return false;
  const it = s.item;
  return !!(it.a || it.list || it.note || it.full);
}

/** 이 화면에서 승리 팀을 고를 수 있는지 */
export function scoreKeyOf(s: Slide | undefined): string | null {
  if (!s) return null;
  if (s.type === 'q') return s.scoreKey;
  if (s.type === 'round') return s.scoreKey;
  return null;
}
