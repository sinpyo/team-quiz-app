'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface PackRowView {
  id: string;
  title: string;
  viewToken: string;
  updatedAt: string;
  mine: boolean;
}

const when = (iso: string) => {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  if (min < 60 * 24) return `${Math.floor(min / 60)}시간 전`;
  if (min < 60 * 24 * 7) return `${Math.floor(min / 1440)}일 전`;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.에`;
};

export function PackList({ packs }: { packs: PackRowView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  async function make() {
    setBusy('new');
    setErr('');
    const res = await fetch('/api/packs', { method: 'POST' });
    const out = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !out.id) {
      setErr(out.error || '만들지 못했습니다');
      setBusy(null);
      return;
    }
    router.push('/edit/' + out.id);
  }

  async function remove(p: PackRowView) {
    if (!window.confirm(`"${p.title}" 을(를) 지울까요? 되돌릴 수 없습니다.`)) return;
    setBusy(p.id);
    setErr('');
    const res = await fetch('/api/packs/' + p.id, { method: 'DELETE' });
    if (!res.ok) {
      const out = (await res.json()) as { error?: string };
      setErr(out.error || '지우지 못했습니다');
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <>
      <div className="top">
        <h1>내 문제집</h1>
        <div className="row">
          <button type="button" className="btn primary" onClick={make} disabled={busy === 'new'}>
            {busy === 'new' ? '만드는 중…' : '+ 새 문제집'}
          </button>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="btn quiet">
              나가기
            </button>
          </form>
        </div>
      </div>

      {err ? <p className="warn">{err}</p> : null}

      {packs.length === 0 ? (
        <div className="empty">
          아직 만든 문제집이 없습니다.
          <br />
          <b>+ 새 문제집</b> 을 누르면 기본 문제집(16라운드 127문제)을 복사해서 시작합니다.
        </div>
      ) : (
        <div className="packs">
          {packs.map((p) => (
            <div className="pack" key={p.id}>
              <div className="name">
                <b>
                  {p.title}
                  {p.mine ? null : <em>초대받음</em>}
                </b>
                <span>{when(p.updatedAt)} 고침</span>
              </div>
              <div className="row">
                <a className="btn sm" href={'/play/' + p.viewToken}>
                  ▶ 진행
                </a>
                <a className="btn sm" href={'/edit/' + p.id}>
                  ✏️ 고치기
                </a>
                {p.mine ? (
                  <>
                    <a className="btn sm" href={'/share/' + p.id}>
                      🔗 공유
                    </a>
                    <button
                      type="button"
                      className="btn sm danger quiet"
                      onClick={() => remove(p)}
                      disabled={busy === p.id}
                    >
                      {busy === p.id ? '…' : '지우기'}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
