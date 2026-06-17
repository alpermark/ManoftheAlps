import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { Photo } from "@/lib/photos";

const LENS_ZOOM = 2;
const LENS_SIZE_DESKTOP = 560;
const LIGHTBOX_ICON_SIZE = 33;
const LIGHTBOX_ICON_BTN = "h-[4.125rem] w-[4.125rem]";
/** Mobile lens is 180% larger than the base viewport-fit size (2.8× total). */
const MOBILE_LENS_SCALE = 2.8;
const SWIPE_THRESHOLD = 70;

function isTouchLikeDevice() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: none)").matches ||
    navigator.maxTouchPoints > 0
  );
}

function lensSizeForViewport() {
  if (typeof window === "undefined") return LENS_SIZE_DESKTOP;
  const viewportMin = Math.min(window.innerWidth, window.innerHeight);
  const cap = viewportMin * 0.88;
  let size = Math.min(LENS_SIZE_DESKTOP, cap);
  if (isTouchLikeDevice()) {
    size *= MOBILE_LENS_SCALE;
    size = Math.min(size, viewportMin * 0.98);
  }
  return size;
}

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
  const lensAreaRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [backdropIn, setBackdropIn] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [magnifyActive, setMagnifyActive] = useState(false);
  const [lens, setLens] = useState<LensState | null>(null);
  const [isTouchLike, setIsTouchLike] = useState(false);
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    locked: false,
  });
  const touchMagnify = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
  });
  const imageTouch = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });
  const magnifyActiveRef = useRef(false);
  const closeRef = useRef<() => void>(() => {});
  const goRef = useRef<(delta: number) => void>(() => {});

  const photo = photos[index];
  const flipDone = useRef(false);

  useEffect(() => {
    magnifyActiveRef.current = magnifyActive;
  }, [magnifyActive]);

  useEffect(() => {
    setIsTouchLike(isTouchLikeDevice());
  }, []);

  const buildLensAt = useCallback(
    (clientX: number, clientY: number, clamp: boolean): LensState | null => {
      const img = imgRef.current;
      if (!img) return null;

      const rect = img.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;

      const size = lensSizeForViewport();
      let x = clientX;
      let y = clientY;

      if (clamp) {
        x = Math.min(rect.right, Math.max(rect.left, x));
        y = Math.min(rect.bottom, Math.max(rect.top, y));
      } else if (
        x < rect.left ||
        x > rect.right ||
        y < rect.top ||
        y > rect.bottom
      ) {
        return null;
      }

      const relX = x - rect.left;
      const relY = y - rect.top;

      return {
        x,
        y,
        bgX: -relX * LENS_ZOOM + size / 2,
        bgY: -relY * LENS_ZOOM + size / 2,
        bgW: rect.width * LENS_ZOOM,
        bgH: rect.height * LENS_ZOOM,
        size,
      };
    },
    [],
  );

  const centerLens = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const next = buildLensAt(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      true,
    );
    if (next) setLens(next);
  }, [buildLensAt]);

  const updateLens = useCallback(
    (clientX: number, clientY: number, clamp: boolean) => {
      const next = buildLensAt(clientX, clientY, clamp);
      if (next) setLens(next);
      else if (!clamp) setLens(null);
    },
    [buildLensAt],
  );

  const cancelMagnify = useCallback(() => {
    setMagnifyActive(false);
    setLens(null);
    setDragX(0);
    dragState.current.active = false;
    touchMagnify.current = { active: false, moved: false, startX: 0, startY: 0 };
  }, []);

  const activateMagnify = useCallback(() => {
    setMagnifyActive(true);
    setDragX(0);
    dragState.current.active = false;
    touchMagnify.current = { active: false, moved: false, startX: 0, startY: 0 };
    requestAnimationFrame(() => {
      centerLens();
      requestAnimationFrame(centerLens);
    });
  }, [centerLens]);

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

  // Desktop: follow mouse. Touch: handled below via touch events.
  useEffect(() => {
    if (!magnifyActive || isTouchLike) return;
    const onMove = (e: MouseEvent) => updateLens(e.clientX, e.clientY, false);
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [magnifyActive, isTouchLike, updateLens]);

  // Touch: magnify drag + tap-anywhere to dismiss; image tap to close lightbox.
  useEffect(() => {
    const lightbox = lightboxRef.current;
    const imageArea = lensAreaRef.current;
    if (!lightbox || !imageArea) return;

    const isOnImage = (x: number, y: number) => {
      const img = imgRef.current;
      if (!img) return false;
      const rect = img.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const isInteractiveTarget = (target: EventTarget | null) =>
      (target as Element | null)?.closest("button") != null;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || isInteractiveTarget(e.target)) return;

      if (magnifyActiveRef.current) {
        touchMagnify.current = {
          active: true,
          moved: false,
          startX: t.clientX,
          startY: t.clientY,
        };
        return;
      }

      imageTouch.current = {
        active: true,
        moved: false,
        startX: t.clientX,
        startY: t.clientY,
        lastX: t.clientX,
        lastY: t.clientY,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;

      if (magnifyActiveRef.current) {
        const dx = t.clientX - touchMagnify.current.startX;
        const dy = t.clientY - touchMagnify.current.startY;
        if (Math.hypot(dx, dy) > 12) {
          touchMagnify.current.moved = true;
          e.preventDefault();
          updateLens(t.clientX, t.clientY, true);
        }
        return;
      }

      const nav = imageTouch.current;
      if (!nav.active) return;

      nav.lastX = t.clientX;
      nav.lastY = t.clientY;
      const dx = t.clientX - nav.startX;
      const dy = t.clientY - nav.startY;

      if (!nav.moved) {
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
        if (Math.abs(dx) <= Math.abs(dy)) {
          nav.active = false;
          return;
        }
        nav.moved = true;
      }

      e.preventDefault();
      setDragX(dx);
    };

    const onTouchEnd = () => {
      if (magnifyActiveRef.current) {
        const { active, moved } = touchMagnify.current;
        touchMagnify.current = {
          active: false,
          moved: false,
          startX: 0,
          startY: 0,
        };
        if (active && !moved) cancelMagnify();
        return;
      }

      const nav = imageTouch.current;
      if (!nav.active) return;

      const dx = nav.lastX - nav.startX;
      const tapOnImage =
        isOnImage(nav.startX, nav.startY) && isOnImage(nav.lastX, nav.lastY);

      imageTouch.current = {
        active: false,
        moved: false,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
      };
      setDragX(0);

      if (nav.moved && Math.abs(dx) > SWIPE_THRESHOLD) {
        goRef.current(dx < 0 ? 1 : -1);
        return;
      }

      if (!nav.moved && tapOnImage) {
        closeRef.current();
      }
    };

    lightbox.addEventListener("touchstart", onTouchStart, { passive: true });
    lightbox.addEventListener("touchmove", onTouchMove, { passive: false });
    lightbox.addEventListener("touchend", onTouchEnd, { passive: true });
    lightbox.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      lightbox.removeEventListener("touchstart", onTouchStart);
      lightbox.removeEventListener("touchmove", onTouchMove);
      lightbox.removeEventListener("touchend", onTouchEnd);
      lightbox.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [cancelMagnify, updateLens]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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

  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    goRef.current = go;
  }, [go]);

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
    if (closing || magnifyActive || e.pointerType === "touch") return;
    if ((e.target as Element).closest("button")) return;
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
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      go(dx < 0 ? 1 : -1);
    }
  };

  const handleImageTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (magnifyActive) {
      if (isTouchLike) return;
      cancelMagnify();
      return;
    }
    close();
  };

  const handleSurfaceClick = () => {
    if (magnifyActive) {
      cancelMagnify();
      return;
    }
    close();
  };

  return (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-[1000] flex items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onClick={handleSurfaceClick}
    >
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500"
        style={{ opacity: backdropIn ? 0.92 : 0 }}
      />

      <div
        className="relative z-10 flex items-center justify-center w-full h-full px-4 md:px-16"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "none" }}
      >
        <div
          className="relative flex w-fit max-w-[92vw] flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex w-full items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (magnifyActive) cancelMagnify();
                else activateMagnify();
              }}
              aria-label={magnifyActive ? "Cancel magnification" : "Magnify image"}
              aria-pressed={magnifyActive}
              className={`inline-flex ${LIGHTBOX_ICON_BTN} shrink-0 items-center justify-center transition-colors touch-manipulation ${
                magnifyActive
                  ? "text-red-500 pointer-events-none"
                  : "text-white/70 hover:text-white active:text-white"
              }`}
              data-cursor={magnifyActive ? undefined : "Magnify"}
            >
              <ZoomIn size={LIGHTBOX_ICON_SIZE} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (magnifyActive) cancelMagnify();
                else close();
              }}
              aria-label="Close"
              className={`interactive-target inline-flex ${LIGHTBOX_ICON_BTN} shrink-0 items-center justify-center text-white/80 hover:text-white active:text-white transition-colors touch-manipulation`}
              data-cursor={magnifyActive ? undefined : "Close"}
            >
              <X size={LIGHTBOX_ICON_SIZE} strokeWidth={1.5} aria-hidden />
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {photos.length > 1 && !magnifyActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Previous"
                className={`interactive-target inline-flex ${LIGHTBOX_ICON_BTN} shrink-0 items-center justify-center text-white/70 hover:text-white active:text-white transition-colors touch-manipulation`}
                data-cursor="Prev"
              >
                <ChevronLeft size={LIGHTBOX_ICON_SIZE} strokeWidth={1.5} aria-hidden />
              </button>
            )}

            <div ref={lensAreaRef} className="relative min-w-0 touch-none">
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
                if (isTouchLike) return;
                handleImageTap(e);
              }}
              style={{
                transform: dragX ? `translateX(${dragX}px)` : undefined,
                transition: dragX ? "none" : undefined,
              }}
              className={`w-auto h-auto object-contain touch-manipulation ${
                photos.length > 1 && !magnifyActive
                  ? "max-w-[min(92vw,calc(100vw-10.5rem))] max-h-[calc(86vh-5.5rem)]"
                  : "max-w-[92vw] max-h-[calc(86vh-5.5rem)]"
              } ${magnifyActive ? "cursor-none" : "cursor-zoom-out"}`}
              data-cursor={magnifyActive ? undefined : "Close"}
            />

            {magnifyActive && lens && (
              <div
                aria-hidden
                className="pointer-events-none fixed z-[1001] overflow-hidden rounded-full"
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

            {photos.length > 1 && !magnifyActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Next"
                className={`interactive-target inline-flex ${LIGHTBOX_ICON_BTN} shrink-0 items-center justify-center text-white/70 hover:text-white active:text-white transition-colors touch-manipulation`}
                data-cursor="Next"
              >
                <ChevronRight size={LIGHTBOX_ICON_SIZE} strokeWidth={1.5} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] inset-x-0 z-20 px-4 text-center pointer-events-none">
        <span className="nav-label text-white/80">
          {photo.title}
          <span className="opacity-50 mx-2">/</span>
          {index + 1} / {photos.length}
        </span>
      </div>
    </div>
  );
}
