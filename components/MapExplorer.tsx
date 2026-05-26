"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AFFILIATION_COLLEGES,
  AFFILIATION_PARENT,
  type AffiliationCollege,
} from "@/lib/affiliation";
import { getRestaurants } from "@/lib/restaurants";
import {
  filterRestaurants,
  type MenuPriceCap,
} from "@/lib/filterRestaurants";
import { SearchBar } from "@/components/SearchBar";
import { SiteBanner } from "@/components/SiteBanner";
import { KakaoMap } from "@/components/KakaoMap";
import { JokerRouletteModal } from "@/components/JokerRouletteModal";
import { RestaurantReviewsModal } from "@/components/RestaurantReviewsModal";
import { StarRatingDisplay } from "@/components/StarRating";
import { JOKER_ROULETTE_LABELS } from "@/lib/jokerRouletteLabels";
import type { ReviewSummary } from "@/lib/types/review";

const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

/** 칩에서 자주 쓰는 카테고리를 앞에 두어(특히 한식) 가로 스크롤 밖으로 밀리지 않게 함 */
const CATEGORY_ORDER: readonly string[] = JOKER_ROULETTE_LABELS;

const MENU_PRICE_CAPS: readonly MenuPriceCap[] = [3000, 5000, 7000, 9000];

function formatMenuPrice(price: string): string {
  const p = price.trim();
  if (!p) return "";
  return /^\d+$/.test(p) ? `${p}원` : p;
}

