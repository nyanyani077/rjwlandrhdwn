import fs from "node:fs/promises";
import path from "node:path";
import type { Review, ReviewSummary } from "@/lib/types/review";
import { isValidReviewRating, MAX_REVIEW_RATING, MIN_REVIEW_RATING } from "@/lib/reviewRating";

const REVIEWS_PATH = path.join(process.cwd(), "data", "reviews.json");

export type CreateReviewInput = {
  restaurantId: string;
  rating: number;
  text: string;
  authorName?: string;
  ownerToken?: string;
};

export type UpdateReviewInput = {
  id: string;
  ownerToken: string;
  rating: number;
  text: string;
  authorName?: string;
};

async function readAll(): Promise<Review[]> {
  try {
    const raw = await fs.readFile(REVIEWS_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReviewShape);
  } catch {
    return [];
  }
}

async function writeAll(reviews: Review[]): Promise<void> {
  await fs.mkdir(path.dirname(REVIEWS_PATH), { recursive: true });
  await fs.writeFile(REVIEWS_PATH, JSON.stringify(reviews, null, 2), "utf8");
}

function isReviewShape(value: unknown): value is Review {
  if (!value || typeof value !== "object") return false;
  const r = value as Review;
  return (
    typeof r.id === "string" &&
    typeof r.restaurantId === "string" &&
    typeof r.rating === "number" &&
    typeof r.text === "string" &&
    typeof r.authorName === "string" &&
    typeof r.createdAt === "string" &&
    (r.ownerToken === undefined || typeof r.ownerToken === "string") &&
    (r.updatedAt === undefined || typeof r.updatedAt === "string")
  );
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

function summaryFromReviews(
  all: Review[],
  restaurantId: string
): ReviewSummary {
  const list = all.filter((r) => r.restaurantId === restaurantId);
  if (list.length === 0) return { count: 0, average: null };
  const sum = list.reduce((acc, r) => acc + r.rating, 0);
  return {
    count: list.length,
    average: Math.round((sum / list.length) * 10) / 10,
  };
}

export async function getReviewsByRestaurant(
  restaurantId: string
): Promise<Review[]> {
  const all = await readAll();
  return all
    .filter((r) => r.restaurantId === restaurantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReviewSummaries(): Promise<
  Record<string, ReviewSummary>
> {
  const all = await readAll();
  const map = new Map<string, { sum: number; count: number }>();

  for (const r of all) {
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

  const review: Review = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    restaurantId,
    rating,
    text: input.text.trim(),
    authorName: validated.authorName,
    ownerToken,
    createdAt: new Date().toISOString(),
  };

  const all = await readAll();
  all.push(review);
  await writeAll(all);

  return { ok: true, review };
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

  const all = await readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) {
    return { ok: false, error: "리뷰를 찾을 수 없습니다." };
  }

  const target = all[idx]!;
  if (target.ownerToken !== token) {
    return { ok: false, error: "본인이 작성한 리뷰만 삭제할 수 있습니다." };
  }

  const restaurantId = target.restaurantId;
  all.splice(idx, 1);
  await writeAll(all);

  return {
    ok: true,
    restaurantId,
    summary: summaryFromReviews(all, restaurantId),
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

  const all = await readAll();
  const idx = all.findIndex((r) => r.id === input.id);
  if (idx === -1) {
    return { ok: false, error: "리뷰를 찾을 수 없습니다." };
  }

  const target = all[idx]!;
  if (target.ownerToken !== token) {
    return { ok: false, error: "본인이 작성한 리뷰만 수정할 수 있습니다." };
  }

  const updated: Review = {
    ...target,
    rating: Number(input.rating),
    text: input.text.trim(),
    authorName: validated.authorName,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await writeAll(all);

  return { ok: true, review: updated };
}
