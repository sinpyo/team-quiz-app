/* 문제 유형 — 블록을 미리 몇 개 쌓아 둔 출발점입니다.
   유형을 고른 뒤에도 블록은 마음대로 붙이고 뗄 수 있습니다. */

import { newItemId } from '@/lib/ids';
import type { Question, Round } from '@/lib/types';

export interface Preset {
  id: string;
  icon: string;
  name: string;
  desc: string;
  /** 기본 문제집에서 이 유형을 쓴 라운드 */
  ex?: string;
  make: () => Question;
  /** 이 유형으로 라운드를 새로 만들 때 붙일 이름과 하는 방법 */
  round: { t: string; how: string };
}

export const PRESETS: Preset[] = [
  {
    id: 'cho',
    icon: 'ㄱㄴ',
    name: '초성',
    desc: '초성만 보고 맞히기',
    ex: 'ㅆㄴ → 써니',
    make: () => ({ k: 'cho', g: '', a: '', note: '' }),
    round: { t: '초성 퀴즈', how: '초성만 보고 맞히기. 띄어쓰기도 그대로 보여드립니다' },
  },
  {
    id: 'emoji',
    icon: '😎',
    name: '이모티콘',
    desc: '이모티콘을 보고 맞히기',
    ex: '🥁🎼🩸 → 위플래쉬',
    make: () => ({ k: 'emoji', g: '', a: '', note: '' }),
    round: { t: '이모티콘 퀴즈', how: '이모티콘만 보고 무엇인지 맞히기' },
  },
  {
    id: 'sym',
    icon: 'Ω',
    name: '기호 · 글자',
    desc: '기호나 짧은 글자가 무엇인지 맞히기',
    ex: 'lb → 파운드',
    make: () => ({ k: 'sym', g: '', a: '', note: '' }),
    round: { t: '기호 맞추기', how: '화면의 기호가 무엇을 뜻하는지 맞히기' },
  },
  {
    id: 'text',
    icon: '❓',
    name: '글 문제',
    desc: '문제를 읽고 답하기',
    ex: '상식 퀴즈',
    make: () => ({ q: '', a: '', note: '' }),
    round: { t: '상식 퀴즈', how: '문제를 듣고 먼저 손 든 팀이 답하기' },
  },
  {
    id: 'choice',
    icon: '🔢',
    name: '보기 고르기',
    desc: '보기 중에서 정답 고르기',
    make: () => ({ q: '', opts: ['', '', ''], a: '' }),
    round: { t: '골라 보세요', how: '보기 중에서 정답을 고르기' },
  },
  {
    id: 'song',
    icon: '🎵',
    name: '노래',
    desc: '유튜브로 전주를 들려주고 맞히기',
    ex: '전주 듣고 노래 맞추기',
    make: () => ({ k: 'emoji', g: '🎵', yt: '', s: '전주 재생', roles: ['제목', '가수', '한 소절'], a: '' }),
    round: {
      t: '전주 듣고 노래 맞추기',
      how: '팀에서 한 명씩 나눠서 제목 · 가수 · 한 소절을 맡습니다. 통과 여부는 진행자가 판단합니다',
    },
  },
  {
    id: 'table',
    icon: '📋',
    name: '표로 정답',
    desc: '정답을 이름 · 설명처럼 여러 줄로 풀어 주기',
    ex: '아이콘 빨리 찾기',
    make: () => ({ k: 'emoji', g: '', s: '', list: [['이름', ''], ['설명', '']] }),
    round: { t: '아이콘 빨리 찾기', how: '화면에 뜬 아이콘을 각자 휴대폰에서 찾아 먼저 보여주기' },
  },
  {
    id: 'relay',
    icon: '🎧',
    name: '이어 듣기',
    desc: '긴 문제를 나눠 읽고, 정답과 함께 원문 공개',
    ex: '문제 이어 듣기',
    make: () => ({
      k: 'emoji',
      g: '🎧',
      s: '진행자가 1번에게만 읽어 줍니다 · 감이 오면 "스톱"',
      full: '',
      a: '',
      note: '',
    }),
    round: {
      t: '문제 이어 듣기',
      how: '한 줄로 서서 맨 앞사람만 문제를 듣습니다. 감이 오면 "스톱"을 외치고, 다음 사람에게 그 뒤부터 이어 읽어 줍니다',
    },
  },
  {
    id: 'mission',
    icon: '🎯',
    name: '미션 화면',
    desc: '정답 없이 할 일만 크게 띄우기',
    ex: '절반 무게로 자르기 · 그림 이어그리기',
    make: () => ({ k: 'emoji', g: '🎯', q: '', s: '' }),
    round: { t: '미션 게임', how: '' },
  },
  {
    id: 'blank',
    icon: '＋',
    name: '빈 문제',
    desc: '블록을 직접 골라 쌓기',
    make: () => ({}),
    round: { t: '새 라운드', how: '' },
  },
];

