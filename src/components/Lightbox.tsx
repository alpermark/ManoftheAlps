import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { Photo } from "@/lib/photos";

const LENS_SIZE = 560;
const LENS_SIZE_MOBILE = 260;
const LENS_ZOOM = 2;

interface LensState {
  x: number;
  y: number;
  bgX: number;
  bgY: number;
  bgW: number;
  bgH: number;
  size: number;
}

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
  const [magnifyActive, setMagnifyActive] = useState(false);
  const [lens, setLens] = useState<LensState | null>(null);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
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

  const cancelMagnify = useCallback(() => {
    setMagnifyActive(false);
    setLens(null);
    setDragX(0);
    dragState.current.active = false;
  }, []);

  const activateMagnify = useCallback(() => {
    setMagnifyActive(true);
    setDragX(0);
    dragState.current.active = false;

    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const lensSize = window.matchMedia("(pointer: coarse)").matches
      ? LENS_SIZE_MOBILE
      : LENS_SIZE;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const relX = cx - rect.left;
    const relY = cy - rect.top;
    setLens({
      x: cx,
      y: cy,
      bgX: -relX * LENS_ZOOM + lensSize / 2,
      bgY: -relY * LENS_ZOOM + lensSize / 2,
      bgW: rect.width * LENS_ZOOM,
      bgH: rect.height * LENS_ZOOM,
      size: lensSize,
    });
  }, []);

  const updateLens = useCallback(
    (clientX: number, clientY: number, clamp = false) => {
      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const lensSize = window.matchMedia("(pointer: coarse)").matches
        ? LENS_SIZE_MOBILE
        : LENS_SIZE;

      let x = clientX;
      let y = clientY;

      if (clamp) {
        x = Math.min(rect.right, Math.max(rect.left, x));
        y = Math.min(rect.bottom, Math.max(rect.top, y));
      } else if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setLens(null);
        return;
      }

      const relX = x - rect.left;
      const relY = y - rect.top;

      setLens({
        x,
        y,
        bgX: -relX * LENS_ZOOM + lensSize / 2,
        bgY: -relY * LENS_ZOOM + lensSize / 2,
        bgW: rect.width * LENS_ZOOM,
        bgH: rect.height * LENS_ZOOM,
        size: lensSize,
      });
    },
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setIsCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("has-magnify-lens", magnifyActive);
    return () => {
      document.documentElement.classList.remove("has-magnify-lens");
    };
  }, [magnifyActive]);

  useEffect(() => {
    setMagnifyActive(false);
    setLens(null);
  }, [index]);

  useEffect(() => {
    if (!magnifyActive) return;
    const clamp = window.matchMedia("(pointer: coarse)").matches;
    const onMove = (e: PointerEvent) => updateLens(e.clientX, e.clientY, clamp);
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [magnifyActive, updateLens]);

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
    cancelMagnify();
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
  }, [cancelMagnify, getRect, index, onClose]);

  const go = useCallback(
    (delta: number) => {
      const next = (index + delta + photos.length) % photos.length;
      onIndexChange(next);
    },
    [index, photos.length, onIndexChange],
  );

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (magnifyActive) {
          cancelMagnify();
          return;
        }
        close();
      } else if (!magnifyActive) {
        if (e.key === "ArrowRight") go(1);
        else if (e.key === "ArrowLeft") go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelMagnify, close, go, magnifyActive]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (closing || magnifyActive) return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      locked: false,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (magnifyActive) return;
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
    if (magnifyActive) return;
    const s = dragState.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    s.active = false;
    setDragX(0);
    if (Math.abs(dx) > 70) {
      go(dx < 0 ? 1 : -1);
    }
  };

  const onMagnifyPointerMove = (e: React.PointerEvent) => {
    if (!magnifyActive) return;
    updateLens(e.clientX, e.clientY, isCoarsePointer);
  };

  const onMagnifyPointerDown = (e: React.PointerEvent) => {
    if (!magnifyActive) return;
    updateLens(e.clientX, e.clientY, isCoarsePointer);
  };

  const handleSurfaceClick = () => {
    if (magnifyActive) {
      if (!isCoarsePointer) cancelMagnify();
      return;
    }
    close();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onClick={handleSurfaceClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500"
        style={{ opacity: backdropIn ? 0.92 : 0 }}
      />

      {/* Image frame */}
      <div
        className="relative z-10 flex items-center justify-center w-full h-full px-4 md:px-16"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: magnifyActive ? "none" : "pan-y" }}
      >
        <div
          className="relative max-w-[92vw] max-h-[86vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (magnifyActive) cancelMagnify();
              else activateMagnify();
            }}
            aria-label={magnifyActive ? "Cancel magnification" : "Magnify image"}
            aria-pressed={magnifyActive}
            className={`interactive-target absolute bottom-full left-0 z-10 mb-2 transition-colors ${
              magnifyActive
                ? "text-red-500 pointer-events-none"
                : "text-white/70 hover:text-white"
            }`}
            data-cursor={magnifyActive ? undefined : "Magnify"}
          >
            <ZoomIn size={20} strokeWidth={1.5} />
          </button>

          <div
            className="relative touch-none"
            onPointerDown={onMagnifyPointerDown}
            onPointerMove={onMagnifyPointerMove}
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
              if (magnifyActive) {
                if (!isCoarsePointer) cancelMagnify();
              } else close();
            }}
            style={{
              transform: dragX ? `translateX(${dragX}px)` : undefined,
              transition: dragX ? "none" : undefined,
            }}
            className={`max-w-[92vw] max-h-[86vh] w-auto h-auto object-contain ${
              magnifyActive ? "cursor-none" : "cursor-zoom-out"
            }`}
            data-cursor={magnifyActive ? undefined : "Close"}
          />

          {magnifyActive && lens && (
            <div
              role={isCoarsePointer ? "button" : undefined}
              tabIndex={isCoarsePointer ? 0 : undefined}
              aria-label={isCoarsePointer ? "Close magnification" : undefined}
              onClick={(e) => {
                if (!isCoarsePointer) return;
                e.stopPropagation();
                cancelMagnify();
              }}
              onKeyDown={(e) => {
                if (!isCoarsePointer) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  cancelMagnify();
                }
              }}
              className={`fixed z-[1001] overflow-hidden rounded-full ${
                isCoarsePointer ? "pointer-events-auto touch-none" : "pointer-events-none"
              }`}
              style={{
                width: lens.size,
                height: lens.size,
                left: lens.x,
                top: lens.y,
                transform: "translate(-50%, -50%)",
                backgroundImage: `url(${photo.src})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
                backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
              }}
            />
          )}
          </div>
        </div>
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
        onClick={(e) => {
          e.stopPropagation();
          if (magnifyActive) {
            if (!isCoarsePointer) cancelMagnify();
          } else close();
        }}
        aria-label="Close"
        className="absolute top-[max(1.25rem,env(safe-area-inset-top,0px))] end-4 sm:end-5 z-20 interactive-target inline-flex items-center justify-center text-white/80 hover:text-white transition-colors"
        data-cursor={magnifyActive ? undefined : "Close"}
      >
        <X size={22} aria-hidden />
      </button>

      {/* Arrows */}
      {photos.length > 1 && !magnifyActive && (
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
