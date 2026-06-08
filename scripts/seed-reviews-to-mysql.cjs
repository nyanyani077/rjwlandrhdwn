/**
 * data/reviews.json → MySQL reviews 테이블 (기존 id는 건너뜀)
 * 사용: npm run db:seed
 */
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, "..", "data", "reviews.json");
  if (!fs.existsSync(jsonPath)) {
    console.log("reviews.json 없음 — 건너뜀");
    return;
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  if (!Array.isArray(raw) || raw.length === 0) {
    console.log("이전할 리뷰 없음");
    return;
  }

  let inserted = 0;
  let skipped = 0;

  for (const item of raw) {
    if (
      !item?.id ||
      !item?.restaurantId ||
      typeof item.rating !== "number" ||
      !item.text ||
      !item.authorName ||
      !item.createdAt
    ) {
      skipped += 1;
      continue;
    }

    const exists = await prisma.review.findUnique({ where: { id: item.id } });
    if (exists) {
      skipped += 1;
      continue;
    }

    await prisma.review.create({
      data: {
        id: item.id,
        restaurantId: item.restaurantId,
        rating: item.rating,
        text: item.text,
        authorName: item.authorName,
        ownerToken: item.ownerToken ?? null,
        createdAt: new Date(item.createdAt),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      },
    });
    inserted += 1;
  }

  console.log(`시드 완료: 추가 ${inserted}건, 건너뜀 ${skipped}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
