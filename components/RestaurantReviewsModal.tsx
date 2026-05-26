"use client";

import { useEffect, useId, useRef } from "react";
import { RestaurantReviews } from "@/components/RestaurantReviews";
import type { ReviewSummary } from "@/lib/types/review";

type Props = {
  open: boolean;
  restaurantId: string;
  restaurantName: string;
  summary?: ReviewSummary;
  onClose: () => void;
  onSummaryChange?: (summary: ReviewSummary) => void;
};

export function RestaurantReviewsModal({
  open,
  restaurantId,
  restaurantName,
  summary,
  onClose,
  onSummaryChange,
}: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl"
      >
        <div className="shrink-0 border-b border-stone-100 px-4 py-3">
          <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-start gap-1">
            <div aria-hidden className="col-start-1" />
            <div className="col-start-2 text-center">
              <h2
                id={titleId}
                className="text-base font-semibold text-stone-900"
              >
                리뷰
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">{restaurantName}</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="col-start-3 justify-self-end rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <RestaurantReviews
            restaurantId={restaurantId}
            restaurantName={restaurantName}
            summary={summary}
            onSummaryChange={onSummaryChange}
          />
        </div>
      </div>
    </div>
  );
}
