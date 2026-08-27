import { notFound } from 'next/navigation';

import { Deck } from '@/components/deck/Deck';
import { currentUserId } from '@/lib/auth';
import { canEdit, packByViewToken } from '@/lib/perm';
import '../../globals.css';

/* 보기 링크로 여는 화면입니다. 로그인은 필요 없습니다 —
   주소에 든 22자를 아는 것이 곧 열쇠입니다.

   고칠 수 있는 사람에게만 '문제 고치기' 가 뜹니다.
   보기 권한만 있는 사람은 아예 고칠 수 없고, 대신 자기 것으로 베껴 갈 수 있습니다. */

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  const pack = await packByViewToken(token);
  return { title: pack?.title || '단체 게임 퀴즈' };
}

export default async function PlayPage({ params }: Props) {
  const { token } = await params;
  const pack = await packByViewToken(token);
  if (!pack) notFound();

  const me = await currentUserId();
  const mayEdit = await canEdit(me, pack.id);

  return (
    <Deck
      pack={pack.data}
      editHref={mayEdit ? `/edit/${pack.id}` : null}
      copyFrom={mayEdit ? null : pack.viewToken}
    />
  );
}
