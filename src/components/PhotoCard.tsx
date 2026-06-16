import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/photos";

interface Props {
  photo: Photo;
  /** Tailwind aspect class, e.g. "aspect-[4/5]". Falls back to intrinsic. */
  aspect?: string;
  priority?: boolean;
}

export function PhotoCard({ photo, aspect, priority = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""}`}
      data-cursor="View"
    >
      <div className={`photo-card ${aspect ?? ""}`}>
        <img
          src={photo.src}
          alt={photo.title}
          {...(photo.width ? { width: photo.width } : {})}
          {...(photo.height ? { height: photo.height } : {})}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="photo-img"
        />
      </div>
      <figcaption className="mt-3 nav-label">
        <span className="font-display text-base md:text-lg tracking-normal normal-case">
          {photo.title}
        </span>
      </figcaption>
    </figure>
  );
}
