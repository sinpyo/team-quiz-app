'use client';

import type { Question } from '@/lib/types';
import { Area, Field, Text } from './Field';
import { KINDS, kindOf, type KindValue } from './paths';

function Preview({ it }: { it: Question }) {
  const kind = kindOf(it);
  const src = kind === 'song' ? it.art || (it.yt ? `https://img.youtube.com/vi/${encodeURIComponent(it.yt)}/hqdefault.jpg` : '') : '';
  const empty = !it.g && !src && !it.q && !it.s && !it.a;
  return (
    <div className="prev">
      {it.g ? <div className={'g ' + (it.k || '')}>{it.g}</div> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="앨범 사진" /> : null}
      {it.q ? <p className="q">{it.q}</p> : null}
      {it.s ? <p className="s">{it.s}</p> : null}
      {it.a ? <p className="a">{it.a}</p> : null}
      {empty ? <p className="none">아직 아무것도 없습니다</p> : null}
    </div>
  );
}

interface Props {
  it: Question;
  i: number;
  ri: number;
  open: boolean;
  onToggle: () => void;
  onSet: (path: string, raw: string) => void;
  onKind: (i: number, v: KindValue) => void;
  onMove: (i: number, dir: number) => void;
  onDup: (i: number) => void;
  onDel: (i: number) => void;
}

export function QuestionCard({ it, i, ri, open, onToggle, onSet, onKind, onMove, onDup, onDel }: Props) {
  const kind = kindOf(it);
  const spec = KINDS.find((k) => k.v === kind)!;
  const p = `rounds.${ri}.q.${i}.`;
  const peek = it.g || it.q || it.a || '(빈 문제)';
  const moreOpen = !!(it.tag || it.opts || it.roles || it.full || it.list || it.size || it.artText);

  return (
    <div className="qcard" data-open={open ? 1 : 0}>
      <div className="row" style={{ gap: 0 }}>
        <button className="qhead" type="button" onClick={onToggle}>
          <span className="no">{it.tag ? it.tag : 'Q' + (i + 1)}</span>
          <span className="peek">
            {peek}
            {it.a ? <s> — {it.a}</s> : null}
          </span>
        </button>
        <div className="qtools" style={{ paddingRight: '.6em' }}>
          <button className="btn sm" type="button" title="위로" onClick={() => onMove(i, -1)}>↑</button>
          <button className="btn sm" type="button" title="아래로" onClick={() => onMove(i, 1)}>↓</button>
          <button className="btn sm" type="button" title="복제" onClick={() => onDup(i)}>⧉</button>
          <button className="btn sm danger" type="button" title="삭제" onClick={() => onDel(i)}>✕</button>
        </div>
      </div>

      <div className="qbody">
        <div className="grid two">
          <div className="grid">
            <Field label="종류">
              <select value={kind} onChange={(e) => onKind(i, e.target.value as KindValue)}>
                {KINDS.map((k) => (
                  <option key={k.v} value={k.v}>
                    {k.n}
                  </option>
                ))}
              </select>
            </Field>

            {spec.g ? (
              <Field label={spec.g} hint={spec.ph ?? undefined}>
                <Text path={p + 'g'} value={it.g || ''} onSet={onSet} big />
              </Field>
            ) : null}

            {kind === 'song' ? (
              <Field label="유튜브 주소 또는 번호" hint="주소를 그대로 붙여넣어도 됩니다">
                <Text path={p + 'yt'} value={it.yt || ''} onSet={onSet} />
              </Field>
            ) : null}

            <Field label="문제 문장" hint="없어도 됩니다">
              <Area path={p + 'q'} value={it.q || ''} onSet={onSet} rows={2} />
            </Field>
            <Field label="안내 한 줄" hint="화면 아래 작게 나옵니다">
              <Text path={p + 's'} value={it.s || ''} onSet={onSet} />
            </Field>
            <Field label="정답" hint={kind === 'song' ? '예: 김종국 — 사랑스러워' : undefined}>
              <Area path={p + 'a'} value={it.a || ''} onSet={onSet} rows={2} />
            </Field>
            <Field label="정답 덧붙임" hint="정답 아래 작은 글씨">
              <Area path={p + 'note'} value={it.note || ''} onSet={onSet} rows={2} />
            </Field>
          </div>

          <div>
            <Preview it={it} />
          </div>
        </div>

        <details className="more" open={moreOpen}>
          <summary>자세히</summary>
          <div className="grid">
            <Field label="번호 대신 붙일 이름" hint="예: BONUS">
              <Text path={p + 'tag'} value={it.tag || ''} onSet={onSet} />
            </Field>
            <Field label="보기" hint="쉼표로 나눕니다">
              <Text path={p + 'opts'} value={(it.opts || []).join(', ')} onSet={onSet} />
            </Field>
            <Field label="역할 나누기" hint="쉼표로 나눕니다 · 예: 제목, 가수, 한 소절">
              <Text path={p + 'roles'} value={(it.roles || []).join(', ')} onSet={onSet} />
            </Field>
            <Field label="문제 전문" hint="정답과 같이 보여줄 원래 문제">
              <Area path={p + 'full'} value={it.full || ''} onSet={onSet} rows={3} />
            </Field>
            <Field label="표로 된 정답" hint={'한 줄에 "이름 = 뜻" 씩'}>
              <Area
                path={p + 'list'}
                value={(it.list || []).map(([k, v]) => k + ' = ' + v).join('\n')}
                onSet={onSet}
                rows={3}
              />
            </Field>
            <Field label="글자 크기 고정" hint="비워두면 알아서 맞춥니다">
              <select value={it.size || ''} onChange={(e) => onSet(p + 'size', e.target.value)}>
                <option value="">자동</option>
                <option value="md">조금 작게</option>
                <option value="sm">작게</option>
              </select>
            </Field>
            <Field label="앨범 사진 대신 쓸 글자" hint="사진이 없을 때">
              <Text path={p + 'artText'} value={it.artText || ''} onSet={onSet} />
            </Field>
          </div>
        </details>
      </div>
    </div>
  );
}
