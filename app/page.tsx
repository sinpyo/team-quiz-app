import { GoogleButton } from '@/components/GoogleButton';
import { PackList } from '@/components/PackList';
import { TemplateGrid } from '@/components/TemplateGrid';
import { currentUser } from '@/lib/auth';
import { myLibrary } from '@/lib/library';
import { fakeLoginOn, googleReady } from '@/lib/site';
import './ui.css';

export const dynamic = 'force-dynamic';

const REASON: Record<string, string> = {
  cancelled: '로그인을 취소하셨습니다.',
  'google-not-set': '구글 로그인이 아직 준비되지 않았습니다.',
  'bad-state': '로그인이 올바르게 이어지지 않았습니다. 다시 해주세요.',
  'token-failed': '구글과 이야기하지 못했습니다. 다시 해주세요.',
  'bad-token': '구글에서 받은 정보를 확인하지 못했습니다. 다시 해주세요.',
  'no-code': '로그인이 끝나지 않았습니다. 다시 해주세요.',
  'login-failed': '로그인하지 못했습니다. 다시 해주세요.',
};

export default async function Home({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const me = await currentUser();

  if (!me) {
    return (
      <main className="page">
        <div className="wrap narrow">
          <div className="hero">
            <div className="face">🎲</div>
            <h1>단체 게임 퀴즈</h1>
            <p>
              친구들끼리 모여서 하는 팀 대항 퀴즈입니다. 화면에 띄워놓고 키보드로 넘기면 됩니다.
              템플릿을 골라 내 문제집을 만들고, 원하는 대로 고쳐 쓰세요.
            </p>
            {err && REASON[err] ? <p className="warn">{REASON[err]}</p> : null}
            <div className="row">
              {googleReady() ? <GoogleButton /> : null}
              <a className="btn" href="/play/demo">
                ▶ 로그인 없이 해보기
              </a>
              {fakeLoginOn() ? (
                <a className="btn quiet" href="/api/auth/dev?who=나">
                  (개발용) 그냥 들어가기
                </a>
              ) : null}
            </div>
            <p className="note">
              로그인하면 내 문제집을 만들어 자유롭게 고칠 수 있습니다. 링크로 나눠줘도
              <b> 받은 사람은 못 고치고</b>, 고칠 사람만 따로 초대할 수 있습니다.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const all = await myLibrary(me.id);
  const templates = all.filter((r) => r.kind === 'template');
  const packs = all.filter((r) => r.kind === 'pack');

  return (
    <main className="page">
      <div className="wrap">
        <div className="top">
          <h1>{me.name} 님, 무엇을 할까요?</h1>
          <div className="row who">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {me.avatarUrl ? <img src={me.avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="btn quiet sm">
                나가기
              </button>
            </form>
          </div>
        </div>

        <section className="sec">
          <div className="sec-head">
            <h2>템플릿으로 시작하기</h2>
            <p>골라서 내용을 확인하고, 마음에 들면 내 문제집으로 만들어 고치세요.</p>
          </div>
          <TemplateGrid mine={templates} />
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2>내 문제집</h2>
            <p>진행할 때 쓰는 문제집입니다. 잘 만든 문제집은 템플릿으로 저장해 두면 다음 모임에 다시 꺼내 쓸 수 있습니다.</p>
          </div>
          <PackList packs={packs} />
        </section>

        <p className="note">
          {me.email ? <>{me.email} 로 들어와 있습니다 · </> : null}
          <a className="back" href="/play/demo">
            기본 문제집으로 그냥 해보기
          </a>
        </p>
      </div>
    </main>
  );
}
