import { NextResponse, type NextRequest } from 'next/server';

import { sessionCookieOptions, signSession, upsertUser } from '@/lib/auth';
import { LoginError, OAUTH_COOKIE, finishGoogleLogin, unpackPending } from '@/lib/google';
import { safeNext, siteUrl } from '@/lib/site';

/** 구글에서 돌아오면 여기로 옵니다. 토큰을 바꿔 받고, 가입시키고, 쿠키를 심습니다 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');

  const back = (why: string) => {
    const res = NextResponse.redirect(siteUrl() + '/?err=' + why);
    res.cookies.delete(OAUTH_COOKIE);
    return res;
  };

  if (err || !code) return back(err === 'access_denied' ? 'cancelled' : 'no-code');

  const pending = unpackPending(req.cookies.get(OAUTH_COOKIE)?.value);
  if (!pending || !state || pending.state !== state) return back('bad-state');

  try {
    const me = await finishGoogleLogin(code, pending);
    const user = await upsertUser('google:' + me.sub, me.name, me.picture, me.email);
    const res = NextResponse.redirect(siteUrl() + safeNext(pending.next));
    res.cookies.set({ ...sessionCookieOptions(), value: await signSession(user.id) });
    res.cookies.delete(OAUTH_COOKIE);
    return res;
  } catch (e) {
    return back(e instanceof LoginError ? e.why : 'login-failed');
  }
}
