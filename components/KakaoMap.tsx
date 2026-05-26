"use client";

import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "@/lib/types/restaurant";
import { GONGJU_BOUNDS, GONGJU_CENTER, GONGJU_DEFAULT_LEVEL } from "@/lib/gongju";
import { escapeHtml } from "@/lib/escapeHtml";

function formatPrice(price: string): string {
  const p = price.trim();
  if (!p) return "";
  return /^\d+$/.test(p) ? `${p}원` : p;
}

const INFO_MENU_LIMIT = 4;

function buildInfoHtml(r: Restaurant): string {
  const category = r.category ?? r.tags?.[0] ?? "";
  const menuItems = r.menus.slice(0, INFO_MENU_LIMIT);
  const moreMenus = Math.max(0, r.menus.length - INFO_MENU_LIMIT);

  const menuList =
    menuItems.length > 0
      ? `<ul class="km-menus">${menuItems
          .map(
            (m) =>
              `<li class="km-menu-item"><span class="km-menu-name">${escapeHtml(m.name)}</span><span class="km-menu-price">${escapeHtml(formatPrice(m.price))}</span></li>`
          )
          .join("")}</ul>${
          moreMenus > 0
            ? `<p class="km-menu-more">외 ${moreMenus}개 메뉴 · 목록에서 전체 보기</p>`
            : ""
        }`
      : "";

  const metaRows = [
    r.address
      ? `<div class="km-row"><span class="km-label">주소</span><span class="km-value">${escapeHtml(r.address)}</span></div>`
      : "",
    r.hours
      ? `<div class="km-row"><span class="km-label">영업</span><span class="km-value">${escapeHtml(r.hours)}</span></div>`
      : "",
    r.affiliationColleges && r.affiliationColleges.length > 0
      ? `<div class="km-row"><span class="km-label">제휴</span><span class="km-value km-aff">${escapeHtml(r.affiliationColleges.join(", "))}</span></div>`
      : "",
    r.arNote
      ? `<div class="km-row"><span class="km-label">안내</span><span class="km-value">${escapeHtml(r.arNote)}</span></div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const previewBlock =
    r.menuPreview &&
    !menuItems.some(
      (m) =>
        m.name === r.menuPreview!.name && m.price === r.menuPreview!.price
    )
      ? `<div class="km-highlight">
          <span class="km-highlight-label">추천</span>
          <span class="km-highlight-name">${escapeHtml(r.menuPreview.name)}</span>
          <span class="km-highlight-price">${escapeHtml(formatPrice(r.menuPreview.price))}</span>
        </div>`
      : "";

  return `
    <div class="km-card">
      <div class="km-head">
        ${category ? `<span class="km-cat">${escapeHtml(category)}</span>` : ""}
        <h3 class="km-name">${escapeHtml(r.name)}</h3>
      </div>
      ${metaRows ? `<div class="km-meta">${metaRows}</div>` : ""}
      ${previewBlock}
      ${menuList ? `<div class="km-menu-section">${menuList}</div>` : ""}
    </div>
    <style>
      .km-card { font-family: "Pretendard", system-ui, -apple-system, sans-serif; width: 260px; max-width: min(260px, 88vw); padding: 0; color: #292524; }
      .km-head { padding: 14px 14px 10px; border-bottom: 1px solid #f5f5f4; }
      .km-cat { display: inline-block; margin-bottom: 6px; padding: 3px 8px; border-radius: 9999px; background: #fff7ed; color: #9a3412; font-size: 10px; font-weight: 600; letter-spacing: 0.02em; }
      .km-name { margin: 0; font-size: 16px; font-weight: 700; line-height: 1.35; color: #1c1917; word-break: keep-all; }
      .km-meta { padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; background: #fafaf9; }
      .km-row { display: grid; grid-template-columns: 36px 1fr; gap: 8px; align-items: start; font-size: 11px; line-height: 1.45; }
      .km-label { color: #a8a29e; font-weight: 600; }
      .km-value { color: #57534e; word-break: keep-all; }
      .km-value.km-aff { color: #0f766e; }
      .km-highlight { margin: 0 14px; margin-top: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border-radius: 10px; background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%); border: 1px solid #fde68a; }
      .km-highlight-label { font-size: 10px; font-weight: 700; color: #b45309; }
      .km-highlight-name { flex: 1; min-width: 0; font-size: 12px; font-weight: 600; color: #44403c; }
      .km-highlight-price { font-size: 12px; font-weight: 700; color: #0d9488; white-space: nowrap; }
      .km-menu-section { padding: 10px 14px 14px; }
      .km-menus { list-style: none; margin: 0; padding: 0; }
      .km-menu-item { display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f5f5f4; font-size: 12px; }
      .km-menu-item:last-child { border-bottom: none; padding-bottom: 0; }
      .km-menu-name { color: #44403c; min-width: 0; word-break: keep-all; }
      .km-menu-price { color: #0d9488; font-weight: 700; white-space: nowrap; }
      .km-menu-more { margin: 8px 0 0; font-size: 10px; color: #a8a29e; text-align: center; }
    </style>
  `;
}

function clampLatLng(
  lat: number,
  lng: number
): { lat: number; lng: number } {
  const { sw, ne } = GONGJU_BOUNDS;
  return {
    lat: Math.min(Math.max(lat, sw.lat), ne.lat),
    lng: Math.min(Math.max(lng, sw.lng), ne.lng),
  };
}

function resolveCoord(
  r: Restaurant,
  cache: Map<string, { lat: number; lng: number }>
): { lat: number; lng: number } | null {
  const hit = cache.get(r.id);
  if (hit) return hit;
  if (typeof r.lat === "number" && typeof r.lng === "number") {
    return { lat: r.lat, lng: r.lng };
  }
  return null;
}

type Props = {
  restaurants: Restaurant[];
  focusId: string | null;
  appKey: string | undefined;
};

type KakaoMapHandle = InstanceType<typeof window.kakao.maps.Map>;
type KakaoMarkerHandle = InstanceType<typeof window.kakao.maps.Marker>;

export function KakaoMap({ restaurants, focusId, appKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapHandle | null>(null);
  const activeMarkerRef = useRef<KakaoMarkerHandle | null>(null);
  const infoRef = useRef<InstanceType<
    typeof window.kakao.maps.InfoWindow
  > | null>(null);
  const allowedBoundsRef = useRef<InstanceType<
    typeof window.kakao.maps.LatLngBounds
  > | null>(null);
  const coordsCacheRef = useRef<Map<string, { lat: number; lng: number }>>(
    new Map()
  );
  const [mapReady, setMapReady] = useState(false);

  const clearActivePin = () => {
    activeMarkerRef.current?.setMap(null);
    activeMarkerRef.current = null;
    infoRef.current?.close();
  };

  useEffect(() => {
    if (!appKey || !containerRef.current) return;

    const container = containerRef.current;

    let cancelled = false;

    const ensureKakao = (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
          reject(new Error("no window"));
          return;
        }
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => resolve());
          return;
        }
        const existing = document.querySelector(
          "script[data-kakao-maps-sdk]"
        ) as HTMLScriptElement | null;
        if (existing) {
          const done = () =>
            window.kakao.maps.load(() => resolve());
          if (window.kakao?.maps) {
            done();
            return;
          }
          existing.addEventListener("load", done, { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
        script.async = true;
        script.dataset.kakaoMapsSdk = "true";
        script.onload = () => {
          if (!window.kakao?.maps) {
            reject(new Error("kakao maps failed"));
            return;
          }
          window.kakao.maps.load(() => resolve());
        };
        script.onerror = () => reject(new Error("kakao script load error"));
        document.head.appendChild(script);
      });

    const clampMapCenter = () => {
      const map = mapRef.current;
      const bounds = allowedBoundsRef.current;
      if (!map || !bounds) return;
      const c = map.getCenter();
      if (bounds.contain(c)) return;
      const { lat, lng } = clampLatLng(c.getLat(), c.getLng());
      map.setCenter(new window.kakao.maps.LatLng(lat, lng));
    };

    ensureKakao()
      .then(() => {
        if (cancelled || !container || mapRef.current) return;
        const { kakao } = window;
        const center = new kakao.maps.LatLng(
          GONGJU_CENTER.lat,
          GONGJU_CENTER.lng
        );
        const map = new kakao.maps.Map(container, {
          center,
          level: GONGJU_DEFAULT_LEVEL,
        });
        mapRef.current = map;
        allowedBoundsRef.current = new kakao.maps.LatLngBounds(
          new kakao.maps.LatLng(GONGJU_BOUNDS.sw.lat, GONGJU_BOUNDS.sw.lng),
          new kakao.maps.LatLng(GONGJU_BOUNDS.ne.lat, GONGJU_BOUNDS.ne.lng)
        );
        infoRef.current = new kakao.maps.InfoWindow({
          content: "",
          removable: true,
          zIndex: 2,
        });

        kakao.maps.event.addListener(map, "dragend", clampMapCenter);
        kakao.maps.event.addListener(map, "zoom_changed", clampMapCenter);
        setMapReady(true);
      })
      .catch(() => {
        /* 키 오류 등은 아래 플레이스홀더로 안내 */
      });

    return () => {
      cancelled = true;
      setMapReady(false);
      clearActivePin();
      infoRef.current = null;
      mapRef.current = null;
      allowedBoundsRef.current = null;
      container.innerHTML = "";
    };
  }, [appKey]);

  useEffect(() => {
    const el = containerRef.current;
    const map = mapRef.current;
    if (!mapReady || !el || !map) return;

    const ro = new ResizeObserver(() => {
      map.relayout();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const info = infoRef.current;
    if (!mapReady || !map || !info || !window.kakao?.maps) return;

    if (!focusId) {
      clearActivePin();
      return;
    }

    const r = restaurants.find((x) => x.id === focusId);
    if (!r) {
      clearActivePin();
      return;
    }

    let cancelled = false;
    const { kakao } = window;

    const showAt = (lat: number, lng: number) => {
      if (cancelled) return;
      clearActivePin();
      const position = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ position, map });
      activeMarkerRef.current = marker;
      map.panTo(position);
      info.setContent(buildInfoHtml(r));
      info.open(map, marker);
    };

    const cached = resolveCoord(r, coordsCacheRef.current);
    if (cached) {
      showAt(cached.lat, cached.lng);
      return () => {
        cancelled = true;
      };
    }

    const address = r.address?.trim();
    if (!address || !kakao.maps.services) {
      clearActivePin();
      return () => {
        cancelled = true;
      };
    }

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (cancelled) return;
      if (
        status === kakao.maps.services.Status.OK &&
        result?.[0]
      ) {
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          coordsCacheRef.current.set(r.id, { lat, lng });
          showAt(lat, lng);
          return;
        }
      }
      clearActivePin();
    });

    return () => {
      cancelled = true;
    };
  }, [focusId, mapReady, restaurants]);

  if (!appKey) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/80 p-6 text-center text-stone-700">
        <p className="text-sm font-medium">카카오맵 JavaScript 키가 필요합니다</p>
        <p className="max-w-md text-xs text-stone-600">
          프로젝트 루트에 <code className="rounded bg-white px-1.5 py-0.5">.env.local</code>{" "}
          파일을 만들고{" "}
          <code className="rounded bg-white px-1.5 py-0.5">
            NEXT_PUBLIC_KAKAO_MAP_APP_KEY
          </code>
          를 설정한 뒤 개발 서버를 다시 실행하세요.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full min-h-0 w-full flex-1 rounded-xl border border-stone-200 bg-stone-100 shadow-inner"
      role="presentation"
    />
  );
}
