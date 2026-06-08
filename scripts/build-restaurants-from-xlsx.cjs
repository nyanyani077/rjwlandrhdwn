/**
 * 엑셀(1행 헤더 스킵) → data/restaurants.json
 * A: 이름, B: 주소, C: 음식 카테고리, D: 영업시간, E~AP: 메뉴, AQ(42): 제휴 단과, AR(43): 혜택·비고
 *
 * 전체 교체: node scripts/build-restaurants-from-xlsx.cjs "<xlsx경로>"
 * 기존에 추가: node scripts/build-restaurants-from-xlsx.cjs --append "<xlsx경로>"
 * 추가+엑셀에서 빠진 항목 삭제: node scripts/build-restaurants-from-xlsx.cjs --append --sync "<xlsx경로>"
 */
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

/** @type {readonly string[]} lib/affiliation.ts 와 동일하게 유지 */
const AFFILIATION_COLLEGES = [
  "인문사회과학대학",
  "자연과학대학",
  "예술대학",
  "간호보건대학",
  "사범대학",
];

const COL_AQ = 42; // 엑셀 AQ열 (제휴 단과). 메뉴는 E(4)~AP(41)까지만 사용
const COL_AR = 43; // 엑셀 AR열 (혜택·비고)
const MENU_COL_END_EXCLUSIVE = COL_AQ;

const OUT_PATH = path.join(__dirname, "..", "data", "restaurants.json");
const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "data",
  "xlsx-sync-manifest.json"
);

function parseMenuCell(cell) {
  const s = String(cell ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(.+?)\s+([\d,]+)\s*$/);
  if (m) {
    return { name: m[1].trim(), price: m[2].replace(/,/g, "") };
  }
  return { name: s, price: "" };
}

/** AQ 원문 → 공식 단과명만 추출·정렬 */
function parseAffiliationAq(aqRaw) {
  if (!aqRaw || !String(aqRaw).trim()) return undefined;
  const parts = String(aqRaw)
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const hit = AFFILIATION_COLLEGES.find((c) => c === p);
    if (hit && !seen.has(hit)) {
      seen.add(hit);
      out.push(hit);
    }
  }
  out.sort(
    (a, b) => AFFILIATION_COLLEGES.indexOf(a) - AFFILIATION_COLLEGES.indexOf(b)
  );
  return out.length ? out : undefined;
}

function parseRestaurantsFromRows(rows, idStart = 1) {
  const out = [];
  /** @type {any} */
  let current = null;
  let nextId = idStart;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[0] ?? "").trim();
    const address = String(row[1] ?? "").trim();
    const category = String(row[2] ?? "").trim();
    const hours = String(row[3] ?? "").trim();
    const aqCell = row[COL_AQ];
    const arRaw = String(row[COL_AR] ?? "").trim();

    const rowMenus = [];
    const menuEnd = Math.min(row.length, MENU_COL_END_EXCLUSIVE);
    for (let c = 4; c < menuEnd; c++) {
      const item = parseMenuCell(row[c]);
      if (item) rowMenus.push(item);
    }

    if (name) {
      const menuPreview = parseMenuCell(row[4]) ?? undefined;
      const affiliationColleges = parseAffiliationAq(aqCell);
      const arNote = arRaw || undefined;
      current = {
        id: `r-${nextId++}`,
        name,
        address: address || undefined,
        category: category || undefined,
        hours: hours || undefined,
        menus: rowMenus,
        menuPreview,
        affiliationColleges,
        arNote,
        tags: category ? [category] : undefined,
      };
      out.push(current);
    } else if (current && rowMenus.length > 0) {
      current.menus.push(...rowMenus);
    }
  }

  return out;
}

