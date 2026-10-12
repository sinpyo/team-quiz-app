/** 이 앱이 올라가 있는 주소. 구글에 등록한 Redirect URI 와 앞부분이 똑같아야 합니다 */
export function siteUrl(): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL;
  if (v) return v.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return 'https://' + process.env.VERCEL_URL;
  return 'http://localhost:3000';
}

export const authRedirectUri = () => siteUrl() + '/api/auth/callback';

/** 구글 키가 갖춰졌는지 */
export const googleReady = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** 구글 키 없이 나머지를 시험하는 길. 올려둔 곳에서는 절대 켜지지 않습니다 */
export const fakeLoginOn = () => process.env.NODE_ENV !== 'production' && process.env.DEV_FAKE_LOGIN === '1';

/** 로그인이 끝나고 돌아갈 곳. 우리 사이트 안쪽 주소만 받습니다 */
export function safeNext(v: string | null | undefined): string {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return '/';
  return v;
}

/** 로그인하러 가는 주소. 끝나면 next 로 돌아옵니다 */
export const loginHref = (next?: string) =>
  '/api/auth/google' + (next ? '?next=' + encodeURIComponent(next) : '');
