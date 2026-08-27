import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { currentUserId } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { newInviteToken } from '@/lib/ids';
import { isOwner } from '@/lib/perm';
import { siteUrl } from '@/lib/site';

type Ctx = { params: Promise<{ id: string }> };

/** 지금 살아 있는 초대 링크와 편집자 목록 — 주인만 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUserId();
  if (!(await isOwner(me, id))) {
    return NextResponse.json({ error: '주인만 볼 수 있습니다' }, { status: 403 });
  }

  const invites = await db().select().from(schema.editInvites).where(eq(schema.editInvites.packId, id));
  const editors = await db()
    .select({ userId: schema.users.id, name: schema.users.name, addedAt: schema.packEditors.addedAt })
    .from(schema.packEditors)
    .innerJoin(schema.users, eq(schema.users.id, schema.packEditors.userId))
    .where(eq(schema.packEditors.packId, id));

  return NextResponse.json({
    invites: invites.map((i) => ({
      token: i.token,
      url: siteUrl() + '/invite/' + i.token,
      expiresAt: i.expiresAt,
      maxUses: i.maxUses,
      usedCount: i.usedCount,
    })),
    editors,
  });
}

/** 편집 초대 링크 만들기 — 주인만 */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUserId();
  if (!(await isOwner(me, id))) {
    return NextResponse.json({ error: '주인만 만들 수 있습니다' }, { status: 403 });
  }

  type Body = { days?: number; maxUses?: number };
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    /* 기본값으로 만듭니다 */
  }
  const days = Number.isFinite(body?.days) ? Math.min(Math.max(Number(body!.days), 1), 365) : 14;
  const maxUses = Number.isFinite(body?.maxUses) ? Math.min(Math.max(Number(body!.maxUses), 1), 100) : null;

  const token = newInviteToken();
  await db().insert(schema.editInvites).values({
    token,
    packId: id,
    createdBy: me!,
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    maxUses,
  });

  return NextResponse.json({ token, url: siteUrl() + '/invite/' + token }, { status: 201 });
}

/** 초대 링크 모두 무효로 만들기 (다시 만들기) — 주인만.
    token 을 주면 그것 하나만 없앱니다 */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUserId();
  if (!(await isOwner(me, id))) {
    return NextResponse.json({ error: '주인만 없앨 수 있습니다' }, { status: 403 });
  }
  const token = new URL(req.url).searchParams.get('token');
  await db()
    .delete(schema.editInvites)
    .where(
      token
        ? and(eq(schema.editInvites.packId, id), eq(schema.editInvites.token, token))
        : eq(schema.editInvites.packId, id),
    );
  return NextResponse.json({ ok: true });
}
