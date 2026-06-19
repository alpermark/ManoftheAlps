import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { photos } from "@/lib/photos";
import { Lightbox } from "@/components/Lightbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Man of the Alps - Gallery" },
      {
        name: "description",
        content:
          "An ongoing archive of photographs from cities, roads, and people - kept and added to slowly.",
      },
      { property: "og:title", content: "Man of the Alps - Gallery" },
      {
        property: "og:description",
        content: "Photographs from cities, roads, and the people in between.",
      },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const refs = useRef<Map<string, HTMLElement>>(new Map());

  const setRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) refs.current.set(id, el);
      else refs.current.delete(id);
    },
    [],
  );

  const getRect = useCallback((i: number) => {
    const p = photos[i];
    const el = p ? refs.current.get(p.id) : null;
    return el ? el.getBoundingClientRect() : null;
  }, []);

  const handleIndexChange = useCallback((i: number) => {
    setActiveIndex(i);
    const p = photos[i];
    const el = p ? refs.current.get(p.id) : null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  return (
    <>
      {/* Hero wordmark */}
      <section className="site-container page-top pb-10 sm:pb-12 md:pb-20">
        <h1 className="wordmark text-[clamp(4.125rem,16.5vw,15rem)] sm:text-[clamp(2.75rem,11vw,15rem)]">
          Man of
          <br />
          the Alps
        </h1>
        <p className="mt-6 sm:mt-8 md:mt-10 max-w-xl nav-label text-muted-foreground leading-relaxed">
          Photographs from cities, roads, nature, and the strangers that breath
          between them. If only for an instant.
        </p>
      </section>

      {/* Thumbnail grid */}
      <section
        className="site-container page-bottom"
        aria-label="Photo gallery"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2 md:gap-3">
          {photos.map((p, i) => (
            <button
              key={p.id}
              ref={setRef(p.id)}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="photo-card aspect-square cursor-zoom-in w-full border-0 p-0 bg-transparent text-left"
              data-cursor="View"
              aria-label={`View ${p.title}`}
            >
              <img
                src={p.thumb}
                alt={p.title}
                width={600}
                height={600}
                loading={i < 8 ? "eager" : "lazy"}
                fetchPriority={i < 4 ? "high" : undefined}
                decoding="async"
                className="photo-img"
              />
            </button>
          ))}
        </div>
      </section>

      {activeIndex !== null && (
        <Lightbox
          photos={photos}
          index={activeIndex}
          onIndexChange={handleIndexChange}
          onClose={() => setActiveIndex(null)}
          getRect={getRect}
        />
      )}
    </>
  );
}
