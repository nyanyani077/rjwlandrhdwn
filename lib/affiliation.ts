/** AQ열 제휴업체 소속 단과(고정 목록) */
export const AFFILIATION_COLLEGES = [
  "인문사회과학대학",
  "자연과학대학",
  "예술대학",
  "간호보건대학",
  "사범대학",
] as const;

export type AffiliationCollege = (typeof AFFILIATION_COLLEGES)[number];

export const AFFILIATION_PARENT = "제휴업체" as const;
