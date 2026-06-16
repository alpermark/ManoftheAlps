import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { photos } from "@/lib/photos";
import { Lightbox } from "@/components/Lightbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Man of the Alps - Gallery" },
      { name: "description", content: "An ongoing archive of photographs from cities, roads, and people - kept and added to slowly." },
      { property: "og:title", content: "Man of the Alps - Gallery" },
      { property: "og:description", content: "Photographs from cities, roads, and the people in between." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const refs = useRef<Map<string, HTMLElement>>(new Map());

  const setRef = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  }, []);

  const getRect = useCallback(
    (i: number) => {
      const p = photos[i];
      const el = p ? refs.current.get(p.id) : null;
      return el ? el.getBoundingClientRect() : null;
    },
    [],
  );

  const handleIndexChange = useCallback((i: number) => {
    setActiveIndex(i);
    const p = photos[i];
    const el = p ? refs.current.get(p.id) : null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  return (
    <>
      {/* Hero wordmark */}
      <section className="site-container pt-28 sm:pt-32 md:pt-40 pb-12 md:pb-20">
        <h1 className="wordmark">
          Man of
          <br />
          the Alps
        </h1>
        <p className="mt-8 md:mt-10 max-w-xl nav-label text-muted-foreground">
          Photographs from cities, roads, and the strangers I pass between them.
          <span className="block mt-3 opacity-70">
            {photos.length} frames <span className="opacity-50 mx-1">/</span> ongoing
          </span>
        </p>
      </section>

      {/* Thumbnail grid */}
      <section className="site-container pb-20 md:pb-28">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2 md:gap-3">
          {photos.map((p, i) => (
            <figure
              key={p.id}
              ref={setRef(p.id)}
              onClick={() => setActiveIndex(i)}
              className="photo-card aspect-square cursor-zoom-in"
              data-cursor="View"
              title={p.title}
            >
              <img
                src={p.thumb}
                alt={p.title}
                loading={i < 8 ? "eager" : "lazy"}
                fetchPriority={i < 4 ? "high" : undefined}
                decoding="async"
                className="photo-img"
              />
            </figure>
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
