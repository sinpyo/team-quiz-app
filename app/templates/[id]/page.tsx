import { notFound, redirect } from 'next/navigation';

import { PackOutline } from '@/components/PackOutline';
import { TemplateActions } from '@/components/TemplateActions';
import { currentUserId } from '@/lib/auth';
import { resolveTemplate } from '@/lib/library';
import { isUuid } from '@/lib/perm';
import { loginHref } from '@/lib/site';
import { packCounts } from '@/lib/templates';
import '../../ui.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

/* 템플릿 하나를 고르면 오는 곳 — 무엇이 들어 있는지 확인하고, 내 문제집으로 만듭니다.
   기본 템플릿은 로그인 없이도 볼 수 있고, 사람이 만든 템플릿은 고칠 수 있는 사람만 봅니다. */
export default async function TemplatePage({ params }: Props) {
  const { id } = await params;
  const me = await currentUserId();
  const t = await resolveTemplate(me, id);
  if (!t) {
    // 사람이 만든 템플릿인데 로그인을 안 했으면, 들어온 뒤에 다시 보여줍니다
    if (!me && isUuid(id)) redirect(loginHref('/templates/' + id));
    notFound();
  }

  const pack = t.source === 'builtin' ? t.builtin.pack : t.row.data;
  const title = t.source === 'builtin' ? t.builtin.title : t.row.title;
  const face = (t.source === 'builtin' ? t.builtin.face : pack.face) || '📑';
  const desc = t.source === 'builtin' ? t.builtin.desc : pack.lede || '';
  const badge = t.source === 'builtin' ? '기본 템플릿' : t.mine ? '내 템플릿' : '같이 고치는 템플릿';
  const playHref = t.source === 'builtin' ? `/templates/${id}/play` : '/play/' + t.row.viewToken;
  const { rounds, questions } = packCounts(pack);

  return (
    <main className="page">
      <div className="wrap">
        <div className="top">
          <a className="back" href="/">
            ← 처음으로
          </a>
        </div>

        <header className="tpl-head">
          <div className="face" aria-hidden="true">
            {face}
          </div>
          <div>
            <span className="chip">{badge}</span>
            <h1>{title}</h1>
            {desc ? <p>{desc}</p> : null}
            <p className="meta">
              라운드 {rounds}개 · 문제 {questions}개
            </p>
          </div>
        </header>

        <div className="row actions">
          <TemplateActions templateId={id} deletable={t.source === 'db' && t.mine} />
          <a className="btn" href={playHref} target="_blank" rel="noopener">
            ▶ 미리 진행해 보기
          </a>
          {t.source === 'db' ? (
            <a className="btn" href={'/edit/' + t.row.id}>
              ✏️ 템플릿 고치기
            </a>
          ) : null}
        </div>
        <p className="note" style={{ marginTop: '.6rem' }}>
          문제집을 만들면 이 템플릿을 그대로 복사합니다. 복사한 문제집을 고쳐도 템플릿은 바뀌지 않습니다.
        </p>

        <section className="sec">
          <div className="sec-head">
            <h2>들어 있는 것</h2>
            <p>라운드를 누르면 문제와 정답이 펼쳐집니다.</p>
          </div>
          <PackOutline pack={pack} />
        </section>
      </div>
    </main>
  );
}
