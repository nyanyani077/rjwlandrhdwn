/** 공주시청 인근 기준 (지도 초기 중심) */
export const GONGJU_CENTER = { lat: 36.45556, lng: 127.12472 } as const;

/** 지도 이동을 묶어 둘 사각형 범위 (남서쪽 ~ 북동쪽) */
export const GONGJU_BOUNDS = {
  sw: { lat: 36.405, lng: 127.04 },
  ne: { lat: 36.53, lng: 127.24 },
} as const;

export const GONGJU_DEFAULT_LEVEL = 6;
