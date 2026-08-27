'use client';

import type { ReactNode } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="f">
      <span>
        {label}
        {hint ? <> <em>{hint}</em></> : null}
      </span>
      {children}
    </label>
  );
}

interface SetProps {
  path: string;
  value: string;
  onSet: (path: string, raw: string) => void;
}

export function Text({ path, value, onSet, big, placeholder }: SetProps & { big?: boolean; placeholder?: string }) {
  return (
    <input
      type="text"
      className={big ? 'big' : undefined}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onSet(path, e.target.value)}
    />
  );
}

export function Area({ path, value, onSet, rows = 3 }: SetProps & { rows?: number }) {
  return <textarea rows={rows} value={value} onChange={(e) => onSet(path, e.target.value)} />;
}
