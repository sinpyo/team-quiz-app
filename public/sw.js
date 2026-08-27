/* 모임 자리에서 인터넷이 끊겨도 퀴즈가 돌아가게 합니다.

   한 번 연 퀴즈 화면과 그 화면이 쓰는 파일들을 받아 뒀다가,
   다음에 서버에 못 닿으면 받아둔 것으로 보여줍니다.
   늘 서버부터 먼저 물어보므로, 문제를 고쳤으면 바로 반영됩니다. */

const BOX = 'quiz-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== BOX).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

const keep = (req, res) => {
  if (res && res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches.open(BOX).then((box) => box.put(req, copy)).catch(() => {});
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // 그림과 프로그램 파일 — 받아둔 게 있으면 그냥 씁니다 (주소에 판 번호가 붙어 있습니다)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/art/')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => keep(req, res))),
    );
    return;
  }

  // 퀴즈 화면 — 서버부터 물어보고, 안 되면 받아둔 것
  if (url.pathname === '/play/demo' || url.pathname.startsWith('/play/')) {
    e.respondWith(
      fetch(req)
        .then((res) => keep(req, res))
        .catch(() => caches.match(req).then((hit) => hit || Response.error())),
    );
  }
});
