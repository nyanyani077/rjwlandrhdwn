"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Review, ReviewSummary } from "@/lib/types/review";
import { StarRatingDisplay, StarRatingInput } from "@/components/StarRating";
import {
  getReviewOwnerToken,
  isReviewOwned,
  markReviewOwned,
} from "@/lib/reviewOwner";
import { upload } from "@vercel/blob/client";
import {
  REVIEW_IMAGE_MAX_BYTES,
  reviewImageExtension,
  validateReviewImage,
} from "@/lib/reviewImage";

type Props = {
  restaurantId: string;
  restaurantName: string;
  summary?: ReviewSummary;
  onSummaryChange?: (summary: ReviewSummary) => void;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

async function uploadReviewImage(file: File): Promise<string> {
  const validated = validateReviewImage(file.size, file.type);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const ext = reviewImageExtension(file.type || "image/png");
  const pathname = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  try {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/reviews/upload",
    });
    return blob.url;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "사진 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    throw new Error(message);
  }
}

function pickReviewImageFile(
  file: File | undefined
): { ok: true; file: File } | { ok: false; error: string } {
  if (!file) return { ok: false, error: "사진 파일을 선택해 주세요." };
  const validated = validateReviewImage(file.size, file.type);
  if (!validated.ok) return validated;
  return { ok: true, file };
}

type ReviewImageFieldProps = {
  previewUrl: string | null;
  disabled: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
  label?: string;
};

function ReviewImageField({
  previewUrl,
  disabled,
  onPick,
  onClear,
  label = "사진 첨부 (선택, 1장)",
}: ReviewImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const picked = pickReviewImageFile(e.target.files?.[0]);
          if (!picked.ok) {
            alert(picked.error);
            e.target.value = "";
            return;
          }
          onPick(picked.file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {label}
        </button>
        {previewUrl && (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="text-[11px] text-stone-500 hover:text-red-600 disabled:opacity-50"
          >
            사진 제거
          </button>
        )}
      </div>
      <p className="text-[10px] text-stone-400">
        jpg, png, webp · 최대 {Math.round(REVIEW_IMAGE_MAX_BYTES / 1024 / 1024)}MB
      </p>
      {previewUrl && (
        <img
          src={previewUrl}
          alt="리뷰 사진 미리보기"
          className="max-h-32 w-full rounded-md border border-stone-200 object-cover"
        />
      )}
    </div>
  );
}

function summaryFromList(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) return { count: 0, average: null };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    count: reviews.length,
    average: Math.round((sum / reviews.length) * 10) / 10,
  };
}

