import type { LibraryRow } from '@/lib/library';
import { BUILTIN_TEMPLATES, packCounts } from '@/lib/templates';

interface Card {
  href: string;
  face: string;
  title: string;
  desc: string;
  rounds: number;
  questions: number;
  badge: string;
  own: boolean;
}

/** 홈 화면의 템플릿 목록. 기본 템플릿 뒤에 내가 만든 템플릿이 붙습니다 */
export function TemplateGrid({ mine }: { mine: LibraryRow[] }) {
  const cards: Card[] = [
    ...BUILTIN_TEMPLATES.map((t) => ({
      href: '/templates/' + t.slug,
      face: t.face,
      title: t.title,
      desc: t.desc,
      ...packCounts(t.pack),
      badge: '기본',
      own: false,
    })),
    ...mine.map((t) => ({
      href: '/templates/' + t.id,
      face: t.face || '📑',
      title: t.title,
      desc: t.lede || '',
      rounds: t.rounds,
      questions: t.questions,
      badge: t.mine ? '내 템플릿' : '같이 고침',
      own: true,
    })),
  ];

  return (
    <div className="tpl-grid">
      {cards.map((c) => (
        <a key={c.href} className={'tpl' + (c.own ? ' own' : '')} href={c.href}>
          <span className="face" aria-hidden="true">
            {c.face}
          </span>
          <b>{c.title}</b>
          {c.desc ? <span className="desc">{c.desc}</span> : null}
          <span className="meta">
            <em>{c.badge}</em>
            {c.rounds}라운드 · {c.questions}문제
          </span>
        </a>
      ))}
    </div>
  );
}
