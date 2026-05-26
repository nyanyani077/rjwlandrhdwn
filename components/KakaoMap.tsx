"use client";

import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "@/lib/types/restaurant";
import { GONGJU_BOUNDS, GONGJU_CENTER, GONGJU_DEFAULT_LEVEL } from "@/lib/gongju";

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
    if (!mapReady || !map || !window.kakao?.maps) return;

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

    const showPinAt = (lat: number, lng: number) => {
      if (cancelled) return;
      clearActivePin();
      const position = new kakao.maps.LatLng(lat, lng);
      activeMarkerRef.current = new kakao.maps.Marker({ position, map });
      map.panTo(position);
    };

    const cached = resolveCoord(r, coordsCacheRef.current);
    if (cached) {
      showPinAt(cached.lat, cached.lng);
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
          showPinAt(lat, lng);
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
