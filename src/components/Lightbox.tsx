import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { Photo } from "@/lib/photos";

const LENS_ZOOM = 2;
const LENS_SIZE_DESKTOP = 560;
const LIGHTBOX_ICON_SIZE = 33;
const LIGHTBOX_ICON_BTN = "h-[4.125rem] w-[4.125rem]";
const MOBILE_LENS_SCALE = 2.8;
const SWIPE_THRESHOLD = 70;
const SLIDE_OUT_MS = 320;
const FADE_OUT_MS = 320;
const FADE_IN_MS = 360;

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

interface NavTransition {
  delta: 1 | -1;
  fromIndex: number;
  toIndex: number;
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
  const [magnifyActive, setMagnifyActive] = useState(false);
  const [lens, setLens] = useState<LensState | null>(null);
  const [isTouchLike, setIsTouchLike] = useState(false);
  const [dragPx, setDragPx] = useState(0);
  const [navTransition, setNavTransition] = useState<NavTransition | null>(null);
  const [navAnimating, setNavAnimating] = useState(false);

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
  const navTimer = useRef<number | null>(null);
  const navAnimStarted = useRef(false);
  const magnifyActiveRef = useRef(false);
  const closeRef = useRef<() => void>(() => {});
  const flipDone = useRef(false);

  const photo = photos[index];
  const showNav = photos.length > 1 && !magnifyActive;

  const imgClass = `block w-auto h-auto object-contain touch-manipulation max-w-[min(92vw,calc(100vw-10.5rem))] max-h-[calc(86vh-5.5rem)] ${
    !magnifyActive && !navTransition ? "cursor-zoom-out" : ""
  } ${magnifyActive ? "cursor-none" : ""}`;

