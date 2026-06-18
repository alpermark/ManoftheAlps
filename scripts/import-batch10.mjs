import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS =
  "/Users/markalper/.cursor/projects/Users-markalper-Documents-GitHub-ManoftheAlps/assets";
const OUT = path.join(ROOT, "src/assets/batch10");

const FULL_MAX = 2000;
const THUMB_MAX = 600;
const FULL_QUALITY = 82;
const THUMB_QUALITY = 78;

const PHOTOS = [
  {
    src: "Enlight1_6-60e76a67-cd3b-48c0-9361-c226d09f11ac.png",
    title: "Bridge-Framed Skyline",
  },
  {
    src: "IMG_3842-1bb2158e-a0ad-43ad-ab04-3de3386842f0.png",
    title: "Seated Figure on Balcony",
  },
  {
    src: "IMG_4102-dbdf5d71-688b-40c3-9ea6-e4d7a142819d.png",
    title: "White Spiral Ascent",
  },
  {
    src: "IMG_3847-24746259-aa1d-41e2-8b9e-c197e6c555e2.png",
    title: "Bound Hands, Patterned Wall",
  },
  {
    src: "Enlight1_5-d2681d7e-ad80-4d0a-b642-b6545f4e6be6.png",
    title: "NYPD Cluster",
    tone: "bw",
  },
  {
    src: "IMG_5994-6ae4b5d6-a584-443d-92c0-295f68d2a1d2.png",
    title: "Glass Grid Facade",
  },
  {
    src: "Enlight21-13db15ab-4c53-4ba8-801a-41421100019d.png",
    title: "Gate of Green Beyond",
  },
  {
    src: "Enlight1_4-cfc4713f-e494-47d5-a0c5-506d676af589.png",
    title: "Brick Facade, Bare Trees",
  },
  {
    src: "Enlight1-79237368-2f09-4dff-a161-7769d64cd32b.png",
    title: "Valley Mirror",
  },
  {
    src: "Enlight1_7-98cc792c-8de0-4719-bc80-f7704237e2ae.png",
    title: "Night Dog Walk",
    tone: "bw",
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
  console.log(`\nWrote ${PHOTOS.length} photos to batch10/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
