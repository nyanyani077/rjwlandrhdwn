/**
 * 배너 PNG: 가장자리와 연결된 검은 배경만 투명 처리 (캐릭터 윤곽선 유지).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const input = path.join(__dirname, "../public/banner.png");
const temp = path.join(__dirname, "../public/banner.transparent.png");

const BLACK_THRESHOLD = 40;

function isBackgroundBlack(r, g, b) {
  return r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD;
}

async function main() {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error(`Expected RGBA, got ${channels} channels`);
  }

  const visited = new Uint8Array(width * height);
  const queue = [];

  const pushIfBg = (x, y) => {
    const idx = (y * width + x) * 4;
    if (!isBackgroundBlack(data[idx], data[idx + 1], data[idx + 2])) return;
    const vi = y * width + x;
    if (visited[vi]) return;
    visited[vi] = 1;
    queue.push(vi);
  };

  for (let x = 0; x < width; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIfBg(0, y);
    pushIfBg(width - 1, y);
  }

  while (queue.length > 0) {
    const vi = queue.pop();
    const x = vi % width;
    const y = (vi - x) / width;
    const idx = vi * 4;
    data[idx + 3] = 0;

    if (x > 0) pushIfBg(x - 1, y);
    if (x < width - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < height - 1) pushIfBg(x, y + 1);
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
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
