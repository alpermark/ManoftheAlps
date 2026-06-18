export const SITE_NAME = "Man of the Alps";
export const SITE_TITLE = "Man of the Alps - Photography";
export const SITE_DESCRIPTION =
  "Travel photography by Man of the Alps. Cities, people, and moments collected on the road.";
export const OG_DESCRIPTION =
  "Travel photography - cities, people, and moments.";
export const THEME_COLOR = "#26221f";

export function siteUrl(): string {
  return (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
}

export function absoluteUrl(path: string): string {
  const base = siteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}