export function MapExplorer() {
  const all = useMemo(() => getRestaurants(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [partnerFilter, setPartnerFilter] = useState<AffiliationCollege | null>(
    null
  );
  const [priceCap, setPriceCap] = useState<MenuPriceCap | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [menuDetailId, setMenuDetailId] = useState<string | null>(null);
  const [jokerOpen, setJokerOpen] = useState(false);
  const [reviewSummaries, setReviewSummaries] = useState<
    Record<string, ReviewSummary>
  >({});
  const [reviewModal, setReviewModal] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/reviews")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { summaries?: Record<string, ReviewSummary> } | null) => {
        if (!cancelled && data?.summaries) {
          setReviewSummaries(data.summaries);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of all) {
      const c = r.category ?? r.tags?.[0];
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b, "ko");
    });
  }, [all]);

  const filtered = useMemo(
    () =>
      filterRestaurants(all, query, category, partnerFilter, priceCap),
    [all, query, category, partnerFilter, priceCap]
  );

  const selectedRestaurant = useMemo(() => {
    if (!focusId) return null;
    return filtered.find((r) => r.id === focusId) ?? null;
  }, [filtered, focusId]);

  useEffect(() => {
    if (focusId && !filtered.some((r) => r.id === focusId)) {
      const id = window.setTimeout(() => setFocusId(null), 0);
      return () => window.clearTimeout(id);
    }
  }, [filtered, focusId]);

  useEffect(() => {
    if (menuDetailId && !filtered.some((r) => r.id === menuDetailId)) {
      const id = window.setTimeout(() => setMenuDetailId(null), 0);
      return () => window.clearTimeout(id);
    }
  }, [filtered, menuDetailId]);

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-stone-50 text-stone-900">
      <JokerRouletteModal
        open={jokerOpen}
        onClose={() => setJokerOpen(false)}
        restaurants={all}
      />

      <RestaurantReviewsModal
        open={reviewModal != null}
        restaurantId={reviewModal?.id ?? ""}
        restaurantName={reviewModal?.name ?? ""}
        summary={
          reviewModal ? reviewSummaries[reviewModal.id] : undefined
        }
        onClose={() => setReviewModal(null)}
        onSummaryChange={(summary) => {
          if (!reviewModal) return;
          setReviewSummaries((prev) => ({
            ...prev,
            [reviewModal.id]: summary,
          }));
        }}
      />

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <SiteBanner />

        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:px-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              <div className="min-w-0 max-w-xl space-y-1">
                <p className="text-xs text-stone-500">
                  표시 지역: 공주시 · 메뉴와 가격은 데이터에 따라 달라질 수
                  있어요
                </p>
                <p className="text-[11px] leading-relaxed text-stone-400">
                  본 웹사이트는 캡스톤 디자인 프로젝트의 일환으로 제작된
                  사이트이며,
                  <br />
                  특정 업체에 대한 비방 및 상업적 의도가 없습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setJokerOpen(true)}
                className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-900 shadow-sm transition-colors hover:bg-violet-100"
              >
                조커 뽑기
              </button>
            </div>
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="이름, 주소, 음식·제휴, 단과, 메뉴 검색"
            />
          </div>
        </header>

        {/* 스크롤 길이 = 배너 + 지도 트랙(데스크톱). 메뉴는 고정 높이·내부 스크롤만 */}
        <div className="mx-auto flex h-[var(--panel-h)] w-full flex-col gap-3 overflow-hidden p-3 sm:p-4 md:h-auto md:min-h-[var(--panel-h)] md:flex-row md:items-start md:overflow-visible lg:px-5 [--panel-h:calc(100svh-6.25rem-2.25rem)]">
        <aside className="flex min-h-0 flex-[0_0_46%] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm md:sticky md:top-[6.25rem] md:z-10 md:h-[var(--panel-h)] md:max-h-[var(--panel-h)] md:flex-none md:basis-[min(420px,36vw)] md:max-w-[440px]">
          <div className="shrink-0 border-b border-stone-100 px-3 py-2">
            <p className="mb-2 text-xs font-medium text-stone-600">음식 분류</p>
            <div className="flex max-w-full flex-wrap gap-1.5 pb-0.5">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  category === null
                    ? "bg-amber-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                전체
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() =>
                    setCategory((prev) => (prev === c ? null : c))
                  }
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    category === c
                      ? "bg-amber-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <p className="mb-2 mt-3 text-xs font-medium text-stone-600">
              메뉴 가격
            </p>
            <div className="flex max-w-full flex-wrap gap-1.5 pb-0.5">
              <button
                type="button"
                onClick={() => setPriceCap(null)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  priceCap === null
                    ? "bg-violet-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                전체
              </button>
              {MENU_PRICE_CAPS.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  title={`메뉴 중 ${cap}원 이하가 있는 곳`}
                  onClick={() =>
                    setPriceCap((prev) => (prev === cap ? null : cap))
                  }
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    priceCap === cap
                      ? "bg-violet-600 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  ~{cap}원
                </button>
              ))}
            </div>

            <p className="mb-2 mt-3 text-xs font-medium text-stone-600">
              {AFFILIATION_PARENT}
            </p>
            <div className="flex max-w-full flex-wrap gap-1.5 pb-0.5">
              {AFFILIATION_COLLEGES.map((college) => (
                <button
                  key={college}
                  type="button"
                  title={college}
                  onClick={() =>
                    setPartnerFilter((prev) =>
                      prev === college ? null : college
                    )
                  }
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    partnerFilter === college
                      ? "bg-teal-700 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {college}
                </button>
              ))}
            </div>

            <p className="mt-2 text-xs font-medium text-stone-600">
              검색 결과{" "}
              <span className="text-stone-900">{filtered.length}</span>곳
            </p>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
            {filtered.length === 0 ? (
              <li className="rounded-lg px-3 py-8 text-center text-sm text-stone-500">
                {all.length === 0
                  ? "등록된 음식점이 아직 없어요. 데이터를 추가하면 여기와 지도에 표시됩니다."
                  : "검색 결과가 없어요. 다른 키워드를 입력해 보세요."}
              </li>
            ) : (
              filtered.map((r) => {
                const preview = r.menuPreview;
                const onlySingleSameAsE =
                  r.menus.length === 1 &&
                  preview != null &&
                  r.menus[0].name === preview.name &&
                  r.menus[0].price === preview.price;
                const hasMoreMenus =
                  r.menus.length > 0 && !onlySingleSameAsE;
                const expanded = menuDetailId === r.id;

                return (
                  <li key={r.id} className="mb-1">
                    <div
                      className={`relative rounded-lg ring-1 transition-colors ${
                        focusId === r.id
                          ? "bg-amber-50 ring-amber-200/80"
                          : "ring-transparent hover:bg-stone-50"
                      }`}
                    >
                      {focusId === r.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewModal({ id: r.id, name: r.name });
                          }}
                          className="absolute right-2 top-2 z-10 rounded-md border border-amber-200/90 bg-white px-2 py-1 text-[10px] font-semibold text-amber-900 shadow-sm hover:bg-amber-50 sm:text-[11px]"
                        >
                          리뷰 자세히 보기
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setFocusId((prev) => (prev === r.id ? null : r.id))
                        }
                        className={`w-full px-3 py-3 text-left text-sm sm:px-4 ${
                          focusId === r.id ? "pr-[7.25rem] sm:pr-[8rem]" : ""
                        }`}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-stone-900">
                            {r.name}
                          </span>
                          {reviewSummaries[r.id]?.count ? (
                            <StarRatingDisplay
                              value={reviewSummaries[r.id].average ?? 0}
                              size="sm"
                              showValue
                              className="shrink-0"
                            />
                          ) : null}
                        </span>
                        {(r.category ?? r.tags?.[0]) && (
                          <span className="mt-0.5 block text-[11px] text-amber-800/90">
                            {r.category ?? r.tags?.[0]}
                          </span>
                        )}
                        {r.hours && (
                          <span className="mt-0.5 block text-[11px] text-stone-500">
                            영업시간 {r.hours}
                          </span>
                        )}
                        {r.affiliationColleges &&
                          r.affiliationColleges.length > 0 && (
                            <span className="mt-0.5 block text-[11px] text-teal-800">
                              {AFFILIATION_PARENT} ·{" "}
                              {r.affiliationColleges.join(", ")}
                            </span>
                          )}
                        {r.arNote && (
                          <span className="mt-0.5 block text-[11px] leading-snug text-teal-900/90">
                            {r.arNote}
                          </span>
                        )}
                        {preview && (
                          <span className="mt-0.5 block text-xs text-stone-500">
                            {preview.name} · {formatMenuPrice(preview.price)}
                          </span>
                        )}
                      </button>
                      {r.menus.length > 0 && hasMoreMenus && (
                        <div className="border-t border-stone-100/90 px-2 pb-2 pt-0">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuDetailId((id) =>
                                id === r.id ? null : r.id
                              )
                            }
                            className="mt-1 w-full rounded-md py-1.5 text-center text-[11px] font-medium text-amber-800/90 underline-offset-2 hover:bg-amber-100/50 hover:underline"
                          >
                            {expanded
                              ? "메뉴 접기"
                              : "메뉴 자세히 (전체 메뉴·가격)"}
                          </button>
                          {expanded && (
                            <ul className="mt-1 space-y-1.5 rounded-md bg-stone-50/90 px-2 py-2 text-left text-xs text-stone-700 sm:px-3 sm:py-3 sm:text-sm">
                              {r.menus.map((m, idx) => (
                                <li
                                  key={`${r.id}-m-${idx}`}
                                  className="flex justify-between gap-2 border-b border-stone-200/60 pb-1 last:border-0"
                                >
                                  <span className="min-w-0 break-words">
                                    {m.name}
                                  </span>
                                  <span className="shrink-0 font-medium text-teal-700">
                                    {formatMenuPrice(m.price)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <div className="relative min-h-0 min-w-0 flex-1 md:min-h-[var(--panel-h)]">
          <div className="h-full md:sticky md:top-[6.25rem] md:z-0 md:h-[var(--panel-h)]">
            <KakaoMap selected={selectedRestaurant} appKey={appKey} />
          </div>
        </div>
        </div>
      </main>

      <footer className="shrink-0 space-y-0.5 border-t border-stone-200 bg-white px-4 py-2 text-center text-[11px] text-stone-500">
        <p>표시 지역: 공주시</p>
        <p>© 2026 공주대학교 지리학과 임승연, 김혜린</p>
      </footer>
    </div>
  );
}
