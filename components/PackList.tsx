'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { LibraryRow } from '@/lib/library';
import { saveAsTemplate } from './saveAsTemplate';

const when = (iso: string) => {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  if (min < 60 * 24) return `${Math.floor(min / 60)}시간 전`;
  if (min < 60 * 24 * 7) return `${Math.floor(min / 1440)}일 전`;
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.에`;
};

export function PackList({ packs }: { packs: LibraryRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function remove(p: LibraryRow) {
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

  async function toTemplate(p: LibraryRow) {
    setErr('');
    setMsg('');
    setBusy(p.id);
    const out = await saveAsTemplate(p.id, p.title);
    setBusy(null);
    if (out.error) setErr(out.error);
    if (out.id) {
      setMsg('템플릿으로 저장했습니다. 위의 템플릿 목록에 들어 있습니다.');
      router.refresh();
    }
  }

  return (
    <>
      {err ? <p className="warn">{err}</p> : null}
      {msg ? <p className="ok">{msg}</p> : null}

      {packs.length === 0 ? (
        <div className="empty">
          아직 만든 문제집이 없습니다.
          <br />
          위에서 <b>템플릿</b>을 하나 골라 시작하세요.
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
                <span>
                  {p.rounds}라운드 · {p.questions}문제 · {when(p.updatedAt)} 고침
                </span>
              </div>
              <div className="row">
                <a className="btn sm" href={'/play/' + p.viewToken}>
                  ▶ 진행
                </a>
                <a className="btn sm" href={'/edit/' + p.id}>
                  ✏️ 고치기
                </a>
                {p.mine ? (
                  <a className="btn sm" href={'/share/' + p.id}>
                    🔗 공유
                  </a>
                ) : null}
                <button type="button" className="btn sm" onClick={() => toTemplate(p)} disabled={busy === p.id}>
                  📑 템플릿으로 저장
                </button>
                {p.mine ? (
                  <button
                    type="button"
                    className="btn sm danger quiet"
                    onClick={() => remove(p)}
                    disabled={busy === p.id}
                  >
                    {busy === p.id ? '…' : '지우기'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
