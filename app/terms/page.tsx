import '../ui.css';

export const metadata = { title: '서비스 약관 · 단체 게임 퀴즈' };

export default function TermsPage() {
  return (
    <main className="page">
      <div className="wrap narrow doc">
        <div className="top">
          <a className="back" href="/">
            ← 처음으로
          </a>
        </div>
        <h1>서비스 약관</h1>
        <p className="meta">시행일 2026년 10월 12일</p>

        <h2>무엇인가요</h2>
        <p>
          단체 게임 퀴즈는 모임에서 팀 대항 퀴즈를 진행하도록 돕는 무료 서비스입니다. 돈을 받지 않고, 있는 그대로
          제공합니다.
        </p>

        <h2>만든 문제</h2>
        <p>
          직접 만든 문제집과 템플릿은 만든 사람의 것이고, 그 내용에 대한 책임도 만든 사람에게 있습니다. 남의 권리를
          침해하거나 남을 해치는 내용은 올리지 말아 주세요. 그런 내용은 알리지 않고 지울 수 있습니다.
        </p>

        <h2>바뀌거나 멈출 수 있음</h2>
        <p>
          서비스는 예고 없이 바뀌거나 멈출 수 있습니다. 중요한 문제집은 문제 고치기 화면의 ⋯ 메뉴에서 파일로
          내보내 따로 보관해 주세요.
        </p>

        <h2>책임의 한계</h2>
        <p>서비스를 쓰다가 생긴 손해에 대해 법이 허용하는 한도 안에서 책임지지 않습니다.</p>

        <h2>문의</h2>
        <p>
          <a href="mailto:ksp6061@gmail.com">ksp6061@gmail.com</a> · <a href="/privacy">개인정보처리방침</a>
        </p>
      </div>
    </main>
  );
}
