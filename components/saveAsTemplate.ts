/** 템플릿으로 저장 — 문제집 목록과 문제 고치기 화면이 같이 씁니다.
    지금 문제집은 그대로 두고, 같은 내용의 템플릿을 하나 새로 만듭니다 */
export async function saveAsTemplate(packId: string, title: string): Promise<{ id?: string; error?: string }> {
  const name = window.prompt('템플릿 이름을 정해 주세요. 지금 문제집은 그대로 남습니다.', title);
  if (name === null) return {};
  const res = await fetch('/api/packs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ from: { pack: packId }, kind: 'template', title: name.trim() || title }),
  });
  const out = (await res.json()) as { id?: string; error?: string };
  if (!res.ok || !out.id) return { error: out.error || '템플릿으로 저장하지 못했습니다' };
  return { id: out.id };
}
