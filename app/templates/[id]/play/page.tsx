import { notFound, redirect } from 'next/navigation';

import { Deck } from '@/components/deck/Deck';
import { currentUserId } from '@/lib/auth';
import { resolveTemplate } from '@/lib/library';
import '../../../globals.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

/** 기본 템플릿을 그대로 진행해 봅니다. 사람이 만든 템플릿은 그 템플릿의 보기 링크로 보냅니다 */
export default async function TemplatePlayPage({ params }: Props) {
  const { id } = await params;
  const t = await resolveTemplate(await currentUserId(), id);
  if (!t) notFound();
  if (t.source === 'db') redirect('/play/' + t.row.viewToken);
  return <Deck pack={t.builtin.pack} />;
}
