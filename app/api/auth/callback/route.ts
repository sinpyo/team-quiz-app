import { NextResponse } from 'next/server';

import { sessionCookieOptions, signSession, upsertUser } from '@/lib/auth';
import { kakaoRedirectUri, siteUrl } from '@/lib/site';

/** 카카오에서 돌아오면 여기로 옵니다. 토큰을 바꿔 받고, 가입시키고, 쿠키를 심습니다 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');

  const back = (why: string) => NextResponse.redirect(siteUrl() + '/?err=' + why);

  if (err || !code) return back(err === 'access_denied' ? 'cancelled' : 'no-code');

  const jar = req.headers.get('cookie') || '';
  const read = (k: string) => jar.match(new RegExp('(?:^|; )' + k + '=([^;]*)'))?.[1];
  if (!state || read('quiz_oauth_state') !== state) return back('bad-state');
  const next = decodeURIComponent(read('quiz_oauth_next') || '/');

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID!,
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
      redirect_uri: kakaoRedirectUri(),
      code,
    });
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });
    if (!tokenRes.ok) return back('token-failed');
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) return back('token-failed');

    const meRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: 'Bearer ' + token.access_token },
    });
    if (!meRes.ok) return back('me-failed');
    const me = (await meRes.json()) as {
      id?: number | string;
      kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } };
      properties?: { nickname?: string; profile_image?: string };
    };
    if (me.id === undefined) return back('me-failed');

    const profile = me.kakao_account?.profile;
    const name = profile?.nickname || me.properties?.nickname || '이름 없음';
    const avatar = profile?.profile_image_url || me.properties?.profile_image || null;

    const user = await upsertUser(String(me.id), name, avatar);
    const res = NextResponse.redirect(siteUrl() + (next.startsWith('/') ? next : '/'));
    res.cookies.set({ ...sessionCookieOptions(), value: await signSession(user.id) });
    res.cookies.delete('quiz_oauth_state');
    res.cookies.delete('quiz_oauth_next');
    return res;
  } catch {
    return back('login-failed');
  }
}
