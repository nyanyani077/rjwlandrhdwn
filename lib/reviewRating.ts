export const MIN_REVIEW_RATING = 0.5;
export const MAX_REVIEW_RATING = 5;
export const REVIEW_RATING_STEP = 0.5;

export function isValidReviewRating(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  if (value < MIN_REVIEW_RATING || value > MAX_REVIEW_RATING) return false;
  const steps = Math.round(value / REVIEW_RATING_STEP);
  return Math.abs(value - steps * REVIEW_RATING_STEP) < 0.001;
}

export function formatReviewRating(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : value.toFixed(1);
}
