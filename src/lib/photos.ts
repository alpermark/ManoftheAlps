/**
 * Photo registry.
 *
 * Photos are auto-discovered from `src/assets/batch*​/*.jpg` via Vite's
 * import.meta.glob. To add a new batch, drop optimized JPGs into a new
 * folder like `src/assets/batch02/` - they'll appear in the gallery
 * automatically.
 *
 * Optional per-image metadata can be supplied in a sibling `meta.json`
 * inside each batch folder, keyed by filename. Anything missing falls back
 * to sensible defaults.
 *
 * Example src/assets/batch01/meta.json:
 * {
 *   "p01.jpg": { "title": "Ridge, First Light", "location": "Chamonix",
 *                "subject": "Peaks", "tone": "bw", "year": 2024 }
 * }
 */

export type Tone = "color" | "bw";
export type Subject =
  | "Peaks"
  | "Portraits"
  | "Wildlife"
  | "Architecture"
  | "Water"
  | "Snow"
  | "Details"
  | "Untitled";

export interface Photo {
  id: string;
  src: string;
  thumb: string;
  title: string;
  location: string;
  year: number;
  subject: Subject;
  tone: Tone;
  width: number;
  height: number;
}

interface MetaEntry {
  title?: string;
  location?: string;
  subject?: Subject;
  tone?: Tone;
  year?: number;
  width?: number;
  height?: number;
}

// Eager glob - bundled as hashed URLs by Vite.
// Full-size images (used in the lightbox).
const fullModules = import.meta.glob("../assets/batch*/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

// Separate full vs thumb. Thumbs are siblings named `<name>.thumb.webp`.
const imageModules: Record<string, string> = {};
const thumbModules: Record<string, string> = {};
for (const [path, url] of Object.entries(fullModules)) {
  if (path.endsWith(".thumb.webp")) thumbModules[path] = url;
  else imageModules[path] = url;
}

// Optional metadata files per batch (e.g. ../assets/batch01/meta.json)
const metaModules = import.meta.glob("../assets/batch*/meta.json", {
  eager: true,
  import: "default",
}) as Record<string, Record<string, MetaEntry>>;

function batchOf(path: string): string {
  const m = path.match(/\/(batch[^/]+)\//);
  return m ? m[1] : "batch";
}

function fileOf(path: string): string {
  return path.split("/").pop() ?? path;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const shuffled = [...items];
  let state = seed;
  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/** Featured photos shown first, in this order. */
const FEATURED_FIRST = [
  "batch01-p09",
  "batch09-p37",
  "batch05-p17",
  "batch06-p02",
  "batch01-p07",
  "batch02-p03",
  "batch01-p11",
  "batch05-p25",
  "batch02-p26",
  "batch01-p24",
  "batch04-p32",
  "batch08-p11",
  "batch07-p59",
] as const;

function pinFeaturedFirst(photos: Photo[]): Photo[] {
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const featured = FEATURED_FIRST.flatMap((id) => {
    const photo = byId.get(id);
    return photo ? [photo] : [];
  });
  const featuredIds = new Set(featured.map((photo) => photo.id));
  const rest = photos.filter((photo) => !featuredIds.has(photo.id));
  return [...featured, ...rest];
}

function swapById(photos: Photo[], a: string, b: string): Photo[] {
  const result = [...photos];
  const i = result.findIndex((photo) => photo.id === a);
  const j = result.findIndex((photo) => photo.id === b);
  if (i < 0 || j < 0) return result;
  [result[i], result[j]] = [result[j], result[i]];
  return result;
}

function moveToIndex(photos: Photo[], id: string, index: number): Photo[] {
  const result = [...photos];
  const from = result.findIndex((photo) => photo.id === id);
  if (from < 0) return result;
  const [photo] = result.splice(from, 1);
  const to = Math.min(Math.max(index, 0), result.length);
  result.splice(to, 0, photo);
  return result;
}

/** Spread photos from the same batch apart in the gallery grid. */
function spreadGallery(photos: Photo[]): Photo[] {
  const buckets = new Map<string, Photo[]>();

  for (const photo of photos) {
    const batch = photo.id.split("-")[0] ?? photo.id;
    const bucket = buckets.get(batch) ?? [];
    bucket.push(photo);
    buckets.set(batch, bucket);
  }

  for (const [batch, bucket] of buckets) {
    buckets.set(batch, seededShuffle(bucket, hashString(batch)));
  }

  const remaining = new Map(
    [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );
  const lastPlaced = new Map<string, number>();
  const spread: Photo[] = [];

  while (spread.length < photos.length) {
    let pick: string | null = null;
    let bestGap = -1;

    for (const [batch, queue] of remaining) {
      if (queue.length === 0) continue;
      const gap = spread.length - (lastPlaced.get(batch) ?? -1_000_000);
      if (gap > bestGap || (gap === bestGap && batch < (pick ?? "\uffff"))) {
        bestGap = gap;
        pick = batch;
      }
    }

    if (!pick) break;

    const photo = remaining.get(pick)!.shift()!;
    spread.push(photo);
    lastPlaced.set(pick, spread.length - 1);
  }

  return spread;
}

const entries = Object.entries(imageModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map<Photo>(([path, src], i) => {
    const batch = batchOf(path);
    const file = fileOf(path);
    const metaKey = `../assets/${batch}/meta.json`;
    const meta = metaModules[metaKey]?.[file] ?? {};
    const thumbPath = path.replace(/\.webp$/, ".thumb.webp");
    const thumb = thumbModules[thumbPath] ?? src;
    return {
      id: `${batch}-${file.replace(/\.[^.]+$/, "")}`,
      src,
      thumb,
      title: meta.title ?? `Untitled ${String(i + 1).padStart(2, "0")}`,
      location: meta.location ?? "Alps",
      year: meta.year ?? new Date().getFullYear(),
      subject: meta.subject ?? "Untitled",
      tone: meta.tone ?? "color",
      // dims unknown until set in meta.json - use 0 and let the layout
      // rely on the CSS aspect ratio the card applies.
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    };
  });

export const photos: Photo[] = moveToIndex(
  moveToIndex(
    swapById(
      pinFeaturedFirst(spreadGallery(entries)),
      "batch03-p24",
      "batch09-p37",
    ),
    "batch03-p48",
    130,
  ),
  "batch09-p37",
  20,
);

export const subjects: Subject[] = [
  "Peaks",
  "Portraits",
  "Wildlife",
  "Architecture",
  "Water",
  "Snow",
  "Details",
  "Untitled",
];

export const locations = Array.from(new Set(photos.map((p) => p.location))).sort();
