import { NextResponse } from 'next/server';

import { OAUTH_COOKIE, packPending, startGoogleLogin } from '@/lib/google';
import { googleReady, safeNext, siteUrl } from '@/lib/site';

/** 구글 로그인 화면으로 보냅니다 */
export async function GET(req: Request) {
  if (!googleReady()) {
    return NextResponse.redirect(siteUrl() + '/?err=google-not-set');
  }
  // 로그인이 끝나면 원래 보려던 곳으로 돌려보냅니다
  const next = safeNext(new URL(req.url).searchParams.get('next'));
  const { url, pending } = await startGoogleLogin(next);

  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_COOKIE, packPending(pending), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });
  return res;
}