  const startNavAnimation = useCallback(() => {
    if (navAnimStarted.current) return;
    navAnimStarted.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNavAnimating(true));
    });
  }, []);

  const finishNav = useCallback(
    (transition: NavTransition) => {
      if (navTimer.current !== null) {
        window.clearTimeout(navTimer.current);
        navTimer.current = null;
      }
      setNavTransition(null);
      setNavAnimating(false);
      setDragPx(0);
      onIndexChange(transition.toIndex);
    },
    [onIndexChange],
  );

  const beginNav = useCallback(
    (delta: 1 | -1) => {
      if (photos.length <= 1 || magnifyActiveRef.current || navTransition) return;

      const toIndex = (index + delta + photos.length) % photos.length;
      const transition: NavTransition = { delta, fromIndex: index, toIndex };

      setNavTransition(transition);
      setNavAnimating(false);
      setDragPx(0);
      navAnimStarted.current = false;

      navTimer.current = window.setTimeout(() => {
        finishNav(transition);
      }, Math.max(SLIDE_OUT_MS, FADE_IN_MS) + 40);
    },
    [finishNav, index, navTransition, photos.length],
  );

  useEffect(() => {
    if (!navTransition) return;

    const incoming = photos[navTransition.toIndex];
    const preload = new Image();
    preload.src = incoming.src;

    if (preload.complete) {
      startNavAnimation();
    } else {
      preload.onload = () => startNavAnimation();
      preload.onerror = () => startNavAnimation();
    }

    const fallback = window.setTimeout(() => startNavAnimation(), 80);
    return () => window.clearTimeout(fallback);
  }, [navTransition, photos, startNavAnimation]);

  const onOutgoingTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (!navTransition) return;
      const prop =
        navTransition.delta > 0 ? "opacity" : "transform";
      if (e.propertyName !== prop) return;
      finishNav(navTransition);
    },
    [finishNav, navTransition],
  );

  useEffect(() => {
    magnifyActiveRef.current = magnifyActive;
  }, [magnifyActive]);

  useEffect(() => {
    setIsTouchLike(isTouchLikeDevice());
  }, []);

  useEffect(() => {
    setMagnifyActive(false);
    setLens(null);
    setDragPx(0);
  }, [index]);

  useEffect(() => {
    return () => {
      if (navTimer.current !== null) window.clearTimeout(navTimer.current);
    };
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
    dragState.current.active = false;
    touchMagnify.current = { active: false, moved: false, startX: 0, startY: 0 };
    setDragPx(0);
  }, []);

  const activateMagnify = useCallback(() => {
    setMagnifyActive(true);
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
    if (!magnifyActive || isTouchLike) return;
    const onMove = (e: MouseEvent) => updateLens(e.clientX, e.clientY, false);
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [magnifyActive, isTouchLike, updateLens]);

  useEffect(() => {
    const lightbox = lightboxRef.current;
    if (!lightbox) return;

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
      if (!nav.active || navTransition) return;

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
      setDragPx(dx);
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

      if (nav.moved) {
        if (dx < -SWIPE_THRESHOLD) {
          beginNav(1);
          return;
        }
        if (dx > SWIPE_THRESHOLD) {
          beginNav(-1);
          return;
        }
        setDragPx(0);
        return;
      }

      if (tapOnImage) closeRef.current();
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
  }, [beginNav, cancelMagnify, navTransition, updateLens]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    setBackdropIn(true);
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
      if (delta > 0) beginNav(1);
      else if (delta < 0) beginNav(-1);
    },
    [beginNav],
  );

  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (magnifyActive) {
          cancelMagnify();
          return;
        }
        close();
      } else if (!magnifyActive && !navTransition) {
        if (e.key === "ArrowRight") go(1);
        else if (e.key === "ArrowLeft") go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelMagnify, close, go, magnifyActive, navTransition]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (closing || magnifyActive || navTransition || e.pointerType === "touch") return;
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
    if (magnifyActive || navTransition) return;
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
    setDragPx(dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (magnifyActive || navTransition) return;
    const s = dragState.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    s.active = false;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      beginNav(dx < 0 ? 1 : -1);
      return;
    }
    setDragPx(0);
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

  const incomingPhoto = navTransition ? photos[navTransition.toIndex] : null;
  const isNextNav = navTransition?.delta === 1;

  const photoDims = (p: Photo) =>
    p.width > 0 && p.height > 0
      ? { width: p.width, height: p.height }
      : {};

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

      {showNav && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous"
            disabled={!!navTransition}
            className={`interactive-target fixed z-20 inline-flex ${LIGHTBOX_ICON_BTN} -translate-y-1/2 items-center justify-center text-white/70 hover:text-white active:text-white transition-colors touch-manipulation disabled:opacity-40 left-[max(1rem,env(safe-area-inset-left,0px))] md:left-16 top-1/2`}
            data-cursor="Prev"
          >
            <ChevronLeft size={LIGHTBOX_ICON_SIZE} strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next"
            disabled={!!navTransition}
            className={`interactive-target fixed z-20 inline-flex ${LIGHTBOX_ICON_BTN} -translate-y-1/2 items-center justify-center text-white/70 hover:text-white active:text-white transition-colors touch-manipulation disabled:opacity-40 right-[max(1rem,env(safe-area-inset-right,0px))] md:right-16 top-1/2`}
            data-cursor="Next"
          >
            <ChevronRight size={LIGHTBOX_ICON_SIZE} strokeWidth={1.5} aria-hidden />
          </button>
        </>
      )}

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

          <div
            ref={lensAreaRef}
            className="relative w-fit min-w-0 overflow-hidden touch-none"
          >
                {navTransition && incomingPhoto ? (
                  <>
                    <img
                      src={incomingPhoto.src}
                      alt=""
                      aria-hidden
                      draggable={false}
                      {...photoDims(incomingPhoto)}
                      className={`${imgClass} invisible`}
                    />
                    <img
                      src={incomingPhoto.src}
                      alt={incomingPhoto.title}
                      draggable={false}
                      {...photoDims(incomingPhoto)}
                      className={`${imgClass} absolute inset-0 m-auto`}
                      style={{
                        opacity: navAnimating ? 1 : 0,
                        transition: navAnimating
                          ? `opacity ${FADE_IN_MS}ms ease`
                          : "none",
                      }}
                    />
                    <img
                      ref={imgRef}
                      src={photos[navTransition.fromIndex].src}
                      alt={photos[navTransition.fromIndex].title}
                      {...photoDims(photos[navTransition.fromIndex])}
                      draggable={false}
                      onTransitionEnd={onOutgoingTransitionEnd}
                      className={`${imgClass} absolute left-1/2 top-1/2`}
                      style={{
                        transform: isNextNav
                          ? "translate(-50%, -50%)"
                          : navAnimating
                            ? "translate(calc(-50% + 100%), -50%)"
                            : "translate(-50%, -50%)",
                        ...(isNextNav
                          ? {
                              opacity: navAnimating ? 0 : 1,
                              transition: navAnimating
                                ? `opacity ${FADE_OUT_MS}ms ease`
                                : "none",
                            }
                          : {
                              transition: navAnimating
                                ? `transform ${SLIDE_OUT_MS}ms cubic-bezier(0.2, 0.7, 0.1, 1)`
                                : "none",
                            }),
                      }}
                    />
                  </>
                ) : (
                  <img
                    ref={imgRef}
                    src={photo.src}
                    alt={photo.title}
                    {...photoDims(photo)}
                    draggable={false}
                    onLoad={handleImageLoad}
                    onClick={(e) => {
                      if (isTouchLike) return;
                      handleImageTap(e);
                    }}
                    style={{
                      transform: dragPx ? `translateX(${dragPx}px)` : undefined,
                      transition: dragPx ? "none" : undefined,
                    }}
                    className={imgClass}
                    data-cursor={!magnifyActive ? "Close" : undefined}
                  />
                )}

                {magnifyActive && lens && !navTransition && (
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
