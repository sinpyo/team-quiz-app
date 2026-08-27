import Link from 'next/link';

/* 임시 첫 화면입니다. 3단계에서 '내 문제집 목록'으로 바뀝니다 */
export default function Home() {
  return (
    <main style={{ padding: '3rem 1.5rem', maxWidth: '38rem', margin: '0 auto', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '2rem', letterSpacing: '-.03em' }}>단체 게임 퀴즈</h1>
      <p style={{ color: 'var(--mute)' }}>
        친구들끼리 모여서 하는 팀 대항 퀴즈입니다. 화면에 띄워놓고 키보드로 넘기면 됩니다.
      </p>
      <p>
        <Link href="/play/demo" style={{ color: 'var(--accent)', fontWeight: 700 }}>
          → 기본 문제집으로 바로 시작
        </Link>
      </p>
    </main>
  );
}
