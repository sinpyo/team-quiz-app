/* 데이터베이스에 붙습니다.

   올려둔 곳(Vercel)에서는 요청마다 새로 뜨므로 연결을 붙잡아 둘 수 없습니다.
   그래서 Neon 은 HTTP 로 말하는 드라이버를 씁니다.
   내 컴퓨터에서 그냥 Postgres 를 띄워 볼 때는 보통 드라이버를 씁니다.

   두 드라이버는 쓰는 법이 똑같아서, 밖에서는 한 가지로만 보이게 해 둡니다. */

import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

import * as schema from './schema';

type DB = NodePgDatabase<typeof schema>;

function make(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL 이 없습니다. .env.local 에 넣어주세요 (Neon 연결 문자열 또는 내 컴퓨터의 postgres 주소).',
    );
  }
  if (url.includes('neon.tech') || url.includes('neon.build')) {
    // 쓰는 법이 같으므로 같은 것으로 봅니다
    return drizzleNeon(neon(url), { schema }) as unknown as DB;
  }
  // 내 컴퓨터용 — 한 번 만든 연결 주머니를 다시 씁니다
  const g = globalThis as unknown as { __quizPool?: Pool };
  g.__quizPool ??= new Pool({ connectionString: url, max: 4 });
  return drizzlePg(g.__quizPool, { schema });
}

let cached: DB | null = null;
export function db(): DB {
  cached ??= make();
  return cached;
}

export { schema };
