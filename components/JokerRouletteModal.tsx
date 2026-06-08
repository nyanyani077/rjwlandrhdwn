"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AFFILIATION_PARENT } from "@/lib/affiliation";
import {
  JOKER_ROULETTE_LABELS,
  type JokerRouletteLabel,
} from "@/lib/jokerRouletteLabels";
import {
  pickRandomRestaurant,
  restaurantsByCategory,
} from "@/lib/pickRandomRestaurant";
import type { Restaurant } from "@/lib/types/restaurant";

const SEGMENTS = JOKER_ROULETTE_LABELS.length;
const DEG = 360 / SEGMENTS;

const WHEEL_COLORS = [
  "#f5a8a8",
  "#d4b8f0",
  "#a8d4f5",
  "#b8e8a8",
  "#f5e6a8",
  "#f5c896",
] as const;

const WHEEL_RIM = "#5c4033";
const WHEEL_RIM_LIGHT = "#6b4c3a";

const WHEEL_PX = 256;
const LABEL_RADIUS_PX = WHEEL_PX * 0.31;

function formatMenuPrice(price: string): string {
  const p = price.trim();
  if (!p) return "";
  return /^\d+$/.test(p) ? `${p}원` : p;
}

type Props = {
  open: boolean;
  onClose: () => void;
  restaurants: Restaurant[];
};

