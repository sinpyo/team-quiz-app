import { NextResponse } from 'next/server';

import { sessionCookieOptions, signSession, upsertUser } from '@/lib/auth';
import { fakeLoginOn, safeNext, siteUrl } from '@/lib/site';

/** 구글 키 없이 나머지를 시험하기 위한 가짜 로그인입니다.
    DEV_FAKE_LOGIN=1 이고 내 컴퓨터일 때만 열립니다 — 올려둔 곳에서는 없는 길입니다. */
export async function GET(req: Request) {
  if (!fakeLoginOn()) return new NextResponse('없는 길입니다', { status: 404 });
  const url = new URL(req.url);
  const who = url.searchParams.get('who') || 'tester';
  const next = safeNext(url.searchParams.get('next'));
  const user = await upsertUser('dev:' + who, who, null);
  const res = NextResponse.redirect(siteUrl() + next);
  res.cookies.set({ ...sessionCookieOptions(), value: await signSession(user.id) });
  return res;
}
