/* 문제 고치기 화면의 미리보기가 어느 장을 보여줄지.
   편집기(장 번호 · '이 장부터 진행')와 미리보기 창(그릴 장)이 같은 답을 내도록 한 군데에 둡니다. */

import type { Built } from './buildSlides';
import type { Pack } from './types';

export type PreviewTarget =
  | { type: 'cover' | 'cheer' | 'stop' | 'finale' }
  | { type: 'round'; ri: number }
  | { type: 'q'; ri: number; qid: string };

/** 그 장이 퀴즈의 몇 번째 화면인지. 문제집에서 비워 둬서 안 나오는 장이면 -1 */
export function findSlide(built: Built, t: PreviewTarget): number {
  const { slides } = built;
  switch (t.type) {
    case 'round':
      return slides.findIndex((s) => s.type === 'round' && s.round === t.ri + 1);
    case 'q':
      return slides.findIndex((s) => s.type === 'q' && s.round === t.ri + 1 && s.item.id === t.qid);
    default:
      return slides.findIndex((s) => s.type === t.type);
  }
}

/** 미리보기 창에 보내는 쪽지 */
export interface PreviewMessage {
  type: 'preview';
  pack: Pack;
  target: PreviewTarget;
  reveal: boolean;
}
