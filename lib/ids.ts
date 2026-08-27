/* 링크에 들어가는 값들. 짐작으로 맞힐 수 없어야 하므로 무작위로 만듭니다. */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomToken(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** 보기 링크에 들어갑니다 — 이 값을 아는 사람만 그 문제집을 볼 수 있습니다 */
export const newViewToken = () => randomToken(22);

/** 편집 초대 링크에 들어갑니다 */
export const newInviteToken = () => randomToken(28);

/** 새 문제·라운드에 붙일 이름표 */
export const newItemId = () => 'q' + Date.now().toString(36) + randomToken(4).toLowerCase();
