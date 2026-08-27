/* 브라우저에만 저장하는 값들.
   팀 이름·점수·바꾼 유튜브 링크는 진행 중에만 쓰는 값이라 서버에 올리지 않습니다.
   인터넷이 끊겨도 퀴즈가 돌아가야 하기 때문입니다. */

export const LS = {
  teams: 'quiz-teams',
  scores: 'quiz-scores',
  yt: 'quiz-yt',
  /** 한 번 연 문제집을 받아 둡니다 — 서버가 안 될 때 이걸로 진행합니다 */
  cache: 'quiz-cache',
} as const;

export function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const v = JSON.parse(raw) as T;
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 공간이 없어도 진행에는 지장이 없으므로 조용히 넘어갑니다 */
  }
}

export function drop(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* 무시 */
  }
}
