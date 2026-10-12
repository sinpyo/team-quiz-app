import { eq } from 'drizzle-orm';

import { AcceptInvite } from '@/components/AcceptInvite';
import { GoogleButton } from '@/components/GoogleButton';
import { currentUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { fakeLoginOn, googleReady } from '@/lib/site';
import '../../ui.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="page">
      <div className="wrap narrow">
        <div className="hero">{children}</div>
      </div>
    </main>
  );
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const rows = await db()
    .select({
      packId: schema.editInvites.packId,
      expiresAt: schema.editInvites.expiresAt,
      maxUses: schema.editInvites.maxUses,
      usedCount: schema.editInvites.usedCount,
      title: schema.packs.title,
    })
    .from(schema.editInvites)
    .innerJoin(schema.packs, eq(schema.packs.id, schema.editInvites.packId))
    .where(eq(schema.editInvites.token, token))
    .limit(1);
  const inv = rows[0];

  if (!inv) {
    return (
      <Shell>
        <div className="face">🔒</div>
        <h1>없는 초대입니다</h1>
        <p>링크가 잘못됐거나, 만든 사람이 없앴습니다. 초대해 준 분께 새 링크를 받아주세요.</p>
        <div className="row">
          <a className="btn" href="/">
            처음으로
          </a>
        </div>
      </Shell>
    );
  }

  const expired = inv.expiresAt && inv.expiresAt.getTime() < Date.now();
  const usedUp = inv.maxUses !== null && inv.usedCount >= inv.maxUses;
  if (expired || usedUp) {
    return (
      <Shell>
        <div className="face">⌛</div>
        <h1>{expired ? '기한이 지났습니다' : '다 쓰인 초대입니다'}</h1>
        <p>초대해 준 분께 새 링크를 받아주세요.</p>
        <div className="row">
          <a className="btn" href="/">
            처음으로
          </a>
        </div>
      </Shell>
    );
  }

  const me = await currentUser();
  if (!me) {
    const next = encodeURIComponent('/invite/' + token);
    return (
      <Shell>
        <div className="face">✏️</div>
        <h1>문제를 같이 만들자는 초대입니다</h1>
        <p>
          <b>{inv.title}</b> 을(를) 같이 고칠 수 있습니다. 먼저 구글 계정으로 들어와 주세요.
        </p>
        <div className="row">
          {googleReady() ? (
            <GoogleButton next={'/invite/' + token} />
          ) : (
            <p className="warn">구글 로그인이 아직 준비되지 않았습니다.</p>
          )}
          {fakeLoginOn() ? (
            <a className="btn quiet" href={'/api/auth/dev?who=손님&next=' + next}>
              (개발용) 그냥 들어가기
            </a>
          ) : null}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="face">✏️</div>
      <h1>같이 만들까요?</h1>
      <p>
        <b>{inv.title}</b> 을(를) 고칠 수 있게 됩니다. {me.name} 님으로 들어와 있습니다.
      </p>
      <AcceptInvite token={token} title={inv.title} />
    </Shell>
  );
}