/** '게임 한 장' — 문제 화면 없이 라운드 표지 한 장으로 하는 게임 */
export const SOLO = {
  icon: '🃏',
  name: '게임 한 장',
  desc: '설명과 벌칙이 적힌 라운드 표지 한 장으로 진행합니다. 그 화면에서 이긴 팀을 고릅니다',
  ex: '줄자 cm 맞추기 · 양세찬 게임',
};

/** 라운드 색. 아직 안 쓴 색부터 고릅니다 */
const PALETTE = [
  '#ff5f8d', '#35e0d0', '#ffc93c', '#b388ff', '#ff8a3d', '#6ee787', '#4dabf7', '#ff6bd6',
  '#d4e157', '#5ce1e6', '#ffa8a8', '#c0a3ff', '#ffd166', '#8ce99a', '#ff9f43', '#ff4d4d',
];

export function nextColor(rounds: Round[]): string {
  const used = new Set(rounds.map((r) => (r.c || '').toLowerCase()));
  return PALETTE.find((c) => !used.has(c)) ?? PALETTE[rounds.length % PALETTE.length];
}

/** 라운드 이름표. 점수가 이 이름표에 붙으므로 겹치면 안 됩니다 */
export const newRoundId = () => newItemId().replace(/^q/, 'r');

export const questionFrom = (p: Preset): Question => ({ id: newItemId(), ...p.make() });

/** 새 라운드. preset 이 없으면 '게임 한 장' 입니다 */
export function newRound(rounds: Round[], p: Preset | null): Round {
  return {
    id: newRoundId(),
    t: p ? p.round.t : '새 게임',
    c: nextColor(rounds),
    how: p ? p.round.how : '',
    pen: '',
    q: p ? [questionFrom(p)] : [],
  };
}

function graphemes(s: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(s)].length;
  }
  return [...s].length;
}

/** 같은 라운드에 문제를 하나 더 넣을 때 — 마지막 문제와 같은 블록을 빈 채로 쌓아 줍니다.
    안내 한 줄 · 역할 · 표의 이름 칸처럼 문제마다 똑같이 쓰는 것은 그대로 옮겨 적습니다 */
export function sameShape(qs: Question[]): Question {
  const last = qs[qs.length - 1];
  const out: Question = { id: newItemId() };
  if (!last) return out;

  if (last.k !== undefined || last.g !== undefined) {
    out.k = last.k ?? 'cho';
    out.g = sharedGlyph(qs);
    if (last.size) out.size = last.size;
  }
  if (last.yt !== undefined) out.yt = '';
  if (last.q !== undefined) out.q = '';
  if (last.s !== undefined) out.s = last.s;
  if (last.opts !== undefined) out.opts = last.opts.map(() => '');
  if (last.roles !== undefined) out.roles = [...last.roles];
  if (last.full !== undefined) out.full = '';
  if (last.list !== undefined) out.list = last.list.map(([k]) => [k, ''] as [string, string]);
  if (last.a !== undefined) out.a = '';
  if (last.note !== undefined) out.note = '';
  return out;
}

/** 큰 글자를 옮겨 적을지 — 모든 문제가 같은 글자를 쓰면(🎵 처럼) 옮기고, 문제마다 다르면 비웁니다 */
function sharedGlyph(qs: Question[]): string {
  const gs = qs.map((q) => q.g ?? '');
  const first = gs[0];
  if (!first) return '';
  if (qs.length >= 2) return gs.every((g) => g === first) ? first : '';
  // 문제가 하나뿐이면 알 수 없으니, 🎵 처럼 이모티콘 한 개짜리 표시일 때만 옮깁니다
  return qs[0].k === 'emoji' && graphemes(first) === 1 ? first : '';
}
