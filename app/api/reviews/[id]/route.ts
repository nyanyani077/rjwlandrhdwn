import { NextRequest, NextResponse } from "next/server";
import { deleteReview, updateReview } from "@/lib/reviewsStore";
import {
  databaseErrorResponse,
  requireDatabase,
} from "@/lib/reviewApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

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

  try {
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
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const dbError = requireDatabase();
  if (dbError) return dbError;

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

  try {
    const result = await deleteReview(id, ownerToken);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      restaurantId: result.restaurantId,
      summary: result.summary,
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
