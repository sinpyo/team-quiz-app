'use client';

import { useState } from 'react';

export function AcceptInvite({ token, title }: { token: string; title: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function accept() {
    setBusy(true);
    setErr('');
    const res = await fetch('/api/invites/' + token, { method: 'POST' });
    const out = (await res.json()) as { packId?: string; error?: string };
    if (!res.ok || !out.packId) {
      setErr(out.error || '초대를 받지 못했습니다');
      setBusy(false);
      return;
    }
    window.location.href = '/edit/' + out.packId;
  }

  return (
    <>
      {err ? <p className="warn">{err}</p> : null}
      <div className="row" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn primary" onClick={accept} disabled={busy}>
          {busy ? '들어가는 중…' : `"${title}" 같이 만들기`}
        </button>
        <a className="btn quiet" href="/">
          그만두기
        </a>
      </div>
    </>
  );
}
