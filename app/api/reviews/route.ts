import { NextRequest, NextResponse } from "next/server";
import {
  createReview,
  getReviewsByRestaurant,
  getReviewSummaries,
} from "@/lib/reviewsStore";

export async function GET(request: NextRequest) {
  const restaurantId = request.nextUrl.searchParams.get("restaurantId");

  if (restaurantId) {
    const reviews = await getReviewsByRestaurant(restaurantId);
    return NextResponse.json({ reviews });
  }

  const summaries = await getReviewSummaries();
  return NextResponse.json({ summaries });
}

export async function POST(request: NextRequest) {
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
    restaurantId?: string;
    rating?: number;
    text?: string;
    authorName?: string;
    ownerToken?: string;
  };

  const result = await createReview({
    restaurantId: input.restaurantId ?? "",
    rating: Number(input.rating),
    text: input.text ?? "",
    authorName: input.authorName,
    ownerToken: input.ownerToken,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ review: result.review }, { status: 201 });
}
