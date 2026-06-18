import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SiteHeader } from "../components/SiteHeader";
import { CustomCursor } from "../components/CustomCursor";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  OG_DESCRIPTION,
  THEME_COLOR,
  absoluteUrl,
  siteUrl,
} from "../lib/site-meta";

const OG_IMAGE = absoluteUrl("/og-image.png");
const CANONICAL_URL = siteUrl() || undefined;

function NotFoundComponent() {
  return (
    <div className="site-container page-top page-bottom flex min-h-dvh items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="font-display text-5xl sm:text-7xl">404</h1>
        <h2 className="mt-4 font-display text-xl sm:text-2xl">
          Page not found
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          This trail doesn't exist. Head back to the gallery.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="nav-label quiet-link interactive-target inline-flex items-center justify-center"
          >
            Return to gallery
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="site-container page-top page-bottom flex min-h-dvh items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="font-display page-title">This page didn't load</h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Something went wrong. Try again or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="nav-label quiet-link interactive-target inline-flex items-center justify-center"
          >
            Try again
          </button>
          <a
            href="/"
            className="nav-label quiet-link interactive-target inline-flex items-center justify-center"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: SITE_TITLE },
        {
          name: "description",
          content: SITE_DESCRIPTION,
        },
        { name: "author", content: SITE_NAME },
        { property: "og:title", content: SITE_TITLE },
        {
          property: "og:description",
          content: OG_DESCRIPTION,
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: SITE_NAME },
        ...(CANONICAL_URL
          ? [{ property: "og:url", content: CANONICAL_URL }]
          : []),
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "1200" },
        { property: "og:image:alt", content: SITE_NAME },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: SITE_TITLE },
        { name: "twitter:description", content: OG_DESCRIPTION },
        { name: "twitter:image", content: OG_IMAGE },
        { name: "twitter:image:alt", content: SITE_NAME },
        { name: "theme-color", content: THEME_COLOR },
        { name: "apple-mobile-web-app-title", content: SITE_NAME },
        { name: "apple-mobile-web-app-capable", content: "yes" },
      ],
      links: [
        ...(CANONICAL_URL ? [{ rel: "canonical", href: CANONICAL_URL }] : []),
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        {
          rel: "icon",
          href: "/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          rel: "icon",
          href: "/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        {
          rel: "apple-touch-icon",
          href: "/apple-touch-icon.png",
          sizes: "180x180",
        },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap",
        },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="site-container py-8 sm:py-10 nav-label flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border">
      <span>© {new Date().getFullYear()} Man of the Alps</span>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100000] focus:bg-background focus:px-4 focus:py-2 focus:nav-label focus:outline focus:outline-2 focus:outline-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <CustomCursor />
      <main id="main-content">
        <Outlet />
      </main>
      <SiteFooter />
    </QueryClientProvider>
  );
}
