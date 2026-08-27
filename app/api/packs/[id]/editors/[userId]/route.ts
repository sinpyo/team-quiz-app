import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { currentUserId } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { isOwner } from '@/lib/perm';

type Ctx = { params: Promise<{ id: string; userId: string }> };

/** 편집자 빼내기 — 주인만. 뺀 즉시 그 사람은 저장하지 못합니다 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, userId } = await params;
  const me = await currentUserId();
  if (!(await isOwner(me, id))) {
    return NextResponse.json({ error: '주인만 뺄 수 있습니다' }, { status: 403 });
  }
  await db()
    .delete(schema.packEditors)
    .where(and(eq(schema.packEditors.packId, id), eq(schema.packEditors.userId, userId)));
  return NextResponse.json({ ok: true });
}
