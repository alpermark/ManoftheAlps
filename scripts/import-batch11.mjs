import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS =
  "/Users/markalper/.cursor/projects/Users-markalper-Documents-GitHub-ManoftheAlps/assets";
const OUT = path.join(ROOT, "src/assets/batch11");

const FULL_MAX = 2000;
const THUMB_MAX = 600;
const FULL_QUALITY = 82;
const THUMB_QUALITY = 78;

const PHOTOS = [
  {
    src: "IMG_0939-1afdf840-b4dd-4cd5-be3d-a3686fa8ec9d.png",
    title: "Suite Breakfast Hour",
  },
  {
    src: "0CF1B63C-FFC4-4983-84F7-AA9C009F220F-19d0a3f5-6655-4ba4-9131-7cf92e34be55.png",
    title: "Coastal Tower at Dusk",
  },
  {
    src: "Enlight180-e5620c6b-01c3-45aa-b212-b94ad212bbfc.png",
    title: "Macaw on Shoulder",
  },
  {
    src: "Enlight215-de0ba926-3f51-42a5-a554-cbf176dd7eed.png",
    title: "House at Forest Edge",
  },
  {
    src: "Enlight216-16feea7f-3d81-4fa2-82b4-075a5c4d3028.png",
    title: "Golden Mist Over Pines",
  },
  {
    src: "Enlight212-5a304c41-7fe9-410f-be5a-d9ae79f54aad.png",
    title: "Barn and Tractor",
    tone: "bw",
  },
  {
    src: "Enlight146-7500f61a-8a7f-4fbd-aa9b-e0bb93abb2f0.png",
    title: "Steel Tower, Power Lines",
  },
  {
    src: "IMG_8993-e2343fca-d917-41fe-b7e4-2b8791f02930.png",
    title: "Gourmet Shop Window",
  },
];

function resizeLongEdge(pipeline, max) {
  return pipeline.resize({
    width: max,
    height: max,
    fit: "inside",
    withoutEnlargement: true,
  });
}

async function processOne(inputPath, fullOut, thumbOut) {
  const fullBuf = await resizeLongEdge(sharp(inputPath), FULL_MAX)
    .webp({ quality: FULL_QUALITY, effort: 4 })
    .toBuffer();

  const fullMeta = await sharp(fullBuf).metadata();

  await fs.promises.writeFile(fullOut, fullBuf);

  await resizeLongEdge(sharp(fullBuf), THUMB_MAX)
    .webp({ quality: THUMB_QUALITY, effort: 4 })
    .toFile(thumbOut);

  return { width: fullMeta.width, height: fullMeta.height };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const meta = {};

  for (let i = 0; i < PHOTOS.length; i++) {
    const n = String(i + 1).padStart(2, "0");
    const { src, title, tone } = PHOTOS[i];
    const input = path.join(ASSETS, src);
    const file = `p${n}.webp`;
    const fullOut = path.join(OUT, file);
    const thumbOut = path.join(OUT, `p${n}.thumb.webp`);

    const dims = await processOne(input, fullOut, thumbOut);
    meta[file] = {
      title,
      width: dims.width,
      height: dims.height,
      ...(tone ? { tone } : {}),
    };

    const fullSz = fs.statSync(fullOut).size;
    const thumbSz = fs.statSync(thumbOut).size;
    console.log(
      `${file}: ${dims.width}x${dims.height} full=${fullSz} thumb=${thumbSz}`,
    );
  }

  fs.writeFileSync(
    path.join(OUT, "meta.json"),
    JSON.stringify(meta, null, 2) + "\n",
  );
  console.log(`\nWrote ${PHOTOS.length} photos to batch11/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
