import { NextResponse } from 'next/server';

import { kakaoReady, kakaoRedirectUri, siteUrl } from '@/lib/site';

/** 카카오 로그인 화면으로 보냅니다 */
export async function GET(req: Request) {
  if (!kakaoReady()) {
    return NextResponse.redirect(siteUrl() + '/?err=kakao-not-set');
  }
  const url = new URL(req.url);
  // 로그인이 끝나면 원래 보려던 곳으로 돌려보냅니다
  const next = url.searchParams.get('next') || '/';

  // 남이 흘려보낸 로그인인지 가리려고 한 번 쓰고 버리는 값을 심어 둡니다
  const state = crypto.randomUUID();

  const go = new URL('https://kauth.kakao.com/oauth/authorize');
  go.searchParams.set('client_id', process.env.KAKAO_CLIENT_ID!);
  go.searchParams.set('redirect_uri', kakaoRedirectUri());
  go.searchParams.set('response_type', 'code');
  go.searchParams.set('state', state);

  const res = NextResponse.redirect(go.toString());
  res.cookies.set('quiz_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });
  // 돌아온 뒤 어디로 갈지도 같이 적어 둡니다 (우리 안쪽 주소만 받습니다)
  res.cookies.set('quiz_oauth_next', next.startsWith('/') ? next : '/', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  });
  return res;
}
