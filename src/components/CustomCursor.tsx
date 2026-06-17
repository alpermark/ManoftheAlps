import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Edition-style custom cursor. A small dot that grows into a pill with
 * a label when hovering an element marked data-cursor="<text>".
 *
 * Only active on hover-capable, fine pointer devices at md+ breakpoints.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const [label, setLabel] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const hoverMq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const desktopMq = window.matchMedia("(min-width: 768px)");

    const syncEnabled = () => {
      setEnabled(hoverMq.matches && desktopMq.matches);
    };

    syncEnabled();
    hoverMq.addEventListener("change", syncEnabled);
    desktopMq.addEventListener("change", syncEnabled);

    return () => {
      hoverMq.removeEventListener("change", syncEnabled);
      desktopMq.removeEventListener("change", syncEnabled);
    };
  }, [mounted]);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("has-custom-cursor");
      visibleRef.current = false;
      setLabel(null);
      return;
    }

    document.documentElement.classList.add("has-custom-cursor");

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visibleRef.current) {
        visibleRef.current = true;
        // Snap to pointer on first move so the cursor doesn't drift in from center.
        x = tx;
        y = ty;
      }

      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      const next = el?.dataset.cursor ?? null;
      setLabel((prev) => (prev === next ? prev : next));
    };

    const onLeave = () => {
      visibleRef.current = false;
    };

    const tick = () => {
      if (document.documentElement.classList.contains("has-magnify-lens")) {
        if (dotRef.current) dotRef.current.style.opacity = "0";
        raf = requestAnimationFrame(tick);
        return;
      }
      if (dotRef.current) {
        dotRef.current.style.opacity = visibleRef.current ? "1" : "0";
      }
      x += (tx - x) * 0.38;
      y += (ty - y) * 0.38;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!mounted) return null;

  const cursor = (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[99999] hidden md:flex items-center justify-center"
      style={{ opacity: 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 ease-out"
        style={{
          width: label ? 92 : 10,
          height: label ? 92 : 10,
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.45), 0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        {label}
      </div>
    </div>
  );

  return createPortal(cursor, document.body);
}
