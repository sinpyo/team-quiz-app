import { Deck } from '@/components/deck/Deck';
import { defaultPack } from '@/lib/defaultPack';

export const metadata = { title: '단체 게임 퀴즈' };

/** 기본 문제집으로 바로 진행합니다. 로그인도, 저장도 없습니다 */
export default function DemoPage() {
  return <Deck pack={defaultPack} />;
}
