import type { Review } from "@/lib/types/review";

const OWNER_TOKEN_KEY = "map-review-owner-token";
const OWNED_IDS_KEY = "map-review-owned-ids";

function readOwnedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OWNED_IDS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/** 이 브라우저에서 리뷰 작성 시 서버·로컬에 쓰는 소유 토큰 */
export function getReviewOwnerToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(OWNER_TOKEN_KEY);
  if (!token) {
    token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `own-${crypto.randomUUID()}`
        : `own-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(OWNER_TOKEN_KEY, token);
  }
  return token;
}

export function markReviewOwned(reviewId: string): void {
  if (typeof window === "undefined") return;
  const ids = readOwnedIds();
  if (!ids.includes(reviewId)) {
    localStorage.setItem(OWNED_IDS_KEY, JSON.stringify([...ids, reviewId]));
  }
}

export function isReviewOwned(review: Review): boolean {
  if (typeof window === "undefined") return false;
  const token = getReviewOwnerToken();
  if (review.ownerToken && review.ownerToken === token) return true;
  return readOwnedIds().includes(review.id);
}
