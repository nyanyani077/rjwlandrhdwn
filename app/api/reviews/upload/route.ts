import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireDatabase } from "@/lib/reviewApi";
import { REVIEW_IMAGE_MAX_BYTES } from "@/lib/reviewImage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function blobToken(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!raw) return undefined;
  return raw.replace(/^["']|["']$/g, "");
}

export async function POST(request: Request): Promise<NextResponse> {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  const onVercel = process.env.VERCEL === "1";
  const token = blobToken();
  if (!onVercel && !token) {
    return NextResponse.json(
      {
        error:
          "사진 업로드가 설정되지 않았습니다. BLOB_READ_WRITE_TOKEN 환경 변수를 확인해 주세요.",
      },
      { status: 503 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      ...(token ? { token } : {}),
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: REVIEW_IMAGE_MAX_BYTES,
        addRandomSuffix: true,
      }),
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[reviews] upload failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "사진 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
