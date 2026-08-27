/* 밖에서 들어온 문제집을 믿을 수 있는 모양으로 다듬습니다.
   사람이 손으로 만든 .json 을 불러올 수도 있고, 남이 이상한 것을 보낼 수도 있어서
   저장하기 전에 반드시 여기를 지나갑니다. */

import { newItemId } from './ids';
import type { Glyph, Pack, Question, Round } from './types';

/** 문제집 하나가 차지할 수 있는 최대 크기 */
export const MAX_PACK_BYTES = 2_000_000;

const str = (v: unknown, max = 2000): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const s = v.slice(0, max);
  return s.length ? s : undefined;
};
const strs = (v: unknown, max = 60): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const out = v.map((x) => str(x, 300)).filter((x): x is string => !!x).slice(0, max);
  return out.length ? out : undefined;
};
const KINDS: Glyph[] = ['cho', 'emoji', 'sym'];

function question(v: unknown): Question | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const q: Question = { id: str(o.id, 64) || newItemId() };
  if (typeof o.k === 'string' && KINDS.includes(o.k as Glyph)) q.k = o.k as Glyph;
  const g = str(o.g, 300); if (g) q.g = g;
  const size = str(o.size, 12); if (size) q.size = size;
  const tag = str(o.tag, 40); if (tag) q.tag = tag;
  const qq = str(o.q, 1000); if (qq) q.q = qq;
  const s = str(o.s, 500); if (s) q.s = s;
  const opts = strs(o.opts); if (opts) q.opts = opts;
  const roles = strs(o.roles, 12); if (roles) q.roles = roles;
  const yt = str(o.yt, 20); if (yt && /^[\w-]{11}$/.test(yt)) q.yt = yt;
  const art = str(o.art, 500); if (art && /^(\/|https:\/\/)/.test(art)) q.art = art;
  const artText = str(o.artText, 100); if (artText) q.artText = artText;
  const a = str(o.a, 1000); if (a) q.a = a;
  const note = str(o.note, 1000); if (note) q.note = note;
  const full = str(o.full, 3000); if (full) q.full = full;
  if (Array.isArray(o.list)) {
    const list = o.list
      .map((row) => (Array.isArray(row) ? [str(row[0], 200) ?? '', str(row[1], 800) ?? ''] : null))
      .filter((r): r is [string, string] => !!r && !!(r[0] || r[1]))
      .slice(0, 30) as [string, string][];
    if (list.length) q.list = list;
  }
  return q;
}

function round(v: unknown, i: number): Round | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const r: Round = {
    id: str(o.id, 64) || 'r' + (i + 1),
    t: str(o.t, 120) || `${i + 1}라운드`,
    c: (str(o.c, 40) && /^#[0-9a-fA-F]{3,8}$/.test(o.c as string) ? (o.c as string) : '#ff5f8d'),
  };
  const tag = str(o.tag, 80); if (tag) r.tag = tag;
  const how = str(o.how, 1500); if (how) r.how = how;
  const pen = str(o.pen, 300); if (pen) r.pen = pen;
  if (Array.isArray(o.q)) {
    r.q = o.q.map(question).filter((x): x is Question => !!x).slice(0, 200);
  } else {
    r.q = [];
  }
  return r;
}

/** 밖에서 들어온 값을 문제집으로 다듬습니다. 라운드가 하나도 없으면 null */
export function sanitizePack(v: unknown): Pack | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.rounds)) return null;

  const rounds = o.rounds.map(round).filter((x): x is Round => !!x).slice(0, 60);
  if (!rounds.length) return null;

  const p: Pack = { ver: 1, rounds };
  const title = str(o.title, 120); if (title) p.title = title;
  const kicker = str(o.kicker, 80); if (kicker) p.kicker = kicker;
  const lede = str(o.lede, 300); if (lede) p.lede = lede;
  const face = str(o.face, 20); if (face) p.face = face;

  const c = o.cheer as Record<string, unknown> | undefined;
  if (c && typeof c === 'object') {
    const cheer = { kicker: str(c.kicker, 80), head: str(c.head, 200), foot: str(c.foot, 300) };
    if (cheer.head || cheer.foot) p.cheer = cheer;
  }

  const s = o.stop as Record<string, unknown> | undefined;
  if (s && typeof s === 'object') {
    const steps = Array.isArray(s.steps)
      ? s.steps
          .map((x) => {
            const so = x as Record<string, unknown>;
            const text = str(so?.text, 500);
            return text ? { text, ...(so.hot ? { hot: true } : {}) } : null;
          })
          .filter((x): x is { text: string; hot?: boolean } => !!x)
          .slice(0, 30)
      : [];
    const stop = { kicker: str(s.kicker, 80), head: str(s.head, 200), sub: str(s.sub, 500), steps };
    if (stop.head || steps.length) p.stop = stop;
  }

  const f = o.finale as Record<string, unknown> | undefined;
  if (f && typeof f === 'object') {
    const cards = Array.isArray(f.cards)
      ? f.cards
          .map((x) => {
            const co = x as Record<string, unknown>;
            return { face: str(co?.face, 20), name: str(co?.name, 80), desc: str(co?.desc, 300) };
          })
          .filter((c) => c.name || c.face)
          .slice(0, 12)
      : [];
    const finale = { kicker: str(f.kicker, 80), head: str(f.head, 200), foot: str(f.foot, 300), cards };
    if (finale.head || cards.length) p.finale = finale;
  }

  if (JSON.stringify(p).length > MAX_PACK_BYTES) return null;
  return p;
}

/** 문제집을 그대로 베끼되, 점수 이름표는 새로 붙입니다.
    남의 문제집을 내 것으로 가져와도 그 사람 점수가 따라오지 않게 하려는 것입니다 */
export function copyPack(p: Pack, title: string): Pack {
  const out: Pack = JSON.parse(JSON.stringify(p));
  out.title = title;
  out.rounds = (out.rounds || []).map((r, i) => ({
    ...r,
    id: 'r' + (i + 1),
    q: (r.q || []).map((it) => ({ ...it, id: newItemId() })),
  }));
  return out;
}

/** 목록에 보여줄 이름 */
export const packTitle = (p: Pack) => p.title?.trim() || '이름 없는 문제집';
