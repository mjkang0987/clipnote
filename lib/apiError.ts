// API 라우트의 예기치 못한 실패를 처리하는 한 곳.
//
// **왜 원인을 클라이언트에 보내지 않는가** — Postgres 는 `details` 에 실패한 행의 내용을
// 담는다(`Failing row contains (…, <url>, <title>, …)`, plan.md 18장). 그대로 내보내면
// 다른 사용자의 데이터가 응답에 실릴 수 있다. 원인은 로그에만 남긴다.
//
// **왜 그래도 본문을 주는가** — 안 주면 클라이언트가 상태코드밖에 못 보여준다.
// iOS 는 `decoded?.error ?? "clip \(statusCode)"`(`APIClient.swift:44`) 라, 본문이 있으면
// 그 문구를 그대로 띄우고 없으면 `clip 500` 을 띄운다. 18장 진단이 오래 걸린 이유가 이것이다.

import { NextResponse } from "next/server";

/** 사용자에게 보이는 문구. 원인은 서버 로그에 있다. */
const MESSAGE = "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";

/**
 * 예기치 못한 에러를 로그에 남기고 500 응답을 만든다.
 *
 * `console.error` 에 객체를 통째로 넘긴다 — `withErrorDetail`(`lib/store-supabase.ts`)이
 * 원본 PostgREST 에러를 `cause` 로 매달아 두므로 `code`·`details`·`hint` 가 함께 찍힌다.
 */
export function serverError(context: string, error: unknown): NextResponse {
  console.error(`${context} 실패:`, error);
  return NextResponse.json({ error: MESSAGE }, { status: 500 });
}
