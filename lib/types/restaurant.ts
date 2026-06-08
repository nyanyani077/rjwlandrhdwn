import type { AffiliationCollege } from "@/lib/affiliation";

export type MenuItem = {
  name: string;
  price: string;
};

export type Restaurant = {
  id: string;
  name: string;
  /** 있으면 지도에 바로 사용. 없으면 `address`로 카카오 지오코딩 */
  lat?: number;
  lng?: number;
  address?: string;
  menus: MenuItem[];
  /** 가게 첫 행의 E열(첫 메뉴 셀)만 — 목록 미리보기용 */
  menuPreview?: MenuItem;
  /** C열 음식 카테고리 (검색·필터용 `tags`와 동일하게 채워질 수 있음) */
  category?: string;
  /** D열 영업시간 */
  hours?: string;
  /** AQ열: 제휴업체 소속 단과(복수 가능, 엑셀 쉼표 구분) */
  affiliationColleges?: AffiliationCollege[];
  /** AR열: 혜택·비고 문구 */
  arNote?: string;
  tags?: string[];
};