function maxRestaurantIdNum(restaurants) {
  let max = 0;
  for (const r of restaurants) {
    const m = /^r-(\d+)$/.exec(r.id ?? "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

function mergeRestaurant(existing, incoming) {
  return {
    ...existing,
    address: incoming.address ?? existing.address,
    category: incoming.category ?? existing.category,
    hours: incoming.hours ?? existing.hours,
    menus: incoming.menus.length > 0 ? incoming.menus : existing.menus,
    menuPreview: incoming.menuPreview ?? existing.menuPreview,
    affiliationColleges:
      incoming.affiliationColleges ?? existing.affiliationColleges,
    arNote: incoming.arNote ?? existing.arNote,
    tags: incoming.tags ?? existing.tags,
  };
}

function appendRestaurants(existing, incoming) {
  const byName = new Map(existing.map((r) => [r.name, r]));
  let nextId = maxRestaurantIdNum(existing) + 1;
  let added = 0;
  let updated = 0;
  const addedNames = [];

  for (const restaurant of incoming) {
    const hit = byName.get(restaurant.name);
    if (hit) {
      const merged = mergeRestaurant(hit, restaurant);
      const idx = existing.findIndex((r) => r.id === hit.id);
      existing[idx] = merged;
      byName.set(restaurant.name, merged);
      updated += 1;
      continue;
    }

    const entry = { ...restaurant, id: `r-${nextId++}` };
    existing.push(entry);
    byName.set(restaurant.name, entry);
    addedNames.push(restaurant.name);
    added += 1;
  }

  return { restaurants: existing, added, updated, addedNames };
}

function restaurantNamesFromRows(rows) {
  const names = [];
  for (let i = 1; i < rows.length; i++) {
    const name = String(rows[i][0] ?? "").trim();
    if (name) names.push(name);
  }
  return names;
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
}

function syncRemoved(existing, xlsxKey, newNames, manifest) {
  const entry = manifest[xlsxKey] ?? { addedNames: [] };
  const removedNames = entry.addedNames.filter((n) => !newNames.includes(n));
  if (removedNames.length === 0) {
    return { restaurants: existing, removed: 0, removedNames: [] };
  }
  const removeSet = new Set(removedNames);
  return {
    restaurants: existing.filter((r) => !removeSet.has(r.name)),
    removed: removedNames.length,
    removedNames,
  };
}

function parseArgs(argv) {
  const flags = new Set(["--append", "--sync"]);
  const append = argv.includes("--append");
  const sync = argv.includes("--sync");
  const xlsxPath = argv.find((a) => !flags.has(a));
  return { append, sync, xlsxPath };
}

function main() {
  const { append, sync, xlsxPath: argPath } = parseArgs(process.argv.slice(2));
  const xlsxPath =
    argPath ||
    path.join(
      "C:",
      "Users",
      "tmddu",
      "OneDrive",
      "Documents",
      "카카오톡 받은 파일",
      "거지와공주_식당_2차.xlsx"
    );

  if (!fs.existsSync(xlsxPath)) {
    console.error("파일 없음:", xlsxPath);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const xlsxKey = path.basename(xlsxPath);

  let out;
  if (append) {
    let existing = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
    const newNames = restaurantNamesFromRows(rows);
    const manifest = loadManifest();

    if (sync) {
      const syncResult = syncRemoved(existing, xlsxKey, newNames, manifest);
      existing = syncResult.restaurants;
      if (syncResult.removed > 0) {
        console.log("삭제:", syncResult.removed, "건 —", syncResult.removedNames.join(", "));
      }
    }

    const incoming = parseRestaurantsFromRows(rows);
    const result = appendRestaurants(existing, incoming);
    out = result.restaurants;

    const entry = manifest[xlsxKey] ?? { addedNames: [] };
    const keptAdded = entry.addedNames.filter((n) => newNames.includes(n));
    entry.addedNames = [...new Set([...keptAdded, ...result.addedNames])];
    manifest[xlsxKey] = entry;
    saveManifest(manifest);

    console.log(
      "추가:",
      result.added,
      "건, 갱신:",
      result.updated,
      "건 → 총",
      out.length,
      "건"
    );
  } else {
    out = parseRestaurantsFromRows(rows);
    console.log("저장:", OUT_PATH, "건수:", out.length);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log("저장:", OUT_PATH);
}

main();
