import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireDatabase } from "@/lib/reviewApi";
import {
  reviewImageExtension,
  validateReviewImage,
} from "@/lib/reviewImage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      {
        error:
          "사진 업로드가 설정되지 않았습니다. BLOB_READ_WRITE_TOKEN 환경 변수를 확인해 주세요.",
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const entry = formData.get("file");
  if (!(entry instanceof File)) {
    return NextResponse.json(
      { error: "사진 파일을 선택해 주세요." },
      { status: 400 }
    );
  }

  const validated = validateReviewImage(entry.size, entry.type);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const ext = reviewImageExtension(entry.type);
    const pathname = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const blob = await put(pathname, entry, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ imageUrl: blob.url });
  } catch (error) {
    console.error("[reviews] upload failed:", error);
    return NextResponse.json(
      { error: "사진 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
