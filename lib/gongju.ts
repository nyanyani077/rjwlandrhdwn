/** 공주대학교 신관캠퍼스 인근 기준 (지도 초기 중심) */
export const GONGJU_CENTER = { lat: 36.471, lng: 127.1261 } as const;

/** 지도 이동을 묶어 둘 사각형 범위 (신관·캠퍼스 주변) */
export const GONGJU_BOUNDS = {
  sw: { lat: 36.448, lng: 127.098 },
  ne: { lat: 36.492, lng: 127.155 },
} as const;

/** Kakao map level (숫자가 작을수록 확대). 캠퍼스 중심 보기 */
export const GONGJU_DEFAULT_LEVEL = 5;
