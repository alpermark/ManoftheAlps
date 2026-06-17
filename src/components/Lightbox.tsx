import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Photo } from "@/lib/photos";

interface Props {
  photos: Photo[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  getRect: (i: number) => DOMRect | null;
}

export function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
  getRect,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [closing, setClosing] = useState(false);
  const [backdropIn, setBackdropIn] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    locked: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    locked: false,
  });

  const photo = photos[index];
  const flipDone = useRef(false);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Enter animation: FLIP from thumbnail rect to centered position.
  useEffect(() => {
    setBackdropIn(true);
    animateFromThumb(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateFromThumb = useCallback(
    (i: number) => {
      const el = imgRef.current;
      const rect = getRect(i);
      if (!el || !rect || flipDone.current) return;
      const target = el.getBoundingClientRect();
      if (target.width <= 0 || target.height <= 0) return;
      flipDone.current = true;
      const dx = rect.left + rect.width / 2 - (target.left + target.width / 2);
      const dy = rect.top + rect.height / 2 - (target.top + target.height / 2);
      const sx = rect.width / target.width;
      const sy = rect.height / target.height;
      const s = Math.max(sx, sy);
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
      el.style.opacity = "0.6";
      // force reflow
      void el.offsetWidth;
      el.style.transition =
        "transform 520ms cubic-bezier(0.2, 0.7, 0.1, 1), opacity 320ms ease";
      el.style.transform = "translate(0,0) scale(1)";
      el.style.opacity = "1";
    },
    [getRect],
  );

  const handleImageLoad = useCallback(() => {
    animateFromThumb(index);
  }, [animateFromThumb, index]);

  const close = useCallback(() => {
    const el = imgRef.current;
    const rect = getRect(index);
    setClosing(true);
    setBackdropIn(false);
    if (el && rect) {
      const target = el.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - (target.left + target.width / 2);
      const dy = rect.top + rect.height / 2 - (target.top + target.height / 2);
      const sx = rect.width / target.width;
      const sy = rect.height / target.height;
      const s = Math.max(sx, sy);
      el.style.transition =
        "transform 460ms cubic-bezier(0.4, 0, 0.2, 1), opacity 360ms ease";
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
      el.style.opacity = "0";
    }
    window.setTimeout(onClose, 480);
  }, [getRect, index, onClose]);

  const go = useCallback(
    (delta: number) => {
      const next = (index + delta + photos.length) % photos.length;
      onIndexChange(next);
    },
    [index, photos.length, onIndexChange],
  );

  // Re-run enter animation when index changes (after first mount), for nav.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const el = imgRef.current;
    if (!el) return;
    el.style.transition = "opacity 180ms ease";
    el.style.opacity = "0";
    const t = window.setTimeout(() => {
      el.style.transition = "opacity 280ms ease, transform 280ms ease";
      el.style.transform = "translate(0,0) scale(1)";
      el.style.opacity = "1";
    }, 180);
    return () => window.clearTimeout(t);
  }, [index]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, go]);

  // Drag / swipe
  const onPointerDown = (e: React.PointerEvent) => {
    if (closing) return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      locked: false,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragState.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (!s.locked) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        s.locked = Math.abs(dx) > Math.abs(dy);
        if (!s.locked) {
          s.active = false;
          return;
        }
      } else {
        return;
      }
    }
    setDragX(dx);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = dragState.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    s.active = false;
    setDragX(0);
    if (Math.abs(dx) > 70) {
      go(dx < 0 ? 1 : -1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
    >
      {/* Backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 bg-black transition-opacity duration-500"
        style={{ opacity: backdropIn ? 0.92 : 0 }}
      />

      {/* Image */}
      <div
        className="relative z-10 flex items-center justify-center w-full h-full px-4 md:px-16"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        <img
          ref={imgRef}
          src={photo.src}
          alt={photo.title}
          {...(photo.width > 0 && photo.height > 0
            ? { width: photo.width, height: photo.height }
            : {})}
          draggable={false}
          onLoad={handleImageLoad}
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
          style={{
            transform: dragX ? `translateX(${dragX}px)` : undefined,
            transition: dragX ? "none" : undefined,
          }}
          className="max-w-[92vw] max-h-[86vh] w-auto h-auto object-contain cursor-zoom-out"
          data-cursor="Close"
        />
      </div>

      {/* Caption */}
      <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] inset-x-0 z-20 px-4 text-center pointer-events-none">
        <span className="nav-label text-white/80">
          {photo.title}
          <span className="opacity-50 mx-2">/</span>
          {index + 1} / {photos.length}
        </span>
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="absolute top-[max(1.25rem,env(safe-area-inset-top,0px))] end-4 sm:end-5 z-20 interactive-target inline-flex items-center justify-center text-white/80 hover:text-white transition-colors"
        data-cursor="Close"
      >
        <X size={22} aria-hidden />
      </button>

      {/* Arrows */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous"
            className="absolute start-1 sm:start-4 md:start-6 top-1/2 -translate-y-1/2 z-20 interactive-target inline-flex items-center justify-center text-white/70 hover:text-white transition-colors"
            data-cursor="Prev"
          >
            <ChevronLeft size={32} aria-hidden className="sm:w-9 sm:h-9" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next"
            className="absolute end-1 sm:end-4 md:end-6 top-1/2 -translate-y-1/2 z-20 interactive-target inline-flex items-center justify-center text-white/70 hover:text-white transition-colors"
            data-cursor="Next"
          >
            <ChevronRight size={32} aria-hidden className="sm:w-9 sm:h-9" />
          </button>
        </>
      )}
    </div>
  );
}
