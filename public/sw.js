// ClipNote 최소 서비스워커.
// PWA 설치 조건(등록된 SW + fetch 핸들러)을 충족하기 위한 용도.
// 오프라인 캐싱은 후순위 — 지금은 네트워크로 그대로 통과시킨다.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // 별도 처리 없이 네트워크 기본 동작에 맡긴다(핸들러 존재가 설치 조건).
});
