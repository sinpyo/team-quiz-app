import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { currentUserId } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { packTitle, sanitizePack } from '@/lib/pack';
import { isOwner, packForEdit } from '@/lib/perm';

type Ctx = { params: Promise<{ id: string }> };

/** 고칠 수 있는 사람에게만 내줍니다 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUserId();
  const pack = await packForEdit(me, id);
  if (!pack) return NextResponse.json({ error: '이 문제집을 고칠 수 없습니다' }, { status: 403 });
  return NextResponse.json({
    id: pack.id,
    title: pack.title,
    data: pack.data,
    viewToken: pack.viewToken,
    updatedAt: pack.updatedAt,
    mine: pack.ownerId === me,
  });
}

/** 저장. 그 사이 남이 고쳤으면 덮어쓰지 않고 알려줍니다 */
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUserId();
  const pack = await packForEdit(me, id);
  if (!pack) return NextResponse.json({ error: '이 문제집을 고칠 수 없습니다' }, { status: 403 });

  type Body = { data?: unknown; updatedAt?: string };
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: '보낸 것을 읽지 못했습니다' }, { status: 400 });
  }

  const data = sanitizePack(body?.data);
  if (!data) return NextResponse.json({ error: '문제집 모양이 올바르지 않습니다' }, { status: 400 });

  if (body?.updatedAt && new Date(body.updatedAt).getTime() !== pack.updatedAt.getTime()) {
    return NextResponse.json(
      { error: '다른 사람이 방금 고쳤습니다. 새로고침한 뒤 다시 해주세요', conflict: true },
      { status: 409 },
    );
  }

  const now = new Date();
  await db()
    .update(schema.packs)
    .set({ data, title: packTitle(data), updatedAt: now })
    .where(eq(schema.packs.id, id));

  return NextResponse.json({ ok: true, updatedAt: now.toISOString() });
}

/** 지우기 — 주인만 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUserId();
  if (!(await isOwner(me, id))) {
    return NextResponse.json({ error: '주인만 지울 수 있습니다' }, { status: 403 });
  }
  await db().delete(schema.packs).where(eq(schema.packs.id, id));
  return NextResponse.json({ ok: true });
}
