/**
 * 엑셀(1행 헤더 스킵) → data/restaurants.json
 * A: 이름, B: 주소, C: 음식 카테고리, D: 영업시간, E~AP: 메뉴, AQ(42): 제휴 단과, AR(43): 혜택·비고
 * 사용: node scripts/build-restaurants-from-xlsx.cjs "<xlsx경로>"
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

function main() {
  const argPath = process.argv[2];
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

  const out = [];
  /** @type {any} */
  let current = null;

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
        id: `r-${i}`,
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

  const outPath = path.join(__dirname, "..", "data", "restaurants.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("저장:", outPath, "건수:", out.length);
}

main();
