/* 문제 하나를 이루는 블록들.

   문제는 블록을 쌓아서 만듭니다. 블록마다 문제 데이터의 칸 몇 개를 맡고,
   그 칸이 있으면(빈 글자라도) 블록이 있는 것입니다. 그래서 따로 '종류' 를 적어 두지 않아도
   예전 문제집을 그대로 열 수 있고, 퀴즈 화면도 지금 그대로 그립니다.

   순서는 퀴즈 화면에 그려지는 순서와 같습니다 (bodies.tsx 의 QuestionBody, Answer.tsx). */

import type { Question } from '@/lib/types';

export type BlockId = 'tag' | 'glyph' | 'song' | 'q' | 's' | 'opts' | 'roles' | 'full' | 'list' | 'a' | 'note';

/** show 는 문제 화면에 바로 보이는 것, answer 는 → 를 한 번 더 눌러야 열리는 정답 상자 */
export type Zone = 'show' | 'answer';

export interface BlockDef {
  id: BlockId;
  zone: Zone;
  icon: string;
  name: string;
  /** 블록 추가 단추에 마우스를 올리면 뜨는 설명 */
  hint: string;
  has: (it: Question) => boolean;
  add: (it: Question) => Question;
  remove: (it: Question) => Question;
}

const without = (it: Question, ...keys: (keyof Question)[]): Question => {
  const next = { ...it };
  for (const k of keys) delete next[k];
  return next;
};

/** 글자 하나만 맡는 블록 */
const textBlock = (
  id: 'tag' | 'q' | 's' | 'full' | 'a' | 'note',
  zone: Zone,
  icon: string,
  name: string,
  hint: string,
): BlockDef => ({
  id,
  zone,
  icon,
  name,
  hint,
  has: (it) => it[id] !== undefined,
  add: (it) => ({ ...it, [id]: '' }),
  remove: (it) => without(it, id),
});

export const BLOCKS: BlockDef[] = [
  textBlock('tag', 'show', '🏷️', '번호 대신 이름표', 'Q3 자리에 BONUS 처럼 다른 이름을 띄웁니다'),
  {
    id: 'glyph',
    zone: 'show',
    icon: '🔤',
    name: '큰 글자',
    hint: '초성 · 이모티콘 · 기호를 화면 가운데 크게 띄웁니다',
    has: (it) => it.k !== undefined || it.g !== undefined,
    add: (it) => ({ ...it, k: it.k ?? 'cho', g: it.g ?? '' }),
    remove: (it) => without(it, 'k', 'g', 'size'),
  },
  {
    id: 'song',
    zone: 'show',
    icon: '🎵',
    name: '노래 (유튜브)',
    hint: '유튜브로 전주를 들려줍니다. 정답을 열면 앨범 사진이 뜹니다',
    has: (it) => it.yt !== undefined,
    // 큰 글자가 없으면 🎵 를 같이 넣어 줍니다 — 정답을 열면 이 자리에 앨범 사진이 뜹니다
    add: (it) => (it.k !== undefined || it.g !== undefined ? { ...it, yt: '' } : { ...it, yt: '', k: 'emoji', g: '🎵' }),
    remove: (it) => without(it, 'yt', 'art', 'artText'),
  },
  textBlock('q', 'show', '❓', '문제 문장', '문제를 글로 크게 띄웁니다'),
  textBlock('s', 'show', '💬', '안내 한 줄', '화면 아래에 작은 글씨로 하는 방법을 알려 줍니다'),
  {
    id: 'opts',
    zone: 'show',
    icon: '🔢',
    name: '보기',
    hint: '고를 수 있는 보기를 나란히 띄웁니다',
    has: (it) => it.opts !== undefined,
    add: (it) => ({ ...it, opts: ['', ''] }),
    remove: (it) => without(it, 'opts'),
  },
  {
    id: 'roles',
    zone: 'show',
    icon: '👥',
    name: '역할 나누기',
    hint: '제목 · 가수 · 한 소절처럼 팀원마다 맡을 것을 띄웁니다',
    has: (it) => it.roles !== undefined,
    add: (it) => ({ ...it, roles: ['', ''] }),
    remove: (it) => without(it, 'roles'),
  },
  textBlock('full', 'answer', '📜', '문제 전문', '이어 듣기처럼 원래 문제 전체를 정답과 같이 보여줍니다'),
  {
    id: 'list',
    zone: 'answer',
    icon: '📋',
    name: '표로 된 정답',
    hint: '이름 · 설명처럼 정답을 여러 줄로 풀어 보여줍니다',
    has: (it) => it.list !== undefined,
    add: (it) => ({ ...it, list: [['', '']] }),
    remove: (it) => without(it, 'list'),
  },
  textBlock('a', 'answer', '✅', '정답', '정답을 크게 보여줍니다'),
  textBlock('note', 'answer', '📝', '정답 덧붙임', '정답 아래 작은 글씨로 풀이를 붙입니다'),
];

export const blockById = (id: BlockId) => BLOCKS.find((b) => b.id === id)!;

/** 이 문제를 목록에서 한 줄로 보여줄 때 */
export function peekOf(it: Question): string {
  if (it.g && it.yt === undefined) return it.g;
  return it.q || it.g || it.s || it.a || '';
}
