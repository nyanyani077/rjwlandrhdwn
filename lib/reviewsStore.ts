import type { Review as ReviewRow } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deleteReviewImage } from "@/lib/reviewBlob";
import type { Review, ReviewSummary } from "@/lib/types/review";
import { isValidReviewRating, MAX_REVIEW_RATING, MIN_REVIEW_RATING } from "@/lib/reviewRating";

export type CreateReviewInput = {
  restaurantId: string;
  rating: number;
  text: string;
  authorName?: string;
  ownerToken?: string;
  imageUrl?: string;
};

export type UpdateReviewInput = {
  id: string;
  ownerToken: string;
  rating: number;
  text: string;
  authorName?: string;
  /** null이면 첨부 사진 삭제, undefined면 유지 */
  imageUrl?: string | null;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    restaurantId: row.restaurantId,
    rating: row.rating,
    text: row.text,
    authorName: row.authorName,
    imageUrl: row.imageUrl ?? undefined,
    ownerToken: row.ownerToken ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

function validateReviewContent(
  rating: number,
  text: string,
  authorName?: string
): { ok: true; authorName: string } | { ok: false; error: string } {
  if (!isValidReviewRating(rating)) {
    return {
      ok: false,
      error: `별점은 ${MIN_REVIEW_RATING}~${MAX_REVIEW_RATING}점, 0.5점 단위로 입력해 주세요.`,
    };
  }
  const trimmed = text?.trim() ?? "";
  if (trimmed.length < 2) {
    return { ok: false, error: "리뷰 내용을 2자 이상 입력해 주세요." };
  }
  if (trimmed.length > 2000) {
    return { ok: false, error: "리뷰는 2000자 이하로 작성해 주세요." };
  }
  return {
    ok: true,
    authorName: (authorName?.trim() || "익명").slice(0, 30),
  };
}

async function summaryForRestaurant(
  restaurantId: string
): Promise<ReviewSummary> {
  const agg = await prisma.review.aggregate({
    where: { restaurantId },
    _count: true,
    _avg: { rating: true },
  });
  const average = agg._avg.rating;
  return {
    count: agg._count,
    average:
      average != null ? Math.round(average * 10) / 10 : null,
  };
}

export async function getReviewsByRestaurant(
  restaurantId: string
): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toReview);
}

export async function getReviewSummaries(): Promise<
  Record<string, ReviewSummary>
> {
  const rows = await prisma.review.findMany({
    select: { restaurantId: true, rating: true },
  });

  const map = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const hit = map.get(r.restaurantId) ?? { sum: 0, count: 0 };
    hit.sum += r.rating;
    hit.count += 1;
    map.set(r.restaurantId, hit);
  }

  const out: Record<string, ReviewSummary> = {};
  for (const [restaurantId, { sum, count }] of map) {
    out[restaurantId] = {
      count,
      average: count > 0 ? Math.round((sum / count) * 10) / 10 : null,
    };
  }
  return out;
}

export async function createReview(
  input: CreateReviewInput
): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  const restaurantId = input.restaurantId?.trim();
  if (!restaurantId) {
    return { ok: false, error: "식당 정보가 없습니다." };
  }

  const rating = Number(input.rating);
  const validated = validateReviewContent(rating, input.text ?? "", input.authorName);
  if (!validated.ok) return validated;

  const ownerToken = input.ownerToken?.trim();
  if (!ownerToken) {
    return { ok: false, error: "리뷰 소유 정보가 없습니다. 페이지를 새로고침해 주세요." };
  }

  const imageUrl = input.imageUrl?.trim() || undefined;

  const row = await prisma.review.create({
    data: {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      restaurantId,
      rating,
      text: input.text.trim(),
      authorName: validated.authorName,
      ownerToken,
      imageUrl,
    },
  });

  return { ok: true, review: toReview(row) };
}

export async function deleteReview(
  id: string,
  ownerToken: string
): Promise<
  | { ok: true; restaurantId: string; summary: ReviewSummary }
  | { ok: false; error: string }
> {
  const token = ownerToken?.trim();
  if (!token) {
    return { ok: false, error: "삭제 권한이 없습니다." };
  }

  const target = await prisma.review.findUnique({ where: { id } });
  if (!target) {
    return { ok: false, error: "리뷰를 찾을 수 없습니다." };
  }

  if (target.ownerToken !== token) {
    return { ok: false, error: "본인이 작성한 리뷰만 삭제할 수 있습니다." };
  }

  const restaurantId = target.restaurantId;
  await deleteReviewImage(target.imageUrl);
  await prisma.review.delete({ where: { id } });

  return {
    ok: true,
    restaurantId,
    summary: await summaryForRestaurant(restaurantId),
  };
}

export async function updateReview(
  input: UpdateReviewInput
): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  const token = input.ownerToken?.trim();
  if (!token) {
    return { ok: false, error: "수정 권한이 없습니다." };
  }

  const validated = validateReviewContent(
    Number(input.rating),
    input.text ?? "",
    input.authorName
  );
  if (!validated.ok) return validated;

  const target = await prisma.review.findUnique({ where: { id: input.id } });
  if (!target) {
    return { ok: false, error: "리뷰를 찾을 수 없습니다." };
  }

  if (target.ownerToken !== token) {
    return { ok: false, error: "본인이 작성한 리뷰만 수정할 수 있습니다." };
  }

  const data: {
    rating: number;
    text: string;
    authorName: string;
    imageUrl?: string | null;
  } = {
    rating: Number(input.rating),
    text: input.text.trim(),
    authorName: validated.authorName,
  };

  if (input.imageUrl !== undefined) {
    const nextUrl = input.imageUrl?.trim() || null;
    if (nextUrl !== target.imageUrl && target.imageUrl) {
      await deleteReviewImage(target.imageUrl);
    }
    data.imageUrl = nextUrl;
  }

  const row = await prisma.review.update({
    where: { id: input.id },
    data,
  });

  return { ok: true, review: toReview(row) };
}
