'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  /** 기본 템플릿 이름 또는 내 템플릿 번호 */
  templateId: string;
  /** 사람이 만든 템플릿이면 그 번호 — 주인에게만 '지우기' 가 붙습니다 */
  deletable: boolean;
}

/** 템플릿 화면의 단추들. 시작하기는 로그인 전에도 누를 수 있고, 로그인하고 돌아오면 이어서 만듭니다 */
export function TemplateActions({ templateId, deletable }: Props) {
  const [busy, setBusy] = useState<'' | 'start' | 'del'>('');
  const [err, setErr] = useState('');
  const tried = useRef(false);

  async function start() {
    if (busy) return;
    setBusy('start');
    setErr('');
    try {
      const res = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: { template: templateId } }),
      });
      if (res.status === 401) {
        window.location.href =
          '/api/auth/google?next=' + encodeURIComponent('/templates/' + templateId + '?start=1');
        return;
      }
      const out = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !out.id) throw new Error(out.error || '만들지 못했습니다');
      window.location.href = '/edit/' + out.id;
    } catch (e) {
      setErr(e instanceof Error ? e.message : '만들지 못했습니다');
      setBusy('');
    }
  }

  async function remove() {
    if (!window.confirm('이 템플릿을 지울까요? 이 템플릿으로 이미 만든 문제집은 그대로 남습니다.')) return;
    setBusy('del');
    setErr('');
    const res = await fetch('/api/packs/' + templateId, { method: 'DELETE' });
    if (!res.ok) {
      const out = (await res.json()) as { error?: string };
      setErr(out.error || '지우지 못했습니다');
      setBusy('');
      return;
    }
    window.location.href = '/';
  }

  /* 로그인하고 돌아왔으면 이어서 만듭니다 — 한 번만 */
  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    if (new URLSearchParams(window.location.search).get('start') === '1') void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button type="button" className="btn primary" onClick={start} disabled={!!busy}>
        {busy === 'start' ? '만드는 중…' : '이 템플릿으로 문제집 만들기'}
      </button>
      {deletable ? (
        <button type="button" className="btn danger quiet" onClick={remove} disabled={!!busy}>
          {busy === 'del' ? '지우는 중…' : '템플릿 지우기'}
        </button>
      ) : null}
      {err ? <p className="warn" style={{ flexBasis: '100%' }}>{err}</p> : null}
    </>
  );
}
