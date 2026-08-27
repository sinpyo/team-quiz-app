/* 'rounds.3.q.2.g' 같은 길을 따라가 값을 넣습니다.
   원래 admin.html 이 쓰던 방식 그대로인데, React 라 원본을 고치지 않고
   새 것을 만들어 돌려줍니다. */

import type { Pack, Question } from '@/lib/types';

type Any = Record<string, unknown> | unknown[];

export function setPath<T>(root: T, path: string, val: unknown): T {
  const parts = path.split('.');

  const walk = (node: unknown, i: number): unknown => {
    const key = parts[i];
    const isLast = i === parts.length - 1;
    const base: Any = Array.isArray(node)
      ? [...(node as unknown[])]
      : { ...((node as Record<string, unknown>) ?? {}) };
    const box = base as Record<string, unknown>;

    if (isLast) {
      if (val === '' || val === undefined) delete box[key];
      else box[key] = val;
      return base;
    }
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    const child = box[key] ?? (nextIsIndex ? [] : {});
    box[key] = walk(child, i + 1);
    return base;
  };

  return walk(root, 0) as T;
}

/** 칸마다 값을 어떻게 읽을지가 다릅니다 (쉼표로 나누는 것, 줄로 나누는 것) */
export function readField(path: string, raw: string): unknown {
  const key = path.split('.').pop();

  if (key === 'opts' || key === 'roles') {
    const arr = raw.split(',').map((v) => v.trim()).filter(Boolean);
    return arr.length ? arr : '';
  }
  if (key === 'list') {
    const arr = raw
      .split('\n')
      .map((line) => {
        const i = line.indexOf('=');
        if (i < 0) return null;
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()] as [string, string];
      })
      .filter((p): p is [string, string] => !!p && !!p[0]);
    return arr.length ? arr : '';
  }
  if (key === 'yt') {
    const m = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : raw.trim();
  }
  return raw;
}

/** 문제 종류 — 화면에 필요한 칸만 보여주려고 씁니다 */
export const KINDS = [
  { v: 'cho', n: '초성', g: '큰 글자 (초성)', ph: '예: ㄱㅂㅈ' },
  { v: 'emoji', n: '이모티콘', g: '큰 글자 (이모티콘)', ph: '예: 🐧🎬' },
  { v: 'sym', n: '기호 · 글자', g: '큰 글자', ph: '예: dB' },
  { v: 'song', n: '노래', g: null },
  { v: 'text', n: '글만', g: null },
] as const;

export type KindValue = (typeof KINDS)[number]['v'];

export const kindOf = (it: Question): KindValue => (it.yt !== undefined ? 'song' : it.k ? it.k : 'text');

/** 종류를 바꾸면 그 종류에 맞게 칸을 정리합니다 */
export function changeKind(it: Question, v: KindValue): Question {
  const next: Question = { ...it };
  if (v === 'song') {
    next.k = 'emoji';
    next.g = next.g || '🎵';
    next.yt = next.yt ?? '';
    next.roles = next.roles || ['제목', '가수', '한 소절'];
    next.s = next.s || '전주 재생';
  } else if (v === 'text') {
    delete next.k;
    delete next.g;
    delete next.yt;
    delete next.art;
  } else {
    next.k = v;
    delete next.yt;
    delete next.art;
    if (next.g === undefined) next.g = '';
  }
  return next;
}

/** 라운드 하나를 새로 만듭니다 */
export const blankRound = (n: number) => ({
  id: 'r' + n,
  t: `${n}번째 라운드`,
  c: '#9a8db6',
  how: '',
  pen: '',
  q: [] as Question[],
});

export const emptyPack = (): Pack => ({ ver: 1, rounds: [] });
