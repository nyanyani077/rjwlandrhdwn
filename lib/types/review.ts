export type Review = {
  id: string;
  restaurantId: string;
  /** 0.5 ~ 5.0 (0.5 단위) */
  rating: number;
  text: string;
  authorName: string;
  /** 리뷰 첨부 사진 URL (1장) */
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  /** 작성 기기 식별 — 본인 삭제·수정 인증용 */
  ownerToken?: string;
};

export type ReviewSummary = {
  count: number;
  average: number | null;
};
