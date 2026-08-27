/** 이 앱이 올라가 있는 주소. 카카오에 알려준 주소와 똑같아야 합니다 */
export function siteUrl(): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL;
  if (v) return v.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return 'https://' + process.env.VERCEL_URL;
  return 'http://localhost:3000';
}

export const kakaoRedirectUri = () => siteUrl() + '/api/auth/callback';

/** 카카오 키가 갖춰졌는지 */
export const kakaoReady = () => !!(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET);

/** 카카오 키 없이 나머지를 시험하는 길. 올려둔 곳에서는 절대 켜지지 않습니다 */
export const fakeLoginOn = () => process.env.NODE_ENV !== 'production' && process.env.DEV_FAKE_LOGIN === '1';
