import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";

export function databaseNotConfiguredResponse() {
  return NextResponse.json(
    {
      error:
        "리뷰 DB가 연결되지 않았습니다. Vercel 환경 변수에 DATABASE_URL을 설정해 주세요.",
    },
    { status: 503 }
  );
}

export function databaseErrorResponse(error: unknown) {
  console.error("[reviews] database error:", error);
  return NextResponse.json(
    { error: "리뷰를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
    { status: 500 }
  );
}

export function requireDatabase() {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }
  return null;
}
