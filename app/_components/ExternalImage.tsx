"use client";

/**
 * 외부 호스트에서 오는 **장식용** 이미지 — 클립의 원본 대표 이미지.
 *
 * 세 자리가 같은 규칙을 쓴다: 홈 공유 카드 배경, 홈 미리보기 썸네일, 내 클립 목록 썸네일.
 * 규칙을 세 곳이 각자 들고 있으면 어긋난다 — 실제로 `d657e70` 에서 목록 썸네일만
 * `loading="lazy" decoding="async"` 를 받았고 홈 두 곳은 한참 뒤에 손으로 따라붙였다.
 *
 * - **`loading="lazy" decoding="async"`** — src 가 우리가 통제하지 못하는 호스트다. 즉시·동기로
 *   물리면 느리거나 hotlink 를 막는 원본 하나가 `window.load` 를 붙들고, 거기 묶인
 *   애드센스(`lazyOnload`)까지 밀린다. 목록은 최대 200개라 동시 요청도 문제가 된다.
 * - **`onError` 에 숨기기** — og:image 선언만 있고 실제로는 404 인 경우가 흔하다. 숨기면 뒤에
 *   깔린 그라디언트가 그대로 보여 깨진 이미지 아이콘이 뜨지 않는다.
 * - **`alt="" aria-hidden`** — 장식이다. 제목은 옆에 텍스트로 이미 있다.
 *
 * `next/image` 를 쓰지 않는 이유: `/api/image` 가 `force-dynamic` 이라 최적화를 앞에 두면
 * 우리 동적 라우트를 한 번 더 타게 되고, 목록 쪽은 임의 호스트라 `remotePatterns` 를 못 정한다.
 */
export default function ExternalImage({
  src,
  className,
}: {
  src: string;
  /** 자리마다 다른 건 크기·배치뿐이라 className 만 받는다. */
  className: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
