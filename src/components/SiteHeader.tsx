import { Link } from "@tanstack/react-router";

const navLinkClass =
  "quiet-link opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100";

export function SiteHeader() {
  return (
    <header className="site-header-bar fixed inset-x-0 top-0 z-50 text-foreground">
      <div className="site-container pt-[max(1rem,env(safe-area-inset-top,0px))] pb-4 sm:pb-5 md:pb-6 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
        <Link
          to="/"
          className="nav-label hidden sm:inline-block opacity-80 hover:opacity-100 transition-opacity"
          data-cursor="Home"
        >
          Man of the Alps
        </Link>

        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-5 md:gap-x-8 nav-label"
        >
          <Link
            to="/"
            className={navLinkClass}
            activeOptions={{ exact: true }}
            activeProps={{ className: "quiet-link opacity-100" }}
            data-cursor="View"
          >
            Gallery
          </Link>
          <span aria-hidden className="opacity-40 select-none">
            /
          </span>
          <Link
            to="/about"
            className={navLinkClass}
            activeProps={{ className: "quiet-link opacity-100" }}
            data-cursor="Read"
          >
            About
          </Link>
          <span aria-hidden className="opacity-40 select-none">
            /
          </span>
          <Link
            to="/contact"
            className={navLinkClass}
            activeProps={{ className: "quiet-link opacity-100" }}
            data-cursor="Write"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
