import { NextResponse } from 'next/server';

import { SESSION_COOKIE } from '@/lib/auth';
import { siteUrl } from '@/lib/site';

export async function POST() {
  const res = NextResponse.redirect(siteUrl() + '/', { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
