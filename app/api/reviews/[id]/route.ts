import { NextRequest, NextResponse } from "next/server";
import { deleteReview, updateReview } from "@/lib/reviewsStore";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const input = body as {
    ownerToken?: string;
    rating?: number;
    text?: string;
    authorName?: string;
  };

  const result = await updateReview({
    id,
    ownerToken: input.ownerToken ?? "",
    rating: Number(input.rating),
    text: input.text ?? "",
    authorName: input.authorName,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ review: result.review });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  let ownerToken = request.nextUrl.searchParams.get("ownerToken") ?? "";

  if (!ownerToken) {
    try {
      const body = (await request.json()) as { ownerToken?: string };
      ownerToken = body.ownerToken ?? "";
    } catch {
      /* query only */
    }
  }

  const result = await deleteReview(id, ownerToken);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    restaurantId: result.restaurantId,
    summary: result.summary,
  });
}
