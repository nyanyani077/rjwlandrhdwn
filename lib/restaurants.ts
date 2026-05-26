import raw from "@/data/restaurants.json";
import type { Restaurant } from "@/lib/types/restaurant";

/**
 * 음식점 목록 단일 진입점. 이후 API/DB 연동 시 이 함수만 서버 fetch 등으로 교체하면 됩니다.
 */
export function getRestaurants(): Restaurant[] {
  return raw as Restaurant[];
}
