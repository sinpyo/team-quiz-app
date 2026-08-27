import { NextResponse } from 'next/server';

import { currentUserId } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { newViewToken } from '@/lib/ids';
import { copyPack, packTitle } from '@/lib/pack';
import { packByViewToken } from '@/lib/perm';

/** 남의 문제집을 내 것으로 베낍니다. 원본은 건드리지 않습니다 */
export async function POST(req: Request) {
  const me = await currentUserId();
  if (!me) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  type Body = { from?: string };
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    /* 무시 */
  }
  const from = body?.from;
  if (!from) return NextResponse.json({ error: '어느 문제집인지 알려주세요' }, { status: 400 });

  const src = await packByViewToken(from);
  if (!src) return NextResponse.json({ error: '그런 문제집이 없습니다' }, { status: 404 });

  const title = (packTitle(src.data) + ' (사본)').slice(0, 120);
  const [row] = await db()
    .insert(schema.packs)
    .values({ ownerId: me, title, data: copyPack(src.data, title), viewToken: newViewToken() })
    .returning({ id: schema.packs.id, viewToken: schema.packs.viewToken });

  return NextResponse.json({ id: row.id, viewToken: row.viewToken }, { status: 201 });
}
