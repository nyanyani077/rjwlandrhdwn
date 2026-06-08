import { del } from "@vercel/blob";
import { isManagedReviewImageUrl } from "@/lib/reviewImage";

export async function deleteReviewImage(
  url: string | null | undefined
): Promise<void> {
  if (!url || !isManagedReviewImageUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.error("[reviews] image delete failed:", error);
  }
}
