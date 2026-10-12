/* 처음부터 들어 있는 템플릿.
   데이터베이스에 넣지 않고 코드에 둡니다 — 누구에게나 같고, 아무도 못 고칩니다.
   사람이 만든 템플릿은 packs 표에 kind = 'template' 으로 들어갑니다. */

import { defaultPack } from './defaultPack';
import type { Pack } from './types';

export interface BuiltinTemplate {
  /** 주소에 들어가는 이름 — /templates/party */
  slug: string;
  face: string;
  title: string;
  desc: string;
  pack: Pack;
}

/** 준비물 없이 말로만 할 수 있는 라운드 — 줄자·저울·종이·노래가 필요 없는 것들 */
const TALK_ROUNDS = ['r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11'];

const talkPack: Pack = {
  ...defaultPack,
  title: '준비물 없는 퀴즈',
  lede: '말로만 하는 여덟 라운드',
  face: '🗣️',
  rounds: defaultPack.rounds.filter((r) => r.id && TALK_ROUNDS.includes(r.id)),
};

const blankPack: Pack = {
  ver: 1,
  title: '새 문제집',
  kicker: '팀 대항',
  lede: '',
  face: '🎲',
  rounds: [{ id: 'r1', t: '첫 번째 라운드', c: '#ff5f8d', q: [] }],
};

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    slug: 'party',
    face: '🎲',
    title: '단체 게임 퀴즈',
    desc: '노래·초성·상식에 몸으로 하는 게임까지. 모임 하나를 통째로 채우는 구성입니다',
    pack: defaultPack,
  },
  {
    slug: 'talk',
    face: '🗣️',
    title: '준비물 없는 퀴즈',
    desc: '화면만 있으면 됩니다. 초성·이모티콘·기호·상식처럼 말로만 하는 라운드만 모았습니다',
    pack: talkPack,
  },
  {
    slug: 'blank',
    face: '✨',
    title: '빈 문제집',
    desc: '라운드 하나만 들어 있습니다. 처음부터 직접 쌓고 싶을 때',
    pack: blankPack,
  },
];

export const builtinTemplate = (slug: string) => BUILTIN_TEMPLATES.find((t) => t.slug === slug) ?? null;

/** 라운드 수와 문제 수 */
export function packCounts(p: Pack): { rounds: number; questions: number } {
  const rounds = p.rounds || [];
  return { rounds: rounds.length, questions: rounds.reduce((n, r) => n + (r.q || []).length, 0) };
}