export function RestaurantReviews({
  restaurantId,
  restaurantName,
  summary,
  onSummaryChange,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(4);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(4);
  const [editText, setEditText] = useState("");
  const [editAuthorName, setEditAuthorName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editRemoveImage, setEditRemoveImage] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/reviews?restaurantId=${encodeURIComponent(restaurantId)}`
      );
      if (!res.ok) throw new Error("리뷰를 불러오지 못했습니다.");
      const data = (await res.json()) as { reviews: Review[] };
      setReviews(data.reviews ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "리뷰를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (editImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(editImagePreview);
      }
    };
  }, [editImagePreview]);

  const clearCreateImage = () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const clearEditImage = () => {
    if (editImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const pickCreateImage = (file: File) => {
    clearCreateImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const pickEditImage = (file: File) => {
    clearEditImage();
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
    setEditRemoveImage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ownerToken = getReviewOwnerToken();
      const imageUrl = imageFile ? await uploadReviewImage(imageFile) : undefined;
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          rating,
          text,
          authorName: authorName.trim() || undefined,
          ownerToken,
          imageUrl,
        }),
      });
      const data = (await res.json()) as { review?: Review; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "리뷰 등록에 실패했습니다.");
      }
      if (data.review) {
        markReviewOwned(data.review.id);
        const next = [data.review, ...reviews];
        setReviews(next);
        onSummaryChange?.(summaryFromList(next));
      }
      setText("");
      clearCreateImage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "리뷰 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (rev: Review) => {
    setEditingId(rev.id);
    setEditRating(rev.rating);
    setEditText(rev.text);
    setEditAuthorName(rev.authorName === "익명" ? "" : rev.authorName);
    clearEditImage();
    setEditRemoveImage(false);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    clearEditImage();
    setEditRemoveImage(false);
    setError(null);
  };

  const handleUpdate = async (rev: Review) => {
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl: string | null | undefined;
      if (editImageFile) {
        imageUrl = await uploadReviewImage(editImageFile);
      } else if (editRemoveImage) {
        imageUrl = null;
      }

      const res = await fetch(`/api/reviews/${encodeURIComponent(rev.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerToken: getReviewOwnerToken(),
          rating: editRating,
          text: editText,
          authorName: editAuthorName.trim() || undefined,
          ...(imageUrl !== undefined ? { imageUrl } : {}),
        }),
      });
      const data = (await res.json()) as { review?: Review; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "리뷰 수정에 실패했습니다.");
      }
      if (data.review) {
        const next = reviews.map((r) =>
          r.id === data.review!.id ? data.review! : r
        );
        setReviews(next);
        onSummaryChange?.(summaryFromList(next));
        setEditingId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "리뷰 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rev: Review) => {
    if (
      !window.confirm("작성한 리뷰를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")
    ) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const ownerToken = getReviewOwnerToken();
      const res = await fetch(`/api/reviews/${encodeURIComponent(rev.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerToken }),
      });
      const data = (await res.json()) as {
        summary?: ReviewSummary;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "리뷰 삭제에 실패했습니다.");
      }
      const next = reviews.filter((r) => r.id !== rev.id);
      setReviews(next);
      onSummaryChange?.(data.summary ?? summaryFromList(next));
      if (editingId === rev.id) setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "리뷰 삭제에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-4 pt-3">
      {summary && summary.count > 0 && summary.average != null && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-amber-50/80 py-2 text-sm text-stone-700">
          <StarRatingDisplay value={summary.average} size="md" />
          <span className="font-medium">평균 · {summary.count}개 리뷰</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 rounded-lg bg-stone-50 p-3">
        <p className="text-[10px] text-stone-500">{restaurantName}</p>
        <StarRatingInput
          value={rating}
          onChange={setRating}
          disabled={submitting}
        />
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          disabled={submitting}
          placeholder="닉네임 (선택, 미입력 시 익명)"
          maxLength={30}
          className="w-full rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitting}
          placeholder="음식, 분위기, 가격 대비 만족도 등을 적어 주세요."
          rows={3}
          maxLength={2000}
          required
          className="w-full resize-none rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
        />
        <ReviewImageField
          previewUrl={imagePreview}
          disabled={submitting}
          onPick={pickCreateImage}
          onClear={clearCreateImage}
        />
        <button
          type="submit"
          disabled={submitting || text.trim().length < 2}
          className="w-full rounded-md bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "등록 중…" : "리뷰 등록"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-[11px] text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-2">
        {loading ? (
          <p className="py-2 text-center text-[11px] text-stone-500">
            리뷰 불러오는 중…
          </p>
        ) : reviews.length === 0 ? (
          <p className="py-2 text-center text-[11px] text-stone-500">
            첫 리뷰를 남겨 보세요.
          </p>
        ) : (
          <ul className="max-h-[min(42vh,360px)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
            {reviews.map((rev) => {
              const owned = isReviewOwned(rev);
              const isEditing = editingId === rev.id;

              return (
                <li
                  key={rev.id}
                  className="relative rounded-md border border-stone-100 bg-white px-2 py-1.5"
                >
                  {owned && !isEditing && (
                    <div className="absolute right-1 top-1 flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => startEdit(rev)}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-stone-500 hover:bg-stone-100 hover:text-amber-800 disabled:opacity-40"
                        aria-label="리뷰 수정"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void handleDelete(rev)}
                        className="flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        aria-label="리뷰 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {isEditing ? (
                    <form
                      className="space-y-2 pr-1 pt-0.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleUpdate(rev);
                      }}
                    >
                      <StarRatingInput
                        value={editRating}
                        onChange={setEditRating}
                        disabled={submitting}
                      />
                      <input
                        type="text"
                        value={editAuthorName}
                        onChange={(e) => setEditAuthorName(e.target.value)}
                        disabled={submitting}
                        placeholder="닉네임 (선택)"
                        maxLength={30}
                        className="w-full rounded-md border border-stone-200 px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
                      />
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        disabled={submitting}
                        rows={3}
                        maxLength={2000}
                        required
                        className="w-full resize-none rounded-md border border-stone-200 px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
                      />
                      <ReviewImageField
                        previewUrl={
                          editImagePreview ??
                          (editRemoveImage ? null : rev.imageUrl ?? null)
                        }
                        disabled={submitting}
                        onPick={pickEditImage}
                        onClear={() => {
                          if (rev.imageUrl || editImageFile) {
                            setEditRemoveImage(true);
                          }
                          clearEditImage();
                        }}
                        label="사진 변경 (선택)"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitting || editText.trim().length < 2}
                          className="flex-1 rounded-md bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          {submitting ? "저장 중…" : "저장"}
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={cancelEdit}
                          className="rounded-md border border-stone-200 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div
                        className={`flex flex-wrap items-center justify-between gap-1 ${owned ? "pr-14" : ""}`}
                      >
                        <span className="text-[11px] font-medium text-stone-800">
                          {rev.authorName}
                          {owned && (
                            <span className="ml-1 font-normal text-amber-700">
                              (내 리뷰)
                            </span>
                          )}
                        </span>
                        <time
                          className="text-[10px] text-stone-400"
                          dateTime={rev.updatedAt ?? rev.createdAt}
                        >
                          {formatDate(rev.updatedAt ?? rev.createdAt)}
                          {rev.updatedAt ? " · 수정됨" : ""}
                        </time>
                      </div>
                      <StarRatingDisplay
                        value={rev.rating}
                        size="sm"
                        className="mt-0.5"
                      />
                      <p className="mt-1 whitespace-pre-wrap text-[11px] leading-snug text-stone-700">
                        {rev.text}
                      </p>
                      {rev.imageUrl && (
                        <img
                          src={rev.imageUrl}
                          alt={`${rev.authorName} 리뷰 사진`}
                          className="mt-2 max-h-40 w-full rounded-md border border-stone-100 object-cover"
                          loading="lazy"
                        />
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
