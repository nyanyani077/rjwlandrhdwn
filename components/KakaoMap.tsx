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

function buildInfoHtml(r: Restaurant): string {
  const menus = r.menus
    .map(
      (m) =>
        `<li class="km-menu-item"><span class="km-menu-name">${escapeHtml(m.name)}</span><span class="km-menu-price">${escapeHtml(formatPrice(m.price))}</span></li>`
    )
    .join("");
  const tagLabels =
    r.tags && r.tags.length > 0
      ? r.tags
      : r.category
        ? [r.category]
        : [];
  const tagBlock =
    tagLabels.length > 0
      ? `<div class="km-tags">${tagLabels.map((t) => `<span class="km-tag">${escapeHtml(t)}</span>`).join("")}</div>`
      : "";
  const affBlock =
    r.affiliationColleges && r.affiliationColleges.length > 0
      ? `<p class="km-aff"><span class="km-aff-label">제휴업체</span> · ${r.affiliationColleges.map((c) => escapeHtml(c)).join(", ")}</p>`
      : "";
  const arBlock = r.arNote
    ? `<p class="km-ar">${escapeHtml(r.arNote)}</p>`
    : "";
  return `
    <div class="km-iw">
      <strong class="km-title">${escapeHtml(r.name)}</strong>
      ${r.address ? `<p class="km-addr">${escapeHtml(r.address)}</p>` : ""}
      ${tagBlock}
      ${affBlock}
      ${arBlock}
      ${r.hours ? `<p class="km-hours">영업시간 · ${escapeHtml(r.hours)}</p>` : ""}
      <ul class="km-menus">${menus}</ul>
    </div>
    <style>
      .km-iw { font-family: system-ui, sans-serif; padding: 4px 2px; min-width: 200px; max-width: 280px; max-height: 320px; overflow-y: auto; }
      .km-title { font-size: 15px; display: block; margin-bottom: 4px; color: #1c1917; }
      .km-addr { font-size: 12px; color: #78716c; margin: 0 0 6px; }
      .km-hours { font-size: 11px; color: #57534e; margin: 0 0 6px; line-height: 1.35; }
      .km-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
      .km-tag { font-size: 11px; background: #fff7ed; color: #9a3412; padding: 2px 8px; border-radius: 9999px; }
      .km-aff { font-size: 12px; color: #0f766e; margin: 0 0 6px; line-height: 1.35; }
      .km-aff-label { font-weight: 600; }
      .km-ar { font-size: 11px; color: #115e59; margin: 0 0 6px; line-height: 1.45; }
      .km-menus { list-style: none; margin: 0; padding: 0; }
      .km-menu-item { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; padding: 4px 0; border-top: 1px solid #e7e5e4; }
      .km-menu-name { color: #44403c; }
      .km-menu-price { color: #0d9488; font-weight: 600; white-space: nowrap; }
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
  const markersRef = useRef<{ id: string; marker: KakaoMarkerHandle }[]>([]);
  const markerByIdRef = useRef<Map<string, KakaoMarkerHandle>>(new Map());
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
  const [coordsEpoch, setCoordsEpoch] = useState(0);

  useEffect(() => {
    if (!appKey || !containerRef.current) return;

    const container = containerRef.current;
    const markerByIdForCleanup = markerByIdRef.current;

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
        infoRef.current = new kakao.maps.InfoWindow({ content: "" });

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
      const markersSnapshot = [...markersRef.current];
      markersSnapshot.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
      markerByIdForCleanup.clear();
      infoRef.current?.close();
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
    if (!mapReady || !window.kakao?.maps?.services) return;

    let cancelled = false;
    const { kakao } = window;
    const geocoder = new kakao.maps.services.Geocoder();

    for (const r of restaurants) {
      if (typeof r.lat === "number" && typeof r.lng === "number") {
        coordsCacheRef.current.set(r.id, { lat: r.lat, lng: r.lng });
      }
    }

    const need = restaurants.filter((r) => {
      if (coordsCacheRef.current.has(r.id)) return false;
      return Boolean(r.address?.trim());
    });

    if (need.length === 0) {
      const tid = window.setTimeout(() => setCoordsEpoch((e) => e + 1), 0);
      return () => {
        cancelled = true;
        window.clearTimeout(tid);
      };
    }

    const CONCURRENCY = 5;
    const queue = [...need];

    const worker = async () => {
      while (!cancelled && queue.length > 0) {
        const r = queue.shift();
        if (!r?.address) continue;
        await new Promise<void>((resolve) => {
          geocoder.addressSearch(r.address!, (result, status) => {
            if (
              !cancelled &&
              status === kakao.maps.services.Status.OK &&
              result?.[0]
            ) {
              const lat = parseFloat(result[0].y);
              const lng = parseFloat(result[0].x);
              if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                coordsCacheRef.current.set(r.id, { lat, lng });
              }
            }
            resolve();
          });
        });
      }
    };

    void Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, need.length) }, () =>
        worker()
      )
    ).then(() => {
      if (!cancelled) setCoordsEpoch((e) => e + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [mapReady, restaurants]);

  useEffect(() => {
    const map = mapRef.current;
    const info = infoRef.current;
    if (!mapReady || !map || !info || !window.kakao?.maps) return;

    const markerByIdMap = markerByIdRef.current;

    const { kakao } = window;
    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];
    markerByIdMap.clear();
    info.close();

    const openFor = (r: Restaurant, marker: KakaoMarkerHandle) => {
      info.setContent(buildInfoHtml(r));
      info.open(map, marker);
    };

    const resolveCoord = (
      r: Restaurant
    ): { lat: number; lng: number } | null => {
      const hit = coordsCacheRef.current.get(r.id);
      if (hit) return hit;
      if (typeof r.lat === "number" && typeof r.lng === "number") {
        return { lat: r.lat, lng: r.lng };
      }
      return null;
    };

    for (const r of restaurants) {
      const pos = resolveCoord(r);
      if (!pos) continue;
      const position = new kakao.maps.LatLng(pos.lat, pos.lng);
      const marker = new kakao.maps.Marker({ position, map });
      kakao.maps.event.addListener(marker, "click", () => openFor(r, marker));
      markersRef.current.push({ id: r.id, marker });
      markerByIdMap.set(r.id, marker);
    }

    return () => {
      const markersSnapshot = [...markersRef.current];
      markersSnapshot.forEach(({ marker }) => marker.setMap(null));
      markersRef.current = [];
      markerByIdMap.clear();
      info.close();
    };
  }, [restaurants, mapReady, coordsEpoch]);

  useEffect(() => {
    const map = mapRef.current;
    const info = infoRef.current;
    if (!mapReady || !map || !info || !focusId || !window.kakao?.maps) return;
    const marker = markerByIdRef.current.get(focusId);
    const r = restaurants.find((x) => x.id === focusId);
    if (!marker || !r) return;
    map.panTo(marker.getPosition());
    info.setContent(buildInfoHtml(r));
    info.open(map, marker);
  }, [focusId, mapReady, restaurants, coordsEpoch]);

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
