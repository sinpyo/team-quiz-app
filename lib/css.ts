import type { CSSProperties } from 'react';

/** --accent 같은 사용자 정의 속성을 style 에 넣을 때 씁니다 */
export function vars(o: Record<string, string | number | undefined>): CSSProperties {
  return o as CSSProperties;
}
