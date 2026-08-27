import { notFound, redirect } from 'next/navigation';

import { Editor } from '@/components/editor/Editor';
import { currentUserId } from '@/lib/auth';
import { packForEdit } from '@/lib/perm';
import '../../editor.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ packId: string }> };

export const metadata = { title: '문제 고치기 · 단체 게임 퀴즈' };

/* 고칠 수 있는 사람에게만 열립니다.
   보기 권한만 있는 사람이 주소를 직접 쳐도 여기서 막힙니다 — 화면이 아니라 서버가 막습니다. */
export default async function EditPage({ params }: Props) {
  const { packId } = await params;
  const me = await currentUserId();
  if (!me) redirect('/api/auth/kakao?next=' + encodeURIComponent('/edit/' + packId));

  const pack = await packForEdit(me, packId);
  if (!pack) notFound();

  return (
    <Editor
      packId={pack.id}
      title={pack.title}
      initial={pack.data}
      initialUpdatedAt={pack.updatedAt.toISOString()}
      viewToken={pack.viewToken}
      mine={pack.ownerId === me}
    />
  );
}
