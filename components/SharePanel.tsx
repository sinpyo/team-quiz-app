'use client';

import { useCallback, useEffect, useState } from 'react';

interface Invite {
  token: string;
  url: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
}
interface Editor {
  userId: string;
  name: string;
  addedAt: string;
}

function Copyable({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="linkbox">
      <input readOnly value={value} aria-label={label} onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        className="btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
          } catch {
            /* 복사가 막힌 곳에서는 주소칸을 직접 고르면 됩니다 */
          }
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }}
      >
        {done ? '복사했습니다' : '복사'}
      </button>
    </div>
  );
}

const fmt = (iso: string | null) => {
  if (!iso) return '기한 없음';
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. 까지`;
};

export function SharePanel({ packId, title, viewUrl }: { packId: string; title: string; viewUrl: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [days, setDays] = useState(14);
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const reload = useCallback(async () => {
    const res = await fetch(`/api/packs/${packId}/invites`);
    if (!res.ok) return;
    const out = (await res.json()) as { invites: Invite[]; editors: Editor[] };
    setInvites(out.invites);
    setEditors(out.editors);
  }, [packId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function makeInvite() {
    setBusy(true);
    setErr('');
    const res = await fetch(`/api/packs/${packId}/invites`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ days, ...(maxUses === '' ? {} : { maxUses: Number(maxUses) }) }),
    });
    if (!res.ok) {
      const out = (await res.json()) as { error?: string };
      setErr(out.error || '만들지 못했습니다');
    }
    setBusy(false);
    await reload();
  }

  async function dropInvite(token?: string) {
    const all = !token;
    if (!window.confirm(all ? '초대 링크를 모두 없앨까요? 이미 나눠준 링크가 안 먹히게 됩니다.' : '이 초대 링크를 없앨까요?')) return;
    await fetch(`/api/packs/${packId}/invites` + (token ? '?token=' + encodeURIComponent(token) : ''), {
      method: 'DELETE',
    });
    await reload();
  }

  async function dropEditor(e: Editor) {
    if (!window.confirm(`${e.name} 님을 편집자에서 뺄까요? 바로 저장할 수 없게 됩니다.`)) return;
    await fetch(`/api/packs/${packId}/editors/${e.userId}`, { method: 'DELETE' });
    await reload();
  }

  return (
    <>
      <div className="card">
        <h2>보기 링크</h2>
        <p className="lede">
          이 링크를 받은 사람은 <b>퀴즈를 진행만</b> 할 수 있습니다. 문제는 고치지 못합니다.
          로그인도 필요 없어서, 모임 자리에서 그냥 열면 됩니다.
        </p>
        <Copyable label="보기 링크" value={viewUrl} />
      </div>

      <div className="card">
        <h2>편집 초대</h2>
        <p className="lede">
          같이 문제를 만들 사람에게만 주세요. 이 링크를 열고 카카오로 들어오면 그때부터
          <b> 이 문제집을 고칠 수 있습니다.</b>
        </p>

        <div className="row" style={{ alignItems: 'flex-end', gap: '.7rem', marginBottom: '.9rem' }}>
          <label className="field" style={{ margin: 0 }}>
            <span>언제까지</span>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={1}>하루</option>
              <option value={7}>일주일</option>
              <option value={14}>2주</option>
              <option value={30}>한 달</option>
              <option value={365}>1년</option>
            </select>
          </label>
          <label className="field" style={{ margin: 0 }}>
            <span>몇 명까지 (비우면 제한 없음)</span>
            <input
              type="number"
              min={1}
              max={100}
              value={maxUses}
              placeholder="제한 없음"
              onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </label>
          <button type="button" className="btn primary" onClick={makeInvite} disabled={busy}>
            {busy ? '만드는 중…' : '초대 링크 만들기'}
          </button>
        </div>

        {err ? <p className="warn">{err}</p> : null}

        {invites.length === 0 ? (
          <p className="lede" style={{ margin: 0 }}>
            아직 만든 초대 링크가 없습니다.
          </p>
        ) : (
          <div className="people">
            {invites.map((i) => (
              <div key={i.token}>
                <Copyable label="편집 초대 링크" value={i.url} />
                <div className="row" style={{ justifyContent: 'space-between', marginTop: '.35rem' }}>
                  <span style={{ color: 'var(--mute)', fontSize: '.78rem' }}>
                    {fmt(i.expiresAt)} · {i.maxUses === null ? `${i.usedCount}명 받음` : `${i.usedCount} / ${i.maxUses}명`}
                  </span>
                  <button type="button" className="btn sm quiet danger" onClick={() => dropInvite(i.token)}>
                    이 링크 없애기
                  </button>
                </div>
              </div>
            ))}
            {invites.length > 1 ? (
              <button type="button" className="btn sm quiet danger" onClick={() => dropInvite()}>
                초대 링크 전부 없애기
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="card">
        <h2>고칠 수 있는 사람</h2>
        <p className="lede">
          {`"${title}"`} 은(는) 내 것입니다. 아래 사람들이 같이 고칠 수 있습니다.
          빼면 그 자리에서 바로 저장하지 못하게 됩니다.
        </p>
        {editors.length === 0 ? (
          <p className="lede" style={{ margin: 0 }}>
            아직 아무도 없습니다. 나만 고칠 수 있습니다.
          </p>
        ) : (
          <div className="people">
            {editors.map((e) => (
              <div className="person" key={e.userId}>
                <div>
                  <b>{e.name}</b>{' '}
                  <span>{new Date(e.addedAt).toLocaleDateString('ko-KR')} 부터</span>
                </div>
                <button type="button" className="btn sm quiet danger" onClick={() => dropEditor(e)}>
                  빼기
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
