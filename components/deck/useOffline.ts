'use client';

import { useEffect } from 'react';

/* 퀴즈 화면을 열면 그 화면과 그 화면이 쓰는 파일들을 브라우저에 받아 둡니다.
   모임 자리에서 인터넷이 끊겨도 같은 링크로 진행할 수 있게 하려는 것입니다.

   처음 여는 순간에는 받아두는 일꾼이 아직 일을 시작하기 전이라 아무것도 안 담깁니다.
   그래서 일꾼이 자리를 잡으면, 지금 화면이 쓴 파일 목록을 훑어서 한 번씩 더 부릅니다. */
export function useOffline() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    // 파일로 열었거나 https 가 아니면 브라우저가 막습니다
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    let alive = true;

    const warm = async () => {
      const mine = performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .filter((u) => u.startsWith(location.origin) && (u.includes('/_next/static/') || u.includes('/art/')));
      const list = [location.href, ...new Set(mine)];
      for (const u of list) {
        if (!alive) return;
        try {
          await fetch(u, { credentials: 'same-origin' });
        } catch {
          /* 하나쯤 못 받아도 넘어갑니다 */
        }
      }
    };

    const ready = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      } catch {
        return; // 안 되면 그냥 평소대로 씁니다
      }
      // 일꾼이 이 화면을 맡을 때까지 기다립니다
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((res) => {
          const on = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', on);
            res();
          };
          navigator.serviceWorker.addEventListener('controllerchange', on);
          setTimeout(on, 4000);
        });
      }
      if (alive && navigator.serviceWorker.controller) await warm();
    };

    // 화면이 다 그려진 뒤에 조용히 받아 둡니다
    const t = setTimeout(() => void ready(), 1200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);
}
