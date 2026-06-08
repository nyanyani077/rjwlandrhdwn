export const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const REVIEW_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const BLOB_HOST_PATTERN = /blob\.vercel-storage\.com$/i;

export function isReviewImageMimeType(type: string): boolean {
  return REVIEW_IMAGE_MIME_TYPES.has(type);
}

export function validateReviewImage(
  size: number,
  type: string
): { ok: true } | { ok: false; error: string } {
  if (!isReviewImageMimeType(type)) {
    return {
      ok: false,
      error: "jpg, png, webp 형식의 사진만 첨부할 수 있습니다.",
    };
  }
  if (size > REVIEW_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: "사진 크기는 5MB 이하만 첨부할 수 있습니다.",
    };
  }
  if (size <= 0) {
    return { ok: false, error: "사진 파일이 비어 있습니다." };
  }
  return { ok: true };
}

export function isManagedReviewImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return BLOB_HOST_PATTERN.test(host);
  } catch {
    return false;
  }
}

export function reviewImageExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
