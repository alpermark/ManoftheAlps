/**
 * Remove perceptual duplicates from the gallery (dHash hamming distance ≤ threshold).
 *
 * Usage:
 *   node scripts/dedupe-gallery.mjs --dry-run
 *   node scripts/dedupe-gallery.mjs --apply
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS = path.join(ROOT, "src/assets");
const PHOTOS_TS = path.join(ROOT, "src/lib/photos.ts");

const HASH_SIZE = 16;
const DUPLICATE_THRESHOLD = 8;

const apply = process.argv.includes("--apply");
const dryRun = process.argv.includes("--dry-run") || !apply;

if (!dryRun && !apply) {
  console.error("Pass --dry-run or --apply");
  process.exit(1);
}

async function dHash(input) {
  const { data, info } = await sharp(input)
    .greyscale()
    .resize(HASH_SIZE + 1, HASH_SIZE, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let hash = 0n;
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      const left = data[y * info.width + x];
      const right = data[y * info.width + x + 1];
      if (left > right) hash = (hash << 1n) | 1n;
      else hash <<= 1n;
    }
  }
  return hash;
}

function hamming(a, b) {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

function batchOrder(batch) {
  const m = batch.match(/^batch(\d+)$/);
  return m ? Number(m[1]) : 9999;
}

function photoId(batch, file) {
  const stem = file.replace(/\.[^.]+$/, "");
  return `${batch}-${stem}`;
}

function hasProperTitle(title) {
  if (!title || typeof title !== "string") return false;
  if (/^Untitled \d+$/i.test(title)) return false;
  if (/^p\d+$/i.test(title)) return false;
  return true;
}

function loadPinnedIds() {
  const src = fs.readFileSync(PHOTOS_TS, "utf8");
  const ids = new Set();

  const featured = src.match(/FEATURED_FIRST\s*=\s*\[([\s\S]*?)\]/);
  if (featured) {
    for (const m of featured[1].matchAll(/"([^"]+)"/g)) ids.add(m[1]);
  }
  for (const m of src.matchAll(
    /(?:swapById|moveToIndex)\([^,]+,\s*"([^"]+)"/g,
  )) {
    ids.add(m[1]);
  }

  return ids;
}

function loadMeta(batchDir) {
  const metaPath = path.join(batchDir, "meta.json");
  if (!fs.existsSync(metaPath)) return { metaPath, meta: {} };
  return {
    metaPath,
    meta: JSON.parse(fs.readFileSync(metaPath, "utf8")),
  };
}

function getTitle(batchDir, file, meta) {
  return meta[file]?.title ?? null;
}

class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }

  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[rb] = ra;
  }
}

function clusterPairwiseMaxDistance(indices, hashes) {
  let max = 0;
  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      max = Math.max(max, hamming(hashes[indices[i]], hashes[indices[j]]));
    }
  }
  return max;
}

function pickKeeper(members, pinnedIds, pairwiseMaxDist) {
  const isExactCluster = pairwiseMaxDist === 0;

  const score = (m) => {
    const pinned = pinnedIds.has(m.id) ? 0 : 1;
    const proper = hasProperTitle(m.title) ? 0 : 1;
    const batch = batchOrder(m.batch);
    return { pinned, proper, batch, m };
  };

  if (isExactCluster) {
    const pinned = members.filter((m) => pinnedIds.has(m.id));
    if (pinned.length > 0) {
      return pinned.sort((a, b) => batchOrder(a.batch) - batchOrder(b.batch))[0];
    }
    return members.sort((a, b) => batchOrder(a.batch) - batchOrder(b.batch))[0];
  }

  return members
    .map(score)
    .sort((a, b) => {
      if (a.proper !== b.proper) return a.proper - b.proper;
      if (a.batch !== b.batch) return a.batch - b.batch;
      return a.m.file.localeCompare(b.m.file);
    })[0].m;
}

function bestTitleAmong(members) {
  for (const m of members.sort(
    (a, b) => batchOrder(a.batch) - batchOrder(b.batch),
  )) {
    if (hasProperTitle(m.title)) return m.title;
  }
  return null;
}

async function listGalleryImages() {
  const images = [];
  const batchDirs = fs
    .readdirSync(ASSETS)
    .filter((d) => d.startsWith("batch"))
    .sort();

  for (const batch of batchDirs) {
    const batchDir = path.join(ASSETS, batch);
    const { metaPath, meta } = loadMeta(batchDir);
    const files = fs
      .readdirSync(batchDir)
      .filter((f) => f.endsWith(".webp") && !f.endsWith(".thumb.webp"))
      .sort();

    for (const file of files) {
      const fullPath = path.join(batchDir, file);
      images.push({
        batch,
        file,
        id: photoId(batch, file),
        fullPath,
        thumbPath: path.join(batchDir, file.replace(/\.webp$/, ".thumb.webp")),
        metaPath,
        meta,
        title: getTitle(batchDir, file, meta),
      });
    }
  }

  return images;
}

async function main() {
  console.log(
    apply ? "=== APPLY duplicate cleanup ===" : "=== DRY RUN duplicate cleanup ===",
  );

  const pinnedIds = loadPinnedIds();
  const images = await listGalleryImages();
  console.log(`Scanning ${images.length} gallery images…`);

  const hashes = [];
  for (let i = 0; i < images.length; i++) {
    hashes[i] = await dHash(images[i].fullPath);
    if ((i + 1) % 50 === 0) process.stdout.write(`  hashed ${i + 1}/${images.length}\r`);
  }
  console.log(`  hashed ${images.length}/${images.length}`);

  const uf = new UnionFind(images.length);
  const pairDist = new Map();

  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const d = hamming(hashes[i], hashes[j]);
      if (d <= DUPLICATE_THRESHOLD) {
        uf.union(i, j);
        pairDist.set(`${i},${j}`, d);
      }
    }
  }

  const clusters = new Map();
  for (let i = 0; i < images.length; i++) {
    const root = uf.find(i);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(i);
  }

  const duplicateClusters = [...clusters.values()].filter((c) => c.length > 1);
  console.log(`Found ${duplicateClusters.length} duplicate clusters\n`);

  const toDelete = [];
  const titleMigrations = [];
  const pinRemaps = new Map();
  const metaDirty = new Set();

  for (const indices of duplicateClusters) {
    const members = indices.map((i) => images[i]);
    const maxDist = clusterPairwiseMaxDistance(indices, hashes);
    const keeper = pickKeeper(members, pinnedIds, maxDist);
    const victims = members.filter((m) => m.id !== keeper.id);

    console.log(
      `Cluster (max d=${maxDist}): keeper ${keeper.id}${hasProperTitle(keeper.title) ? ` "${keeper.title}"` : ""}`,
    );
    for (const v of victims) {
      const vIdx = indices[members.indexOf(v)];
      const kIdx = indices[members.indexOf(keeper)];
      const d = pairDist.get(`${Math.min(vIdx, kIdx)},${Math.max(vIdx, kIdx)}`) ?? "?";
      console.log(`  delete ${v.id}${v.title ? ` "${v.title}"` : ""} (d=${d})`);
      toDelete.push(v);

      for (const pinned of pinnedIds) {
        if (pinned === v.id) {
          pinRemaps.set(pinned, keeper.id);
        }
      }
    }

    if (maxDist > 0 && !hasProperTitle(keeper.title)) {
      const title = bestTitleAmong(members);
      if (title) {
        titleMigrations.push({ keeper, title });
        console.log(`  migrate title → keeper: "${title}"`);
      }
    } else if (maxDist === 0 && !hasProperTitle(keeper.title)) {
      const title = bestTitleAmong(members);
      if (title) {
        titleMigrations.push({ keeper, title });
        console.log(`  migrate title → keeper: "${title}"`);
      }
    }

    console.log();
  }

  // Orphan thumbs
  const orphanThumbs = [];
  const batchDirs = fs
    .readdirSync(ASSETS)
    .filter((d) => d.startsWith("batch"));

  for (const batch of batchDirs) {
    const batchDir = path.join(ASSETS, batch);
    for (const file of fs.readdirSync(batchDir)) {
      if (!file.endsWith(".thumb.webp")) continue;
      const fullFile = file.replace(/\.thumb\.webp$/, ".webp");
      const fullPath = path.join(batchDir, fullFile);
      if (!fs.existsSync(fullPath)) {
        orphanThumbs.push(path.join(batchDir, file));
      }
    }
  }

  console.log("--- Summary ---");
  console.log(`Gallery before: ${images.length}`);
  console.log(`Delete copies:  ${toDelete.length}`);
  console.log(`Title migrations: ${titleMigrations.length}`);
  console.log(`Orphan thumbs: ${orphanThumbs.length}`);
  console.log(`Gallery after:  ${images.length - toDelete.length}`);

  if (pinRemaps.size > 0) {
    console.log("\nPinned ID remaps needed in photos.ts:");
    for (const [from, to] of pinRemaps) console.log(`  ${from} → ${to}`);
  }

  if (dryRun) {
    console.log("\nDry run only — no files changed. Pass --apply to execute.");
    return;
  }

  for (const { keeper, title } of titleMigrations) {
    const { metaPath, meta } = loadMeta(path.join(ASSETS, keeper.batch));
    meta[keeper.file] = { ...meta[keeper.file], title };
    fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
    metaDirty.add(metaPath);
  }

  for (const victim of toDelete) {
    if (fs.existsSync(victim.fullPath)) fs.unlinkSync(victim.fullPath);
    if (fs.existsSync(victim.thumbPath)) fs.unlinkSync(victim.thumbPath);

    if (fs.existsSync(victim.metaPath)) {
      const meta = JSON.parse(fs.readFileSync(victim.metaPath, "utf8"));
      if (meta[victim.file]) {
        delete meta[victim.file];
        fs.writeFileSync(victim.metaPath, `${JSON.stringify(meta, null, 2)}\n`);
        metaDirty.add(victim.metaPath);
      }
    }
  }

  for (const thumb of orphanThumbs) {
    fs.unlinkSync(thumb);
    console.log(`Removed orphan thumb: ${path.relative(ROOT, thumb)}`);
  }

  if (pinRemaps.size > 0) {
    let photosSrc = fs.readFileSync(PHOTOS_TS, "utf8");
    for (const [from, to] of pinRemaps) {
      photosSrc = photosSrc.replaceAll(`"${from}"`, `"${to}"`);
    }
    fs.writeFileSync(PHOTOS_TS, photosSrc);
    console.log("Updated photos.ts pinned IDs");
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
