/**
 * 지도 첫 화면: 신관동 일대(공주대 신관캠퍼스·금강신관공원·버스터미널 인근)
 * 스케일 약 250m 수준으로 신관 상권이 보이도록 설정
 */
export const GONGJU_CENTER = { lat: 36.4638, lng: 127.1238 } as const;

/** 지도 이동 허용 범위 (신관·웅진 지역) */
export const GONGJU_BOUNDS = {
  sw: { lat: 36.438, lng: 127.085 },
  ne: { lat: 36.495, lng: 127.165 },
} as const;

/** Kakao map level (숫자가 클수록 축소). 4 ≈ 신관동 넓은 뷰 */
export const GONGJU_DEFAULT_LEVEL = 4;
