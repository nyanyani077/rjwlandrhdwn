/**
 * 지도 첫 화면 기준: 충청남도 공주시 공주대학로 56 (국립공주대 신관캠퍼스)
 * 스케일 약 250m 수준으로 신관 상권이 보이도록 설정
 */
export const GONGJU_CENTER = { lat: 36.4702, lng: 127.141 } as const;

/** 지도 이동 허용 범위 (신관·웅진 지역) */
export const GONGJU_BOUNDS = {
  sw: { lat: 36.438, lng: 127.085 },
  ne: { lat: 36.495, lng: 127.165 },
} as const;

/** Kakao map level (숫자가 클수록 축소). 4 ≈ 신관동 넓은 뷰 */
export const GONGJU_DEFAULT_LEVEL = 4;
