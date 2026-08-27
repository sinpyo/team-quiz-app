import { desc, eq, inArray, or } from 'drizzle-orm';

import { PackList, type PackRowView } from '@/components/PackList';
import { currentUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { fakeLoginOn, kakaoReady } from '@/lib/site';
import './ui.css';

export const dynamic = 'force-dynamic';

const REASON: Record<string, string> = {
  cancelled: '로그인을 취소하셨습니다.',
  'kakao-not-set': '카카오 로그인이 아직 준비되지 않았습니다.',
  'bad-state': '로그인이 올바르게 이어지지 않았습니다. 다시 해주세요.',
  'token-failed': '카카오와 이야기하지 못했습니다. 다시 해주세요.',
  'me-failed': '카카오에서 정보를 받지 못했습니다. 다시 해주세요.',
  'no-code': '로그인이 끝나지 않았습니다. 다시 해주세요.',
  'login-failed': '로그인하지 못했습니다. 다시 해주세요.',
};

export default async function Home({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const me = await currentUser();

  if (!me) {
    return (
      <main className="page">
        <div className="wrap narrow">
          <div className="hero">
            <div className="face">🎲</div>
            <h1>단체 게임 퀴즈</h1>
            <p>
              친구들끼리 모여서 하는 팀 대항 퀴즈입니다. 화면에 띄워놓고 키보드로 넘기면 됩니다.
              16개 라운드, 127문제가 들어 있습니다.
            </p>
            {err && REASON[err] ? <p className="warn">{REASON[err]}</p> : null}
            <div className="row">
              {kakaoReady() ? (
                <a className="btn kakao" href="/api/auth/kakao">
                  카카오로 시작하기
                </a>
              ) : null}
              <a className="btn" href="/play/demo">
                ▶ 로그인 없이 해보기
              </a>
              {fakeLoginOn() ? (
                <a className="btn quiet" href="/api/auth/dev?who=나">
                  (개발용) 그냥 들어가기
                </a>
              ) : null}
            </div>
            <p className="note">
              로그인하면 내 문제집을 만들어 자유롭게 고칠 수 있습니다. 링크로 나눠줘도
              <b> 받은 사람은 못 고치고</b>, 고칠 사람만 따로 초대할 수 있습니다.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const invitedRows = await db()
    .select({ packId: schema.packEditors.packId })
    .from(schema.packEditors)
    .where(eq(schema.packEditors.userId, me.id));
  const invited = invitedRows.map((r) => r.packId);

  const rows = await db()
    .select({
      id: schema.packs.id,
      title: schema.packs.title,
      ownerId: schema.packs.ownerId,
      viewToken: schema.packs.viewToken,
      updatedAt: schema.packs.updatedAt,
    })
    .from(schema.packs)
    .where(
      invited.length
        ? or(eq(schema.packs.ownerId, me.id), inArray(schema.packs.id, invited))
        : eq(schema.packs.ownerId, me.id),
    )
    .orderBy(desc(schema.packs.updatedAt));

  const packs: PackRowView[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    viewToken: r.viewToken,
    updatedAt: r.updatedAt.toISOString(),
    mine: r.ownerId === me.id,
  }));

  return (
    <main className="page">
      <div className="wrap">
        <PackList packs={packs} />
        <p className="note">
          {me.name} 님으로 들어와 있습니다 · <a className="back" href="/play/demo">기본 문제집으로 그냥 해보기</a>
        </p>
      </div>
    </main>
  );
}
