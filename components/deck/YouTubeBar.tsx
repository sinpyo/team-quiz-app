'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

/* 노래 재생 막대.
   유튜브 재생기는 React 밖에서 도는 물건이라 여기 한 군데에 가둬 둡니다.
   재생 시간이 흘러도 슬라이드 150장이 다시 그려지지 않게 하려는 것입니다. */

interface Player {
  loadVideoById(o: { videoId: string; startSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => Player;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** 재생기 불러오기는 페이지에 한 번뿐입니다 (개발 모드에서 두 번 실행돼도 안전) */
let apiPromise: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
      else reject(new Error('재생기를 불러오지 못했습니다'));
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => reject(new Error('재생기를 불러오지 못했습니다'));
    document.head.appendChild(tag);
    setTimeout(() => reject(new Error('재생기를 불러오지 못했습니다')), 8000);
  });
  return apiPromise;
}

const clock = (t: number) => {
  const s = Math.max(0, Math.floor(t || 0));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

export function parseYouTube(v: string): string | null {
  const t = String(v).trim();
  const m = t.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(t) ? t : null;
}

export type YouTubeAction = 'toggle' | 'restart' | 'back' | 'fwd' | 'link';

export interface YouTubeHandle {
  act: (what: YouTubeAction) => void;
  pause: () => void;
}

interface Props {
  /** 지금 화면의 유튜브 번호. 없으면 막대가 사라집니다 */
  videoId: string | null;
  /** 이 곡을 가리키는 이름표 — 곡이 바뀌었는지 가릅니다 */
  songKey: string | null;
  /** 이 곡의 링크를 바꿨을 때 */
  onRelink: (songKey: string, videoId: string) => void;
  onToast: (msg: string) => void;
  ref?: React.Ref<YouTubeHandle>;
}

export function YouTubeBar({ videoId, songKey, onRelink, onToast, ref }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const loadedKey = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [dead, setDead] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);

  /* 유튜브가 재생을 거절했을 때, 왜 그런지 나눠서 알려줍니다 */
  const onError = useCallback(
    (code: number) => {
      // 153 은 '어디서 왔는지 모르겠다' 는 뜻입니다
      if (code === 153) {
        setBlocked(true);
        onToast('여기서는 바로 못 틉니다. ▶ 유튜브에서 열기 로 여세요');
      } else if (code === 101 || code === 150) {
        onToast('이 영상은 바깥에서 트는 게 막혀 있습니다. 🔗 로 다른 링크를 넣어주세요');
      } else if (code === 100) {
        onToast('이 영상이 사라졌습니다. 🔗 로 다른 링크를 넣어주세요');
      } else {
        onToast('재생하지 못했습니다. 🔗 로 링크를 바꿔보세요');
      }
    },
    [onToast],
  );

  useEffect(() => {
    let alive = true;
    loadApi()
      .then((YT) => {
        if (!alive || playerRef.current || !hostRef.current) return;
        // 재생기가 이 칸을 iframe 으로 갈아치우므로, React 가 건드리지 않는
        // 빈 칸을 하나 새로 만들어서 내줍니다
        const mount = document.createElement('div');
        hostRef.current.appendChild(mount);
        playerRef.current = new YT.Player(mount, {
          width: '2',
          height: '2',
          playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1 },
          events: {
            onReady: () => alive && setReady(true),
            onStateChange: () => {
              if (!alive) return;
              try {
                setPlaying(playerRef.current?.getPlayerState() === 1);
              } catch {
                setPlaying(false);
              }
            },
            onError: (e: { data?: number }) => alive && onError(e?.data ?? 0),
          },
        });
      })
      .catch(() => {
        if (alive) setDead(true);
      });
    return () => {
      alive = false;
    };
    // 재생기는 페이지가 사는 동안 한 번만 만듭니다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 재생 중일 때만 시계를 돌립니다 */
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      try {
        setAt(playerRef.current?.getCurrentTime() ?? 0);
      } catch {
        /* 무시 */
      }
    }, 400);
    return () => clearInterval(t);
  }, [playing]);

  const act = useCallback(
    (what: YouTubeAction) => {
      if (!videoId || !songKey) return;

      if (what === 'link') {
        const v = window.prompt('이 곡의 유튜브 주소를 넣으세요', 'https://www.youtube.com/watch?v=' + videoId);
        if (v === null) return;
        const nid = parseYouTube(v);
        if (!nid) {
          onToast('주소를 알아볼 수 없습니다');
          return;
        }
        onRelink(songKey, nid);
        loadedKey.current = null;
        setBlocked(false);
        onToast('링크를 바꿨습니다');
        return;
      }

      const p = playerRef.current;
      if (!ready || !p) {
        onToast('재생기를 아직 불러오는 중입니다');
        return;
      }

      try {
        if (loadedKey.current !== songKey) {
          // 이 곡을 처음 트는 경우
          p.loadVideoById({ videoId, startSeconds: 0 });
          loadedKey.current = songKey;
          setAt(0);
        } else if (what === 'toggle') {
          if (p.getPlayerState() === 1) p.pauseVideo();
          else p.playVideo();
        } else if (what === 'restart') {
          p.seekTo(0, true);
          p.playVideo();
        } else if (what === 'back') {
          p.seekTo(Math.max(0, p.getCurrentTime() - 5), true);
          setAt(Math.max(0, p.getCurrentTime() - 5));
        } else if (what === 'fwd') {
          p.seekTo(p.getCurrentTime() + 5, true);
          setAt(p.getCurrentTime() + 5);
        }
      } catch {
        onToast('재생하지 못했습니다. 🔗 로 링크를 바꿔보세요');
      }
    },
    [videoId, songKey, ready, onRelink, onToast],
  );

  const pause = useCallback(() => {
    try {
      playerRef.current?.pauseVideo();
    } catch {
      /* 무시 */
    }
  }, []);

  useImperativeHandle(ref, () => ({ act, pause }), [act, pause]);

  /* 노래가 있는 화면에서만 아래 막대가 두꺼워집니다 */
  useEffect(() => {
    document.body.classList.toggle('yt-on', !!videoId);
    return () => document.body.classList.remove('yt-on');
  }, [videoId]);

  const here = songKey !== null && loadedKey.current === songKey;

  return (
    <>
      <div id="yt">
        {!videoId ? null : dead || blocked ? (
          <>
            {/* 여기서 바로 못 트는 경우에는 유튜브를 새 탭으로 여는 단추를 대신 내줍니다 */}
            <a
              className="play"
              href={'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId)}
              target="_blank"
              rel="noopener"
            >
              ▶ 유튜브에서 열기
            </a>
            <span className="warn">여기서 바로 트는 게 막혀서, 새 탭으로 엽니다</span>
            <button type="button" className="quiet" title="이 곡의 유튜브 링크 바꾸기" onClick={() => act('link')}>
              🔗
            </button>
          </>
        ) : (
          <>
            <button type="button" className="play" onClick={() => act('toggle')}>
              {playing ? '⏸ 일시정지' : '▶ 전주 재생'}
            </button>
            <button type="button" onClick={() => act('restart')}>
              ⏮ 처음부터
            </button>
            <button type="button" onClick={() => act('back')}>
              −5초
            </button>
            <button type="button" onClick={() => act('fwd')}>
              +5초
            </button>
            <span className="t">{clock(here ? at : 0)}</span>
            <button type="button" className="quiet" title="이 곡의 유튜브 링크 바꾸기" onClick={() => act('link')}>
              🔗
            </button>
          </>
        )}
      </div>
      <div id="yt-host" aria-hidden="true" ref={hostRef} />
    </>
  );
}
