import { NextResponse } from 'next/server';
import { desc, eq, inArray, or } from 'drizzle-orm';

import { currentUserId } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { defaultPack } from '@/lib/defaultPack';
import { newViewToken } from '@/lib/ids';
import { copyPack, packTitle, sanitizePack } from '@/lib/pack';

/** 내 문제집 목록 — 내가 만든 것과, 내가 편집자로 초대받은 것 */
export async function GET() {
  const me = await currentUserId();
  if (!me) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  const mine = await db()
    .select({ packId: schema.packEditors.packId })
    .from(schema.packEditors)
    .where(eq(schema.packEditors.userId, me));
  const invited = mine.map((r) => r.packId);

  const rows = await db()
    .select({
      id: schema.packs.id,
      title: schema.packs.title,
      ownerId: schema.packs.ownerId,
      viewToken: schema.packs.viewToken,
      updatedAt: schema.packs.updatedAt,
    })
    .from(schema.packs)
    .where(invited.length ? or(eq(schema.packs.ownerId, me), inArray(schema.packs.id, invited)) : eq(schema.packs.ownerId, me))
    .orderBy(desc(schema.packs.updatedAt));

  return NextResponse.json({
    packs: rows.map((r) => ({ ...r, mine: r.ownerId === me, ownerId: undefined })),
  });
}

/** 새 문제집. 아무것도 안 보내면 기본 문제집을 복사해서 시작합니다 */
export async function POST(req: Request) {
  const me = await currentUserId();
  if (!me) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    /* 몸통이 없어도 됩니다 */
  }
  const given = (body as { data?: unknown; title?: string } | null) ?? null;

  const source = given?.data ? sanitizePack(given.data) : defaultPack;
  if (!source) return NextResponse.json({ error: '문제집 모양이 올바르지 않습니다' }, { status: 400 });

  const title = (given?.title || packTitle(source)).slice(0, 120);
  const data = copyPack(source, title);

  const [row] = await db()
    .insert(schema.packs)
    .values({ ownerId: me, title, data, viewToken: newViewToken() })
    .returning({ id: schema.packs.id, viewToken: schema.packs.viewToken });

  return NextResponse.json({ id: row.id, viewToken: row.viewToken }, { status: 201 });
}
