/**
 * 배너 PNG의 투명 영역을 흰색 불투명 픽셀로 변환합니다.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const input = path.join(__dirname, "../public/banner.png");
const temp = path.join(__dirname, "../public/banner.white.png");

async function main() {
  await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png({ compressionLevel: 9 })
    .toFile(temp);

  fs.renameSync(temp, input);

  const meta = await sharp(input).metadata();
  console.log(
    `Wrote ${input} (${meta.width}x${meta.height}, hasAlpha=${meta.hasAlpha})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
