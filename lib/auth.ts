/* 누가 들어왔는지 가립니다.

   로그인하면 우리가 만든 쪽지(JWT)를 httpOnly 쿠키에 넣어 둡니다.
   같은 도메인에서 프론트와 서버가 같이 돌기 때문에 이게 제일 단순합니다. */

import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';

import { db, schema } from './db';
import type { UserRow } from './schema';

const COOKIE = 'quiz_session';
const DAYS = 30;

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET 이 없거나 너무 짧습니다 (32자 이상이 필요합니다).');
  }
  return new TextEncoder().encode(s);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DAYS}d`)
    .sign(secret());
}

export function sessionCookieOptions() {
  return {
    name: COOKIE,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DAYS * 24 * 60 * 60,
  };
}

export const SESSION_COOKIE = COOKIE;

/** 지금 들어온 사람의 아이디. 로그인하지 않았으면 null */
export async function currentUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === 'string' ? payload.uid : null;
  } catch {
    return null;
  }
}

/** 지금 들어온 사람. 로그인하지 않았으면 null */
export async function currentUser(): Promise<UserRow | null> {
  const id = await currentUserId();
  if (!id) return null;
  const rows = await db().select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return rows[0] ?? null;
}

/** 카카오에서 받은 사람을 우리 쪽에 없으면 넣고, 있으면 이름·사진만 새로 고칩니다 */
export async function upsertUser(kakaoId: string, name: string, avatarUrl: string | null): Promise<UserRow> {
  const [row] = await db()
    .insert(schema.users)
    .values({ kakaoId, name, avatarUrl })
    .onConflictDoUpdate({ target: schema.users.kakaoId, set: { name, avatarUrl } })
    .returning();
  return row;
}
