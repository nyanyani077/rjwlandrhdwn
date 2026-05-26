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

/** 메뉴 영역에 스크롤 없이 보여 줄 최대 줄 수 */
const INFO_MENU_VISIBLE = 5;

function buildInfoHtml(r: Restaurant): string {
  const category = r.category ?? r.tags?.[0] ?? "";
  const menuCount = r.menus.length;
  const menuScrollable = menuCount > INFO_MENU_VISIBLE;

  const menuListHtml =
    menuCount > 0
      ? `<div class="km-menu-panel${menuScrollable ? " km-menu-panel--scroll" : ""}">
          <p class="km-menu-heading">메뉴</p>
          <ul class="km-menus">${r.menus
            .map(
              (m) =>
                `<li class="km-menu-item"><span class="km-menu-name">${escapeHtml(m.name)}</span><span class="km-menu-price">${escapeHtml(formatPrice(m.price))}</span></li>`
            )
            .join("")}</ul>
          ${
            menuScrollable
              ? `<p class="km-menu-hint">총 ${menuCount}개 · 스크롤하여 더 보기</p>`
              : ""
          }
        </div>`
      : r.menuPreview
        ? `<p class="km-preview rounded-md bg-white/70 px-2 py-1.5 text-xs text-[#5c4033]">
            <span class="font-medium">대표 메뉴</span> · ${escapeHtml(r.menuPreview.name)} ${escapeHtml(formatPrice(r.menuPreview.price))}
          </p>`
        : "";

  return `
    <div class="km-card">
      <p class="km-eyebrow">식당 안내</p>
      <h3 class="km-name">${escapeHtml(r.name)}</h3>
      ${category ? `<p class="km-category">${escapeHtml(category)}</p>` : ""}
      ${r.address ? `<p class="km-text">${escapeHtml(r.address)}</p>` : ""}
      ${r.hours ? `<p class="km-text">영업시간 ${escapeHtml(r.hours)}</p>` : ""}
      ${
        r.affiliationColleges && r.affiliationColleges.length > 0
          ? `<p class="km-aff">제휴업체 · ${escapeHtml(r.affiliationColleges.join(", "))}</p>`
          : ""
      }
      ${r.arNote ? `<p class="km-ar">${escapeHtml(r.arNote)}</p>` : ""}
      ${menuListHtml}
    </div>
    <style>
      .km-card {
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        width: 272px;
        max-width: min(272px, 90vw);
        padding: 14px 16px 16px;
        border-radius: 12px;
        border: 1px solid #d4c9b8;
        background: rgba(250, 246, 240, 0.97);
        box-shadow: 0 4px 14px rgba(60, 48, 36, 0.12);
        color: #3d2f24;
        box-sizing: border-box;
      }
      .km-eyebrow {
        margin: 0 0 4px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #7a6b5c;
      }
      .km-name {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        line-height: 1.35;
        color: #3d2f24;
        word-break: keep-all;
      }
      .km-category {
        margin: 4px 0 0;
        font-size: 12px;
        color: #8a6d4a;
      }
      .km-text {
        margin: 8px 0 0;
        font-size: 12px;
        line-height: 1.45;
        color: rgba(92, 64, 51, 0.85);
        word-break: keep-all;
      }
      .km-aff {
        margin: 6px 0 0;
        font-size: 12px;
        line-height: 1.4;
        color: #0f766e;
      }
      .km-ar {
        margin: 6px 0 0;
        font-size: 11px;
        line-height: 1.45;
        color: rgba(17, 94, 89, 0.9);
      }
      .km-menu-panel {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.72);
        border: 1px solid rgba(212, 201, 184, 0.65);
      }
      .km-menu-panel--scroll .km-menus {
        max-height: 132px;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 4px;
        scrollbar-width: thin;
        scrollbar-color: #c4b8a8 transparent;
      }
      .km-menu-panel--scroll .km-menus::-webkit-scrollbar {
        width: 5px;
      }
      .km-menu-panel--scroll .km-menus::-webkit-scrollbar-thumb {
        border-radius: 9999px;
        background: #c4b8a8;
      }
      .km-menu-heading {
        margin: 0 0 8px;
        font-size: 11px;
        font-weight: 600;
        color: #7a6b5c;
      }
      .km-menus {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .km-menu-item {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 5px 0;
        border-bottom: 1px solid rgba(231, 229, 228, 0.9);
        font-size: 12px;
        line-height: 1.35;
      }
      .km-menu-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .km-menu-name {
        min-width: 0;
        color: #44403c;
        word-break: keep-all;
      }
      .km-menu-price {
        flex-shrink: 0;
        font-weight: 600;
        color: #0d9488;
        white-space: nowrap;
      }
      .km-menu-hint {
        margin: 8px 0 0;
        font-size: 10px;
        text-align: center;
        color: rgba(92, 64, 51, 0.55);
      }
      .km-preview { margin: 10px 0 0; }
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
