import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

import { currentUserId } from '@/lib/auth';
import { db, schema } from '@/lib/db';

type Ctx = { params: Promise<{ token: string }> };

async function findInvite(token: string) {
  const rows = await db()
    .select({
      token: schema.editInvites.token,
      packId: schema.editInvites.packId,
      expiresAt: schema.editInvites.expiresAt,
      maxUses: schema.editInvites.maxUses,
      usedCount: schema.editInvites.usedCount,
      title: schema.packs.title,
      ownerId: schema.packs.ownerId,
    })
    .from(schema.editInvites)
    .innerJoin(schema.packs, eq(schema.packs.id, schema.editInvites.packId))
    .where(eq(schema.editInvites.token, token))
    .limit(1);
  return rows[0] ?? null;
}

function why(inv: NonNullable<Awaited<ReturnType<typeof findInvite>>>): string | null {
  if (inv.expiresAt && inv.expiresAt.getTime() < Date.now()) return '이 초대 링크는 기한이 지났습니다';
  if (inv.maxUses !== null && inv.usedCount >= inv.maxUses) return '이 초대 링크는 다 쓰였습니다';
  return null;
}

/** 이 초대가 아직 쓸 수 있는지, 어느 문제집인지 알려줍니다 */
export async function GET(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const inv = await findInvite(token);
  if (!inv) return NextResponse.json({ error: '그런 초대 링크가 없습니다' }, { status: 404 });
  const bad = why(inv);
  if (bad) return NextResponse.json({ error: bad }, { status: 410 });
  return NextResponse.json({ packId: inv.packId, title: inv.title });
}

/** 초대 받기 — 로그인해야 합니다 */
export async function POST(_req: Request, { params }: Ctx) {
  const { token } = await params;
  const me = await currentUserId();
  if (!me) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  const inv = await findInvite(token);
  if (!inv) return NextResponse.json({ error: '그런 초대 링크가 없습니다' }, { status: 404 });
  const bad = why(inv);
  if (bad) return NextResponse.json({ error: bad }, { status: 410 });

  // 주인이 자기 초대를 받는 것은 아무 일도 하지 않습니다
  if (inv.ownerId === me) return NextResponse.json({ packId: inv.packId, already: true });

  const added = await db()
    .insert(schema.packEditors)
    .values({ packId: inv.packId, userId: me })
    .onConflictDoNothing()
    .returning({ packId: schema.packEditors.packId });

  // 새로 들어온 사람일 때만 쓴 횟수를 올립니다
  if (added.length) {
    await db()
      .update(schema.editInvites)
      .set({ usedCount: sql`${schema.editInvites.usedCount} + 1` })
      .where(eq(schema.editInvites.token, token));
  }

  return NextResponse.json({ packId: inv.packId, already: added.length === 0 });
}
