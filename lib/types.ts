/* 문제집의 모양. team-quiz 의 pack.js 구조를 그대로 옮긴 것이라,
   예전에 내보낸 .json 파일도 그대로 불러올 수 있습니다. */

/** 큰 글자의 종류 — 초성 · 이모티콘 · 기호(글자) */
export type Glyph = 'cho' | 'emoji' | 'sym';

export interface Question {
  /** 점수가 엉뚱한 문제에 붙지 않게 하는 이름표. 한 번 정하면 안 바꿉니다 */
  id?: string;
  k?: Glyph;
  /** 화면 가운데 크게 뜨는 글자 */
  g?: string;
  /** 글자 크기를 손으로 키울 때만 */
  size?: string;
  /** 번호 대신 붙일 이름 (BONUS 등) */
  tag?: string;
  /** 문제 문장 */
  q?: string;
  /** 안내 한 줄 */
  s?: string;
  /** 보기 */
  opts?: string[];
  /** 역할 나누기 */
  roles?: string[];
  /** 유튜브 번호 11자 */
  yt?: string;
  /** 앨범 사진 경로 */
  art?: string;
  /** 사진 대신 쓸 글자 */
  artText?: string;
  /** 정답 */
  a?: string;
  /** 덧붙임 */
  note?: string;
  /** 문제 전문 */
  full?: string;
  /** 표로 된 정답 — [이름, 값] 짝 */
  list?: [string, string][];
}

export interface Round {
  id?: string;
  /** 라운드 이름 */
  t: string;
  /** 라운드 색 */
  c: string;
  tag?: string;
  /** 하는 방법 */
  how?: string;
  /** 벌칙 */
  pen?: string;
  q?: Question[];
}

export interface Cheer {
  kicker?: string;
  head?: string;
  foot?: string;
}

export interface StopStep {
  text: string;
  /** 굵게 강조할 줄 */
  hot?: boolean;
}

export interface Stop {
  kicker?: string;
  head?: string;
  sub?: string;
  steps?: StopStep[];
}

export interface FinaleCard {
  face?: string;
  name?: string;
  desc?: string;
}

export interface Finale {
  kicker?: string;
  head?: string;
  foot?: string;
  cards?: FinaleCard[];
}

export interface Pack {
  ver?: number;
  title?: string;
  kicker?: string;
  lede?: string;
  face?: string;
  cheer?: Cheer;
  stop?: Stop;
  finale?: Finale;
  rounds: Round[];
}

/** 화면에 그려지는 팀 */
export interface Team {
  id: string;
  name: string;
}

/** 문제마다 어느 팀이 이겼는지 — 열쇠는 문제의 id */
export type Scores = Record<string, string>;
