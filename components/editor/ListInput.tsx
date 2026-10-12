'use client';

/* 여러 칸짜리 입력 — 보기 · 역할(글자 여러 개), 표로 된 정답(이름 = 뜻 여러 줄) */

interface StringsProps {
  value: string[];
  addLabel: string;
  placeholder?: (i: number) => string;
  onType: (next: string[]) => void;
  /** 칸을 넣고 빼는 것은 되돌리기에 한 번씩 담습니다 */
  onShape: (next: string[]) => void;
}

export function StringsInput({ value, addLabel, placeholder, onType, onShape }: StringsProps) {
  return (
    <div className="list-in">
      {value.map((v, i) => (
        <div className="li" key={i}>
          <input
            type="text"
            value={v}
            placeholder={placeholder?.(i)}
            onChange={(e) => onType(value.map((x, k) => (k === i ? e.target.value : x)))}
          />
          <button
            type="button"
            className="x"
            aria-label="이 칸 빼기"
            onClick={() => onShape(value.filter((_, k) => k !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="add-row" onClick={() => onShape([...value, ''])}>
        + {addLabel}
      </button>
    </div>
  );
}

interface PairsProps {
  value: [string, string][];
  onType: (next: [string, string][]) => void;
  onShape: (next: [string, string][]) => void;
}

export function PairsInput({ value, onType, onShape }: PairsProps) {
  const put = (i: number, side: 0 | 1, v: string) =>
    onType(value.map((row, k) => (k === i ? ((side === 0 ? [v, row[1]] : [row[0], v]) as [string, string]) : row)));
  return (
    <div className="list-in">
      {value.map(([k, v], i) => (
        <div className="li pair" key={i}>
          <input type="text" className="k" value={k} placeholder="이름" onChange={(e) => put(i, 0, e.target.value)} />
          <input type="text" value={v} placeholder="내용" onChange={(e) => put(i, 1, e.target.value)} />
          <button
            type="button"
            className="x"
            aria-label="이 줄 빼기"
            onClick={() => onShape(value.filter((_, n) => n !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="add-row" onClick={() => onShape([...value, ['', '']])}>
        + 줄 추가
      </button>
    </div>
  );
}
