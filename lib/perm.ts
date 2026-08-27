/* 누가 무엇을 할 수 있는지.

   화면에서 단추를 감추는 것은 보기 좋으라고 하는 것일 뿐입니다.
   실제로 막는 것은 여기이고, 무엇을 쓰는 길이든 반드시 여기를 지나갑니다. */

import { and, eq } from 'drizzle-orm';

import { db, schema } from './db';
import type { PackRow } from './schema';

export type Role = 'owner' | 'editor' | 'viewer';

/** 이 사람이 이 문제집에 대해 무엇인지 */
export async function roleOf(userId: string | null, packId: string): Promise<Role | null> {
  const rows = await db().select().from(schema.packs).where(eq(schema.packs.id, packId)).limit(1);
  const pack = rows[0];
  if (!pack) return null;
  if (userId && pack.ownerId === userId) return 'owner';
  if (userId) {
    const e = await db()
      .select()
      .from(schema.packEditors)
      .where(and(eq(schema.packEditors.packId, packId), eq(schema.packEditors.userId, userId)))
      .limit(1);
    if (e.length) return 'editor';
  }
  return 'viewer';
}

/** 고칠 수 있는가 */
export async function canEdit(userId: string | null, packId: string): Promise<boolean> {
  if (!userId) return false;
  const r = await roleOf(userId, packId);
  return r === 'owner' || r === 'editor';
}

/** 주인인가 — 지우기·공유 설정·편집자 빼내기는 주인만 할 수 있습니다 */
export async function isOwner(userId: string | null, packId: string): Promise<boolean> {
  if (!userId) return false;
  return (await roleOf(userId, packId)) === 'owner';
}

/** 고칠 수 있는 사람에게만 문제집을 내줍니다. 아니면 null */
export async function packForEdit(userId: string | null, packId: string): Promise<PackRow | null> {
  if (!userId) return null;
  if (!(await canEdit(userId, packId))) return null;
  const rows = await db().select().from(schema.packs).where(eq(schema.packs.id, packId)).limit(1);
  return rows[0] ?? null;
}

/** 보기 링크로 문제집을 찾습니다. 로그인은 필요 없습니다 —
    링크에 든 22자를 아는 것이 곧 열쇠입니다 */
export async function packByViewToken(token: string): Promise<PackRow | null> {
  if (!token) return null;
  const rows = await db().select().from(schema.packs).where(eq(schema.packs.viewToken, token)).limit(1);
  return rows[0] ?? null;
}
