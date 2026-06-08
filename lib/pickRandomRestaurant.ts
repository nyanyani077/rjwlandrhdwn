import type { Restaurant } from "@/lib/types/restaurant";

export function restaurantsByCategory(
  list: Restaurant[],
  foodCategory: string
): Restaurant[] {
  return list.filter(
    (r) => (r.category ?? r.tags?.[0] ?? "") === foodCategory
  );
}

export function pickRandomRestaurant(
  list: Restaurant[]
): Restaurant | null {
  if (list.length === 0) return null;
  const i = Math.floor(Math.random() * list.length);
  return list[i] ?? null;
}
