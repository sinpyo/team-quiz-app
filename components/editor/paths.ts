/* 'rounds.3.q.2.g' 같은 길을 따라가 값을 넣습니다.
   원래 admin.html 이 쓰던 방식 그대로인데, React 라 원본을 고치지 않고
   새 것을 만들어 돌려줍니다. */

type Any = Record<string, unknown> | unknown[];

/** keepEmpty 이면 빈 글자도 그대로 둡니다 — 문제 블록은 비어 있어도 화면에 남아 있어야 해서입니다.
    빈 값은 저장할 때 서버(sanitizePack)가 걸러 냅니다 */
export function setPath<T>(root: T, path: string, val: unknown, keepEmpty = false): T {
  const parts = path.split('.');

  const walk = (node: unknown, i: number): unknown => {
    const key = parts[i];
    const isLast = i === parts.length - 1;
    const base: Any = Array.isArray(node)
      ? [...(node as unknown[])]
      : { ...((node as Record<string, unknown>) ?? {}) };
    const box = base as Record<string, unknown>;

    if (isLast) {
      if (val === undefined || (val === '' && !keepEmpty)) delete box[key];
      else box[key] = val;
      return base;
    }
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    const child = box[key] ?? (nextIsIndex ? [] : {});
    box[key] = walk(child, i + 1);
    return base;
  };

  return walk(root, 0) as T;
}

/** 유튜브 주소를 붙여 넣으면 11자 번호만 남깁니다 */
export function parseYt(raw: string): string {
  const m = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : raw.trim();
}
