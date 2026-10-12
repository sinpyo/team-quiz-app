/* 내 문제집과 내 템플릿을 꺼내 오는 곳.
   목록 화면과 목록 API 가 같은 것을 쓰도록 한 군데 모았습니다. */

import { desc, eq, inArray, or, sql } from 'drizzle-orm';

import { db, schema } from './db';
import { isUuid, packForEdit } from './perm';
import type { PackKind, PackRow } from './schema';
import { builtinTemplate, type BuiltinTemplate } from './templates';

export interface LibraryRow {
  id: string;
  kind: PackKind;
  title: string;
  face: string | null;
  lede: string | null;
  rounds: number;
  questions: number;
  viewToken: string;
  updatedAt: string;
  /** 내가 만든 것인지 — 아니면 편집자로 초대받은 것입니다 */
  mine: boolean;
}

const p = schema.packs;

/** 내가 만든 것과, 편집자로 초대받은 것. 최근에 고친 것부터 */
export async function myLibrary(userId: string): Promise<LibraryRow[]> {
  const invitedRows = await db()
    .select({ packId: schema.packEditors.packId })
    .from(schema.packEditors)
    .where(eq(schema.packEditors.userId, userId));
  const invited = invitedRows.map((r) => r.packId);

  const rows = await db()
    .select({
      id: p.id,
      kind: p.kind,
      title: p.title,
      ownerId: p.ownerId,
      viewToken: p.viewToken,
      updatedAt: p.updatedAt,
      // 목록에는 알맹이 전체가 필요 없어서, 데이터베이스에서 필요한 것만 뽑아 옵니다
      face: sql<string | null>`${p.data}->>'face'`,
      lede: sql<string | null>`${p.data}->>'lede'`,
      rounds: sql<number>`coalesce(jsonb_array_length(${p.data}->'rounds'), 0)::int`,
      questions: sql<number>`(
        select coalesce(sum(jsonb_array_length(coalesce(r->'q', '[]'::jsonb))), 0)::int
        from jsonb_array_elements(${p.data}->'rounds') r
      )`,
    })
    .from(p)
    .where(invited.length ? or(eq(p.ownerId, userId), inArray(p.id, invited)) : eq(p.ownerId, userId))
    .orderBy(desc(p.updatedAt));

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    face: r.face,
    lede: r.lede,
    rounds: Number(r.rounds),
    questions: Number(r.questions),
    viewToken: r.viewToken,
    updatedAt: r.updatedAt.toISOString(),
    mine: r.ownerId === userId,
  }));
}

export type ResolvedTemplate =
  | { source: 'builtin'; builtin: BuiltinTemplate }
  | { source: 'db'; row: PackRow; mine: boolean };

/** 주소의 값으로 템플릿을 찾습니다. 기본 템플릿은 누구나, 사람이 만든 템플릿은 고칠 수 있는 사람만 */
export async function resolveTemplate(userId: string | null, id: string): Promise<ResolvedTemplate | null> {
  const builtin = builtinTemplate(id);
  if (builtin) return { source: 'builtin', builtin };
  if (!isUuid(id)) return null;
  const row = await packForEdit(userId, id);
  if (!row || row.kind !== 'template') return null;
  return { source: 'db', row, mine: row.ownerId === userId };
}
