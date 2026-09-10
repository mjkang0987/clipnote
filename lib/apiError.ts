// API 라우트의 실패를 처리하는 한 곳.
//
// **쓰는 곳** — `{ error: … }` JSON 을 돌려주는 라우트 중 throw 할 수 있는 것을 부르는 핸들러.
// (이미지·OG 라우트는 JSON 이 아니라 대상이 아니고, `/api/metadata` 는 `fetchMetadata` 가
//  절대 throw 하지 않고 `blank()` 를 돌려주도록 돼 있다.)
//
// **왜 원인을 클라이언트에 보내지 않는가** — Postgres 는 `details` 에 실패한 행의 내용을
// 담는다(`Failing row contains (…, <url>, <title>, …)`, plan.md 18장). 그대로 내보내면
// 다른 사용자의 데이터가 응답에 실릴 수 있다. 원인은 로그에만 남긴다.
//
// **왜 그래도 본문을 주는가** — 안 주면 클라이언트가 상태코드밖에 못 보여준다.
// iOS 는 `decoded?.error ?? "clip \(statusCode)"`(`APIClient.swift:44`) 라, 본문이 있으면
// 그 문구를 그대로 띄우고 없으면 `clip 500` 을 띄운다. 18장 진단이 오래 걸린 이유가 이것이다.

import { NextResponse } from "next/server";

/**
 * 예기치 못한 에러를 로그에 남기고 500 응답을 만든다.
 *
 * **`cause` 를 따로 펼치지 않는다.** `withErrorDetail`(`lib/store-supabase.ts`)이
 * `code`·`details`·`hint` 를 이미 `message` 에 넣고 원본을 `cause` 로도 매달아 두므로,
 * 객체를 통째로 넘기면 실패한 행이 한 줄에 **두 번** 찍힌다. 로그 한 줄이 길어지면
 * 플랫폼이 뒤를 자르는데, 하필 잘려 나가는 쪽이 `cause` 다.
 */
export function serverError(
  context: string,
  error: unknown,
  message = "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
): NextResponse {
  console.error(
    `${context} 실패:`,
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * 핸들러를 감싸 예기치 못한 throw 를 500 + 본문으로 바꾼다.
 *
 * 라우트마다 try/catch 를 손으로 두르면 본문이 통째로 한 칸 들어가 diff 가 실제 변경을
 * 덮고, 로그에 적을 경로도 손으로 적게 돼 폴더 이름이 바뀌면 어긋난다. 여기서는
 * 요청에서 직접 읽으므로 어긋날 수 없다.
 *
 *   export const POST = withErrors(async (request: Request) => { … });
 */
export function withErrors<A extends [Request, ...unknown[]]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const request = args[0];
    try {
      return await handler(...args);
    } catch (error) {
      const path = new URL(request.url).pathname;
      return serverError(`${request.method} ${path}`, error);
    }
  };
}

/**
 * 요청 본문을 객체로 읽는다. 아니면 400 응답을 돌려준다.
 *
 * `null` 과 배열도 JSON 으로는 유효하다 — 그대로 두면 필드 접근에서 TypeError 가 나고,
 * 클라이언트 잘못인데 서버 오류(500)로 기록된다.
 *
 *   const body = await readJsonObject(request);
 *   if (body instanceof NextResponse) return body;
 */
export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | NextResponse> {
  const parsed: unknown = await request.json().catch(() => null);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  return parsed as Record<string, unknown>;
}
