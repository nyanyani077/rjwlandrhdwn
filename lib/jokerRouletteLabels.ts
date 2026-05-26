/** 조커 뽑기 룰렛·음식 분류 정렬에 공통으로 쓰는 6개 라벨 */
export const JOKER_ROULETTE_LABELS = [
  "한식",
  "중식",
  "일식",
  "양식",
  "베이커리",
  "아시아",
] as const;

export type JokerRouletteLabel = (typeof JOKER_ROULETTE_LABELS)[number];
