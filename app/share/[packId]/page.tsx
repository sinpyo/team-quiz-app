import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { SharePanel } from '@/components/SharePanel';
import { currentUserId } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { isOwner } from '@/lib/perm';
import { siteUrl } from '@/lib/site';
import '../../ui.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ packId: string }> };

export default async function SharePage({ params }: Props) {
  const { packId } = await params;
  const me = await currentUserId();
  if (!me) redirect('/api/auth/kakao?next=' + encodeURIComponent('/share/' + packId));
  if (!(await isOwner(me, packId))) notFound();

  const rows = await db()
    .select({ title: schema.packs.title, viewToken: schema.packs.viewToken })
    .from(schema.packs)
    .where(eq(schema.packs.id, packId))
    .limit(1);
  const pack = rows[0];
  if (!pack) notFound();

  return (
    <main className="page">
      <div className="wrap narrow">
        <div className="top">
          <h1>{pack.title} 나눠주기</h1>
          <a className="back" href="/">
            ← 내 문제집
          </a>
        </div>
        <SharePanel packId={packId} title={pack.title} viewUrl={siteUrl() + '/play/' + pack.viewToken} />
      </div>
    </main>
  );
}
