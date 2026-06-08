"use client";

import { formatReviewRating } from "@/lib/reviewRating";

type DisplayProps = {
  value: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
};

type InputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
};

const STAR_PATH =
  "M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z";

function starFillPercent(starIndex: number, value: number): number {
  const fill = Math.min(1, Math.max(0, value - (starIndex - 1)));
  return fill * 100;
}

function Stars({
  value,
  size = "md",
  interactive,
  onPick,
  disabled,
}: {
  value: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onPick?: (rating: number) => void;
  disabled?: boolean;
}) {
  const px = size === "sm" ? 16 : 22;

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${interactive ? "" : ""}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "별점 선택" : `별점 ${formatReviewRating(value)}점`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPct = starFillPercent(star, value);

        if (interactive && onPick) {
          return (
            <div
              key={star}
              className="relative shrink-0"
              style={{ width: px, height: px }}
            >
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 text-stone-200"
                aria-hidden
              >
                <path d={STAR_PATH} fill="currentColor" />
              </svg>
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 text-amber-500"
                style={{ clipPath: `inset(0 ${100 - fillPct}% 0 0)` }}
                aria-hidden
              >
                <path d={STAR_PATH} fill="currentColor" />
              </svg>
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-y-0 left-0 w-1/2 cursor-pointer disabled:cursor-not-allowed"
                aria-label={`${star - 0.5}점`}
                onClick={() => onPick(star - 0.5)}
              />
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-y-0 right-0 w-1/2 cursor-pointer disabled:cursor-not-allowed"
                aria-label={`${star}점`}
                onClick={() => onPick(star)}
              />
            </div>
          );
        }

        return (
          <span
            key={star}
            className="relative inline-block shrink-0"
            style={{ width: px, height: px }}
          >
            <svg
              viewBox="0 0 24 24"
              className="absolute inset-0 text-stone-200"
              aria-hidden
            >
              <path d={STAR_PATH} fill="currentColor" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              className="absolute inset-0 text-amber-500"
              style={{ clipPath: `inset(0 ${100 - fillPct}% 0 0)` }}
              aria-hidden
            >
              <path d={STAR_PATH} fill="currentColor" />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

export function StarRatingDisplay({
  value,
  size = "md",
  showValue = true,
  className = "",
}: DisplayProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Stars value={value} size={size} />
      {showValue && (
        <span className="text-xs font-semibold text-amber-800">
          {formatReviewRating(value)}
        </span>
      )}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  className = "",
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Stars
        value={value}
        interactive
        onPick={onChange}
        disabled={disabled}
      />
      <span className="text-[11px] text-stone-500">
        선택: {formatReviewRating(value)} / 5.0 (0.5점 단위)
      </span>
    </div>
  );
}
