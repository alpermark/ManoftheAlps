import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const FONT_PATH = path.join(ROOT, "scripts/fonts/CormorantGaramond-Medium.ttf");
const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf";

async function ensureFont() {
  if (fs.existsSync(FONT_PATH)) return;
  fs.mkdirSync(path.dirname(FONT_PATH), { recursive: true });
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`Failed to download font: ${res.status}`);
  fs.writeFileSync(FONT_PATH, Buffer.from(await res.arrayBuffer()));
}

/** Brand tokens from src/styles.css */
const INK = "#26221f"; // oklch(0.16 0.012 60)
const PAPER = "#f3ede6"; // oklch(0.962 0.012 85)

function buildSvg(size, fontBase64) {
  const fontSize = Math.round(size * 0.78);
  const y = Math.round(size * 0.68);

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>
      @font-face {
        font-family: "Cormorant Garamond";
        src: url("data:font/truetype;charset=utf-8;base64,${fontBase64}") format("truetype");
        font-weight: 500;
        font-style: normal;
      }
    </style>
  </defs>
  <rect width="${size}" height="${size}" fill="${INK}"/>
  <text
    x="50%"
    y="${y}"
    text-anchor="middle"
    fill="${PAPER}"
    font-family="Cormorant Garamond, Times New Roman, serif"
    font-size="${fontSize}"
    font-weight="500"
    letter-spacing="${(-0.01 * fontSize).toFixed(1)}"
  >M</text>
</svg>`);
}

async function writePng(svg, outPath, size) {
  await sharp(svg).resize(size, size).png().toFile(outPath);
}

async function writeSvg(outPath, size = 512) {
  const fontSize = Math.round(size * 0.78);
  const y = Math.round(size * 0.68);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&amp;display=swap");
    </style>
  </defs>
  <rect width="${size}" height="${size}" fill="${INK}"/>
  <text
    x="50%"
    y="${y}"
    text-anchor="middle"
    fill="${PAPER}"
    font-family="Cormorant Garamond, Times New Roman, serif"
    font-size="${fontSize}"
    font-weight="500"
    letter-spacing="${(-0.01 * fontSize).toFixed(1)}"
  >M</text>
</svg>`;
  fs.writeFileSync(outPath, svg);
}

async function main() {
  await ensureFont();
  const fontBase64 = fs.readFileSync(FONT_PATH).toString("base64");
  const svg512 = buildSvg(512, fontBase64);

  await writeSvg(path.join(PUBLIC, "favicon.svg"));
  await writePng(svg512, path.join(PUBLIC, "icon-512.png"), 512);
  await writePng(svg512, path.join(PUBLIC, "icon-192.png"), 192);
  await writePng(svg512, path.join(PUBLIC, "apple-touch-icon.png"), 180);
  await writePng(svg512, path.join(PUBLIC, "favicon-32x32.png"), 32);
  await writePng(svg512, path.join(PUBLIC, "favicon-16x16.png"), 16);
  await writePng(svg512, path.join(PUBLIC, "og-image.png"), 1200);

  // Multi-size ICO for legacy browsers / some crawlers.
  const icoSizes = [16, 32, 48];
  const icoImages = await Promise.all(
    icoSizes.map((size) => sharp(svg512).resize(size, size).png().toBuffer()),
  );
  fs.writeFileSync(
    path.join(PUBLIC, "favicon.ico"),
    encodeIco(icoImages, icoSizes),
  );

  console.log("Generated favicons in public/");
}

function encodeIco(images, sizes) {
  const count = images.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const parts = images.map((buf, i) => {
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    return { entry, buf };
  });

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);
  let pos = 6;
  for (const { entry, buf } of parts) {
    entry.copy(out, pos);
    pos += 16;
  }
  for (const { buf } of parts) {
    buf.copy(out, pos);
    pos += buf.length;
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
