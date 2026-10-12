/* 구글 로그인.

   흐름은 이렇습니다.
   1. /api/auth/google 이 구글 로그인 화면으로 보냅니다. 그때 한 번 쓰고 버릴 값 세 개
      (state · nonce · PKCE 열쇠)를 쿠키에 적어 둡니다.
   2. 구글이 /api/auth/callback 으로 돌려보내면, 쿠키의 state 와 맞는지 보고
      받은 code 를 PKCE 열쇠와 함께 구글에 보내 id_token 으로 바꿉니다.
   3. id_token 은 구글의 공개 열쇠로 서명을 확인한 뒤에야 믿습니다. */

import { createRemoteJWKSet, jwtVerify } from 'jose';

import { authRedirectUri } from './site';

export const OAUTH_COOKIE = 'quiz_oauth';

/** 로그인 하나가 진행되는 동안 쿠키에 넣어 두는 값 */
export interface OAuthPending {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const randomB64 = (n: number) => {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b64url(b);
};

/** 구글 로그인 화면 주소와, 쿠키에 넣어 둘 값을 만듭니다 */
export async function startGoogleLogin(next: string): Promise<{ url: string; pending: OAuthPending }> {
  const pending: OAuthPending = { state: randomB64(24), nonce: randomB64(24), verifier: randomB64(48), next };
  // PKCE — 중간에 code 를 가로채도, 이 열쇠가 없으면 토큰으로 못 바꿉니다
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pending.verifier)));

  const go = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  go.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  go.searchParams.set('redirect_uri', authRedirectUri());
  go.searchParams.set('response_type', 'code');
  go.searchParams.set('scope', 'openid email profile');
  go.searchParams.set('state', pending.state);
  go.searchParams.set('nonce', pending.nonce);
  go.searchParams.set('code_challenge', b64url(digest));
  go.searchParams.set('code_challenge_method', 'S256');
  // 계정이 여러 개인 사람이 고를 수 있게 합니다
  go.searchParams.set('prompt', 'select_account');
  return { url: go.toString(), pending };
}

/* 쿠키에 넣고 꺼낼 때의 글자 바꾸기(%7B 같은 것)는 Next 가 알아서 하므로 여기서는 JSON 만 다룹니다.
   여기서 한 번 더 바꾸면 두 겹이 되어 돌아왔을 때 읽지 못합니다 */
export const packPending = (p: OAuthPending) => JSON.stringify(p);

export function unpackPending(raw: string | undefined): OAuthPending | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<OAuthPending>;
    if (typeof v.state !== 'string' || typeof v.nonce !== 'string' || typeof v.verifier !== 'string') return null;
    return { state: v.state, nonce: v.nonce, verifier: v.verifier, next: typeof v.next === 'string' ? v.next : '/' };
  } catch {
    return null;
  }
}

export interface GoogleProfile {
  sub: string;
  name: string;
  email: string | null;
  picture: string | null;
}

// 구글의 공개 열쇠. 한 번 받으면 알아서 잠시 담아 둡니다
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
const googleKeys = () => (jwks ??= createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs')));

export class LoginError extends Error {
  why: 'token-failed' | 'bad-token';
  constructor(why: 'token-failed' | 'bad-token') {
    super(why);
    this.why = why;
  }
}

/** 구글에서 받은 code 를 사람 정보로 바꿉니다 */
export async function finishGoogleLogin(code: string, pending: OAuthPending): Promise<GoogleProfile> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: authRedirectUri(),
      code_verifier: pending.verifier,
    }),
  });
  if (!res.ok) throw new LoginError('token-failed');
  const token = (await res.json()) as { id_token?: string };
  if (!token.id_token) throw new LoginError('token-failed');

  let payload: Record<string, unknown>;
  try {
    ({ payload } = await jwtVerify(token.id_token, googleKeys(), {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_CLIENT_ID!,
    }));
  } catch {
    throw new LoginError('bad-token');
  }
  // 이 로그인을 시작할 때 심은 값이 그대로 돌아왔는지 — 남의 토큰을 끼워 넣는 것을 막습니다
  if (payload.nonce !== pending.nonce || typeof payload.sub !== 'string') throw new LoginError('bad-token');

  const email = typeof payload.email === 'string' && payload.email_verified === true ? payload.email : null;
  const name =
    (typeof payload.name === 'string' && payload.name.trim()) || (email ? email.split('@')[0] : '') || '이름 없음';
  const picture = typeof payload.picture === 'string' ? payload.picture : null;
  return { sub: payload.sub, name, email, picture };
}
