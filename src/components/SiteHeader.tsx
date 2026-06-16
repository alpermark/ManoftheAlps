import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 text-foreground">
      <div className="site-container py-4 sm:py-5 md:py-6 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
        <Link
          to="/"
          className="nav-label hidden sm:inline-block"
          data-cursor="Home"
        >
          Man of the Alps
        </Link>

        <nav className="flex items-center justify-center gap-5 md:gap-8 nav-label">
          <Link
            to="/"
            className="quiet-link"
            activeOptions={{ exact: true }}
            activeProps={{ className: "quiet-link opacity-100" }}
            data-cursor="View"
          >
            Gallery
          </Link>
          <span aria-hidden className="opacity-40">/</span>
          <Link
            to="/about"
            className="quiet-link"
            activeProps={{ className: "quiet-link opacity-100" }}
            data-cursor="Read"
          >
            About
          </Link>
          <span aria-hidden className="opacity-40">/</span>
          <Link
            to="/contact"
            className="quiet-link"
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
