/**
 * 새 배너 에셋을 public에 설치합니다 (투명 → 흰색 합성).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const assetName =
  "c__Users_tmddu_AppData_Roaming_Cursor_User_workspaceStorage_573d334c1978f700185f72157c2b221d_images_________-0a509724-a4e1-49c0-842b-fe091c45e760.png";

const candidates = [
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-vibe-coding-map/assets",
    assetName
  ),
  path.join(__dirname, "../assets", assetName),
];

const input = candidates.find((p) => fs.existsSync(p)) ?? null;

if (!input) {
  console.error("Source banner asset not found");
  process.exit(1);
}

const output = path.join(__dirname, "../public/banner-hero.png");

async function main() {
  await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(output);

  const meta = await sharp(output).metadata();
  console.log(`Installed ${output} (${meta.width}x${meta.height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
