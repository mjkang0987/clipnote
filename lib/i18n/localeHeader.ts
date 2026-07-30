// 미들웨어 → 서버 컴포넌트로 로케일을 넘기는 요청 헤더 이름.
//
// 별도 파일인 이유: `middleware.ts` 는 Edge 런타임에서 돌고 서버 컴포넌트는 Node 런타임이다.
// 양쪽이 같은 상수를 봐야 하므로 의존이 가벼운 파일에 둔다(`server.ts` 는 `next/headers` 를
// 가져오는데, 미들웨어에서는 쓸 수 없다).

export const LOCALE_HEADER = "x-clipnote-locale";
