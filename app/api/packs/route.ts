import { NextResponse } from 'next/server';

import { currentUserId } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { defaultPack } from '@/lib/defaultPack';
import { newViewToken } from '@/lib/ids';
import { myLibrary, resolveTemplate } from '@/lib/library';
import { copyPack, packTitle, sanitizePack } from '@/lib/pack';
import { packForEdit } from '@/lib/perm';
import type { PackKind } from '@/lib/schema';
import type { Pack } from '@/lib/types';

/** 내 문제집과 내 템플릿 — 내가 만든 것과, 내가 편집자로 초대받은 것 */
export async function GET() {
  const me = await currentUserId();
  if (!me) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  return NextResponse.json({ packs: await myLibrary(me) });
}

type Body = {
  /** 무엇을 베껴서 만들지 — 템플릿(기본 템플릿 이름 또는 번호) 이나 내 문제집 번호 */
  from?: { template?: string; pack?: string };
  /** 손으로 만든 문제집 (.json 불러오기) */
  data?: unknown;
  title?: string;
  /** 'template' 이면 템플릿으로 저장합니다. 비우면 문제집입니다 */
  kind?: PackKind;
};

/** 새 문제집 또는 새 템플릿. 아무것도 안 보내면 기본 문제집을 복사해서 시작합니다 */
export async function POST(req: Request) {
  const me = await currentUserId();
  if (!me) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });

  let body: Body = {};
  try {
    body = ((await req.json()) as Body | null) ?? {};
  } catch {
    /* 몸통이 없어도 됩니다 */
  }

  let source: Pack | null = null;
  let fallbackTitle = '';

  if (body.from?.template) {
    const t = await resolveTemplate(me, body.from.template);
    if (!t) return NextResponse.json({ error: '그런 템플릿이 없습니다' }, { status: 404 });
    source = t.source === 'builtin' ? t.builtin.pack : t.row.data;
    fallbackTitle = t.source === 'builtin' ? packTitle(t.builtin.pack) : t.row.title;
  } else if (body.from?.pack) {
    // 고칠 수 있는 문제집만 베낄 수 있습니다. 보기 링크만 가진 사람은 /api/packs/copy 를 씁니다
    const row = await packForEdit(me, body.from.pack);
    if (!row) return NextResponse.json({ error: '이 문제집을 가져올 수 없습니다' }, { status: 403 });
    source = row.data;
    fallbackTitle = row.title;
  } else if (body.data) {
    source = sanitizePack(body.data);
    if (!source) return NextResponse.json({ error: '문제집 모양이 올바르지 않습니다' }, { status: 400 });
    fallbackTitle = packTitle(source);
  } else {
    source = defaultPack;
    fallbackTitle = packTitle(defaultPack);
  }

  const kind: PackKind = body.kind === 'template' ? 'template' : 'pack';
  const title = ((typeof body.title === 'string' && body.title.trim()) || fallbackTitle).slice(0, 120);
  const data = copyPack(source, title);

  const [row] = await db()
    .insert(schema.packs)
    .values({ ownerId: me, kind, title, data, viewToken: newViewToken() })
    .returning({ id: schema.packs.id, viewToken: schema.packs.viewToken });

  return NextResponse.json({ id: row.id, viewToken: row.viewToken, kind }, { status: 201 });
}
