import { PreviewStage } from '@/components/deck/PreviewStage';
import '../globals.css';

export const metadata = { title: '미리보기', robots: { index: false } };

/** 문제 고치기 화면이 iframe 으로 띄우는 한 장짜리 미리보기 */
export default function PreviewPage() {
  return <PreviewStage />;
}
