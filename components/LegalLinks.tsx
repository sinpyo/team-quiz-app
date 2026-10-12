/** 첫 화면 아래 작은 링크 — 구글 로그인 동의 화면도 이 두 페이지를 가리킵니다 */
export function LegalLinks() {
  return (
    <p className="legal">
      <a href="/privacy">개인정보처리방침</a> · <a href="/terms">서비스 약관</a>
    </p>
  );
}
