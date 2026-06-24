"use client";

import { useEffect } from "react";

// 서비스워커(/sw.js) 등록 — PWA 설치 가능 상태로 만든다.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 등록 실패는 조용히 무시(설치형만 영향, 일반 사용엔 무관)
      });
    }
  }, []);
  return null;
}
