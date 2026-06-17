import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Man of the Alps" },
      {
        name: "description",
        content: "Drop a note. Share a thought, a story, or just say hello.",
      },
      { property: "og:title", content: "Contact - Man of the Alps" },
      {
        property: "og:description",
        content: "Drop a note. Share a thought, a story, or just say hello.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="site-container page-top page-bottom min-h-dvh">
      <p className="nav-label opacity-60">Contact</p>
      <h1 className="font-display page-title-lg mt-3 sm:mt-4 max-w-4xl">
        Share yourself.
        <br />
        Write a letter. A note.
        <br />
        Sing something.
      </h1>

      <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-16 max-w-5xl">
        <div>
          <p className="nav-label opacity-50 mb-2">Email</p>
          <a
            href="mailto:mark@manofthealps.com"
            className="font-display text-xl sm:text-2xl md:text-3xl quiet-link break-all"
            data-cursor="Write"
          >
            mark@manofthealps.com
          </a>
        </div>
        <div>
          <p className="nav-label opacity-50 mb-2">Instagram</p>
          <a
            href="https://instagram.com/alpermark"
            target="_blank"
            rel="noreferrer"
            className="font-display text-xl sm:text-2xl md:text-3xl quiet-link"
            data-cursor="Open"
          >
            @alpermark
          </a>
        </div>
        <div className="sm:col-span-2 md:col-span-1">
          <p className="nav-label opacity-50 mb-2">Based</p>
          <p className="font-display text-xl sm:text-2xl md:text-3xl leading-snug">
            London
            <br />
            <span className="font-sans text-sm sm:text-base opacity-60">
              United Kingdom
            </span>
          </p>
        </div>
      </div>

      <div className="mt-16 sm:mt-20 md:mt-24 max-w-2xl">
        <p className="text-muted-foreground text-[15px] sm:text-base leading-relaxed">
          This is not a place for business. It is a place for people. If you
          have a story, a thought, or simply want to share a piece of yourself,
          write. I read every message and reply when I can.
        </p>
      </div>
    </div>
  );
}
