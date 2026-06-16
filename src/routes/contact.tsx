import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Man of the Alps" },
      { name: "description", content: "Drop a note. Share a thought, a story, or just say hello." },
      { property: "og:title", content: "Contact - Man of the Alps" },
      { property: "og:description", content: "Drop a note. Share a thought, a story, or just say hello." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="site-container pt-28 sm:pt-32 md:pt-40 pb-20 md:pb-28 min-h-dvh">

      <p className="nav-label opacity-60">Contact</p>
      <h1 className="font-display text-5xl md:text-8xl mt-4 leading-[0.95]">
        Share yourself. Write a letter. A note. Sing something.
      </h1>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 max-w-5xl">
        <div>
          <p className="nav-label opacity-50 mb-2">Email</p>
          <a
            href="mailto:mark@manofthealps.com"
            className="font-display text-2xl md:text-3xl quiet-link"
            data-cursor="Copy"
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
            className="font-display text-2xl md:text-3xl quiet-link"
            data-cursor="Open"
          >
            @alpermark
          </a>
        </div>
        <div>
          <p className="nav-label opacity-50 mb-2">Based</p>
          <p className="font-display text-2xl md:text-3xl">
            London
            <br />
            <span className="font-sans text-base opacity-60">United Kingdom</span>
          </p>
        </div>
      </div>

      <div className="mt-24 max-w-2xl">
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          This is not a place for business. It is a place for people. If you have
          a story, a thought, or simply want to share a piece of yourself, write.
          I read every message and reply when I can.
        </p>
      </div>
    </div>
  );
}
