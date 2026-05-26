import { AFFILIATION_COLLEGES, type AffiliationCollege } from "@/lib/affiliation";
import type { Restaurant } from "@/lib/types/restaurant";

/** 메뉴 가격 상한 필터(원). 메뉴 중 하나라도 이 금액 이하면 포함 */
export type MenuPriceCap = 3000 | 5000 | 7000 | 9000;

function normalize(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

function parseMenuPriceWon(raw: string): number | null {
  const s = String(raw ?? "")
    .replace(/,/g, "")
    .trim();
  if (!s || !/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function restaurantHasMenuUpTo(r: Restaurant, cap: MenuPriceCap): boolean {
  return r.menus.some((m) => {
    const n = parseMenuPriceWon(m.price);
    return n != null && n <= cap;
  });
}

export function filterRestaurants(
  list: Restaurant[],
  query: string,
  foodCategory?: string | null,
  partnerFilter?: AffiliationCollege | null,
  priceCap?: MenuPriceCap | null
): Restaurant[] {
  let next = list;
  if (foodCategory) {
    next = next.filter(
      (r) => (r.category ?? r.tags?.[0] ?? "") === foodCategory
    );
  }

  if (priceCap != null && priceCap > 0) {
    next = next.filter((r) => restaurantHasMenuUpTo(r, priceCap));
  }

  if (
    partnerFilter &&
    (AFFILIATION_COLLEGES as readonly string[]).includes(partnerFilter)
  ) {
    next = next.filter((r) =>
      r.affiliationColleges?.includes(partnerFilter)
    );
  }

  const q = normalize(query.trim());
  if (!q) return next;

  return next.filter((r) => {
    if (normalize(r.name).includes(q)) return true;
    if (r.address && normalize(r.address).includes(q)) return true;
    if (r.category && normalize(r.category).includes(q)) return true;
    if (r.hours && normalize(r.hours).includes(q)) return true;
    if (r.tags?.some((t) => normalize(t).includes(q))) return true;
    if (r.affiliationColleges?.some((c) => normalize(c).includes(q)))
      return true;
    if (r.arNote && normalize(r.arNote).includes(q)) return true;
    if (
      (r.affiliationColleges?.length ?? 0) > 0 &&
      normalize("제휴업체").includes(q)
    )
      return true;
    if (r.menus.some((m) => normalize(m.name).includes(q))) return true;
    return false;
  });
}