export function JokerRouletteModal({ open, onClose, restaurants }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const rotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<JokerRouletteLabel | null>(null);
  const [picked, setPicked] = useState<Restaurant | null>(null);

  const resetWheel = useCallback(() => {
    rotationRef.current = 0;
    setRotation(0);
    setSpinning(false);
    setResult(null);
    setPicked(null);
  }, []);

  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => {
        resetWheel();
      }, 0);
      return () => window.clearTimeout(id);
    }
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, resetWheel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !spinning) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, spinning]);

  const spin = () => {
    if (spinning) return;
    const w = Math.floor(Math.random() * SEGMENTS);
    const label = JOKER_ROULETTE_LABELS[w];
    const fullSpins = 5 + Math.floor(Math.random() * 4);
    const prev = rotationRef.current;
    const phi = w * DEG + DEG / 2;
    const align = ((-(phi + prev) % 360) + 360) % 360;
    const next = prev + fullSpins * 360 + align;
    rotationRef.current = next;
    setResult(null);
    setPicked(null);
    setSpinning(true);
    setRotation(next);
    window.setTimeout(() => {
      setSpinning(false);
      setResult(label);
      const pool = restaurantsByCategory(restaurants, label);
      setPicked(pickRandomRestaurant(pool));
    }, 4200);
  };

  if (!open) return null;

  const stops = JOKER_ROULETTE_LABELS.map(
    (_, i) =>
      `${WHEEL_COLORS[i]} ${i * DEG}deg ${(i + 1) * DEG}deg`
  ).join(", ");

  const showPick = Boolean(result && !spinning);
  const categoryCount =
    result != null ? restaurantsByCategory(restaurants, result).length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#c4b8a8]/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !spinning) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-fit max-w-[calc(100vw-2rem)] rounded-2xl border border-[#d4c9b8] bg-[#ede8dc] p-6 shadow-xl"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 120% 100% at 50% 0%, #f5f0e6 0%, #ede8dc 45%, #e5dcc8 100%)",
        }}
      >
        <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-start gap-1">
          <div aria-hidden className="col-start-1" />
          <div className="col-start-2 text-center">
            <h2
              id={titleId}
              className="text-lg font-semibold text-[#3d2f24]"
            >
              오늘의 사료
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => !spinning && onClose()}
            disabled={spinning}
            className="col-start-3 justify-self-end rounded-lg px-2 py-1 text-sm text-[#5c4033]/70 hover:bg-black/5 hover:text-[#5c4033] disabled:opacity-40"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div
          className={`mt-7 flex w-full gap-6 ${
            showPick
              ? "flex-row items-center justify-center"
              : "flex-col items-center"
          }`}
        >
          <div className="relative h-64 w-64 shrink-0">
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[calc(100%-2px)]">
              <svg
                width="36"
                height="22"
                viewBox="0 0 36 22"
                className="drop-shadow-sm"
                aria-hidden
              >
                <path
                  d="M4 2 L18 20 L32 2 Q18 8 4 2 Z"
                  fill={WHEEL_RIM}
                  stroke={WHEEL_RIM_LIGHT}
                  strokeWidth="1"
                />
              </svg>
            </div>

            <div className="absolute inset-0">
              <div
                className="absolute inset-0 origin-center rounded-full shadow-md ring-[3px] ring-[#5c4033]"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 4s cubic-bezier(0.15, 0.85, 0.2, 1)"
                    : "none",
                  background: `conic-gradient(from 0deg at 50% 50%, ${stops})`,
                }}
              >
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  aria-hidden
                >
                  {Array.from({ length: SEGMENTS }, (_, i) => {
                    const α = (i * DEG * Math.PI) / 180;
                    const x2 = 50 + 50 * Math.sin(α);
                    const y2 = 50 - 50 * Math.cos(α);
                    return (
                      <line
                        key={`line-${i}`}
                        x1="50"
                        y1="50"
                        x2={x2}
                        y2={y2}
                        stroke={WHEEL_RIM}
                        strokeWidth="0.85"
                      />
                    );
                  })}
                </svg>

                {JOKER_ROULETTE_LABELS.map((label, i) => {
                  const midDeg = i * DEG + DEG / 2;
                  const rad = (midDeg * Math.PI) / 180;
                  const tx = LABEL_RADIUS_PX * Math.sin(rad);
                  const ty = -LABEL_RADIUS_PX * Math.cos(rad);
                  return (
                    <div
                      key={label}
                      className="pointer-events-none absolute left-1/2 top-1/2 flex max-w-[42%] items-center justify-center"
                      style={{
                        transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
                      }}
                    >
                      <span
                        className="max-w-full truncate rounded-md bg-white px-2 py-1 text-center text-[10px] font-semibold leading-tight text-[#8a8278] shadow-sm ring-1 ring-[#d4cfc4]"
                        title={label}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}

                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#4a3428] bg-[#5c4033] shadow-inner"
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {showPick && result && (
            <aside
              className="w-[17rem] shrink-0 border-l border-[#d4c9b8]/80 pl-6"
              aria-live="polite"
            >
              <p className="text-base font-semibold text-[#5c4033]">
                오늘의 사료는{" "}
                <span className="text-[#3d2f24]">{result}</span>
              </p>

              {picked ? (
                <div className="mt-4 rounded-xl border border-[#d4c9b8] bg-[#faf6f0]/90 p-4 shadow-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#7a6b5c]">
                    오늘의 추천 식당
                  </p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug text-[#3d2f24]">
                    {picked.name}
                  </h3>
                  {(picked.category ?? picked.tags?.[0]) && (
                    <p className="mt-1 text-xs text-[#8a6d4a]">
                      {picked.category ?? picked.tags?.[0]}
                    </p>
                  )}
                  {picked.address && (
                    <p className="mt-2 text-xs leading-relaxed text-[#5c4033]/85">
                      {picked.address}
                    </p>
                  )}
                  {picked.hours && (
                    <p className="mt-1.5 text-xs text-[#5c4033]/75">
                      영업시간 {picked.hours}
                    </p>
                  )}
                  {picked.affiliationColleges &&
                    picked.affiliationColleges.length > 0 && (
                      <p className="mt-1.5 text-xs text-teal-800">
                        {AFFILIATION_PARENT} ·{" "}
                        {picked.affiliationColleges.join(", ")}
                      </p>
                    )}
                  {picked.arNote && (
                    <p className="mt-1.5 text-xs leading-snug text-teal-900/90">
                      {picked.arNote}
                    </p>
                  )}
                  {picked.menuPreview && (
                    <p className="mt-2 rounded-md bg-white/70 px-2 py-1.5 text-xs text-[#5c4033]">
                      <span className="font-medium">대표 메뉴</span> ·{" "}
                      {picked.menuPreview.name}{" "}
                      {formatMenuPrice(picked.menuPreview.price)}
                    </p>
                  )}
                  <p className="mt-3 text-[10px] text-[#5c4033]/60">
                    {result} 카테고리 {categoryCount}곳 중 무작위 추천
                  </p>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-[#d4c9b8] bg-[#faf6f0]/60 px-4 py-6 text-center text-sm text-[#5c4033]/80">
                  {result} 카테고리에 등록된 식당이 없어요.
                  <br />
                  다른 사료를 뽑아 보세요!
                </p>
              )}
            </aside>
          )}
        </div>

        <div className="mt-6 min-h-[3rem] text-center">
          {spinning && (
            <p className="text-sm text-[#5c4033]/70">돌아가는 중…</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="flex-1 rounded-xl border-2 border-[#5c4033] bg-[#7a5c45] py-3 text-sm font-semibold text-[#faf6f0] shadow-sm transition-colors hover:bg-[#6b4f3c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {spinning ? "돌리는 중" : showPick ? "다시 돌리기" : "돌리기"}
          </button>
          <button
            type="button"
            onClick={() => !spinning && onClose()}
            disabled={spinning}
            className="rounded-xl border-2 border-[#c4b8a8] bg-[#f5f0e8] px-4 py-3 text-sm font-medium text-[#5c4033] hover:bg-[#ebe4d8] disabled:opacity-40"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
