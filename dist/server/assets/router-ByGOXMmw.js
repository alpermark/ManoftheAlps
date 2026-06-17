import { useEffect, useRef, useState } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createPortal } from "react-dom";
//#region src/styles.css?url
var styles_default = "/assets/styles-_v6n8_qG.css";
//#endregion
//#region src/components/SiteHeader.tsx
var navLinkClass = "quiet-link opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100";
function SiteHeader() {
	return /* @__PURE__ */ jsx("header", {
		className: "site-header-bar fixed inset-x-0 top-0 z-50 text-foreground",
		children: /* @__PURE__ */ jsxs("div", {
			className: "site-container pt-[max(1rem,env(safe-area-inset-top,0px))] pb-4 sm:pb-5 md:pb-6 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4",
			children: [/* @__PURE__ */ jsx(Link, {
				to: "/",
				className: "nav-label hidden sm:inline-block opacity-80 hover:opacity-100 transition-opacity",
				"data-cursor": "Home",
				children: "Man of the Alps"
			}), /* @__PURE__ */ jsxs("nav", {
				"aria-label": "Primary",
				className: "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-5 md:gap-x-8 nav-label",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/",
						className: navLinkClass,
						activeOptions: { exact: true },
						activeProps: { className: "quiet-link opacity-100" },
						"data-cursor": "View",
						children: "Gallery"
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": true,
						className: "opacity-40 select-none",
						children: "/"
					}),
					/* @__PURE__ */ jsx(Link, {
						to: "/about",
						className: navLinkClass,
						activeProps: { className: "quiet-link opacity-100" },
						"data-cursor": "Read",
						children: "About"
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": true,
						className: "opacity-40 select-none",
						children: "/"
					}),
					/* @__PURE__ */ jsx(Link, {
						to: "/contact",
						className: navLinkClass,
						activeProps: { className: "quiet-link opacity-100" },
						"data-cursor": "Write",
						children: "Contact"
					})
				]
			})]
		})
	});
}
//#endregion
//#region src/components/CustomCursor.tsx
/**
* Edition-style custom cursor. A small dot that grows into a pill with
* a label when hovering an element marked data-cursor="<text>".
*
* Only active on hover-capable, fine pointer devices at md+ breakpoints.
*/
function CustomCursor() {
	const dotRef = useRef(null);
	const visibleRef = useRef(false);
	const [label, setLabel] = useState(null);
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
		const onMove = (e) => {
			tx = e.clientX;
			ty = e.clientY;
			if (!visibleRef.current) {
				visibleRef.current = true;
				x = tx;
				y = ty;
			}
			const next = (e.target?.closest("[data-cursor]"))?.dataset.cursor ?? null;
			setLabel((prev) => prev === next ? prev : next);
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
			if (dotRef.current) dotRef.current.style.opacity = visibleRef.current ? "1" : "0";
			x += (tx - x) * .38;
			y += (ty - y) * .38;
			if (dotRef.current) dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
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
	return createPortal(/* @__PURE__ */ jsx("div", {
		ref: dotRef,
		"aria-hidden": true,
		className: "pointer-events-none fixed left-0 top-0 z-[99999] hidden md:flex items-center justify-center",
		style: {
			opacity: 0,
			transition: "opacity 200ms ease"
		},
		children: /* @__PURE__ */ jsx("div", {
			className: "flex items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 ease-out",
			style: {
				width: label ? 92 : 10,
				height: label ? 92 : 10,
				fontSize: 10,
				letterSpacing: "0.18em",
				textTransform: "uppercase",
				boxShadow: "0 0 0 1px rgba(255,255,255,0.45), 0 2px 10px rgba(0,0,0,0.2)"
			},
			children: label
		})
	}), document.body);
}
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "site-container page-top page-bottom flex min-h-dvh items-center justify-center",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-5xl sm:text-7xl",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 font-display text-xl sm:text-2xl",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed",
					children: "This trail doesn't exist. Head back to the gallery."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "nav-label quiet-link interactive-target inline-flex items-center justify-center",
						children: "Return to gallery"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ jsx("div", {
		className: "site-container page-top page-bottom flex min-h-dvh items-center justify-center",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display page-title",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed",
					children: "Something went wrong. Try again or head home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-4",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "nav-label quiet-link interactive-target inline-flex items-center justify-center",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "nav-label quiet-link interactive-target inline-flex items-center justify-center",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$3 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Man of the Alps - Photography" },
			{
				name: "description",
				content: "Travel photography by Man of the Alps. Cities, people, and moments collected on the road."
			},
			{
				name: "author",
				content: "Man of the Alps"
			},
			{
				property: "og:title",
				content: "Man of the Alps - Photography"
			},
			{
				property: "og:description",
				content: "Travel photography - cities, people, and moments."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:site_name",
				content: "Man of the Alps"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function SiteFooter() {
	return /* @__PURE__ */ jsx("footer", {
		className: "site-container py-8 sm:py-10 nav-label flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border",
		children: /* @__PURE__ */ jsxs("span", { children: [
			"© ",
			(/* @__PURE__ */ new Date()).getFullYear(),
			" Man of the Alps"
		] })
	});
}
function RootComponent() {
	const { queryClient } = Route$3.useRouteContext();
	return /* @__PURE__ */ jsxs(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ jsx("a", {
				href: "#main-content",
				className: "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100000] focus:bg-background focus:px-4 focus:py-2 focus:nav-label focus:outline focus:outline-2 focus:outline-foreground",
				children: "Skip to content"
			}),
			/* @__PURE__ */ jsx(SiteHeader, {}),
			/* @__PURE__ */ jsx(CustomCursor, {}),
			/* @__PURE__ */ jsx("main", {
				id: "main-content",
				children: /* @__PURE__ */ jsx(Outlet, {})
			}),
			/* @__PURE__ */ jsx(SiteFooter, {})
		]
	});
}
//#endregion
//#region src/routes/contact.tsx
var $$splitComponentImporter$2 = () => import("./contact-CYJnDTNM.js");
var Route$2 = createFileRoute("/contact")({
	head: () => ({ meta: [
		{ title: "Contact - Man of the Alps" },
		{
			name: "description",
			content: "Drop a note. Share a thought, a story, or just say hello."
		},
		{
			property: "og:title",
			content: "Contact - Man of the Alps"
		},
		{
			property: "og:description",
			content: "Drop a note. Share a thought, a story, or just say hello."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
//#endregion
//#region src/routes/about.tsx
var $$splitComponentImporter$1 = () => import("./about-DS5paApp.js");
var Route$1 = createFileRoute("/about")({
	head: () => ({ meta: [
		{ title: "About - Man of the Alps" },
		{
			name: "description",
			content: "A travel photographer's notebook - cities, people, and moments held in a long, slow archive."
		},
		{
			property: "og:title",
			content: "About - Man of the Alps"
		},
		{
			property: "og:description",
			content: "Notes on the work - cities, people, and moments in time."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter = () => import("./routes-Cwzv42dF.js");
var Route = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Man of the Alps - Gallery" },
		{
			name: "description",
			content: "An ongoing archive of photographs from cities, roads, and people - kept and added to slowly."
		},
		{
			property: "og:title",
			content: "Man of the Alps - Gallery"
		},
		{
			property: "og:description",
			content: "Photographs from cities, roads, and the people in between."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routeTree.gen.ts
var ContactRoute = Route$2.update({
	id: "/contact",
	path: "/contact",
	getParentRoute: () => Route$3
});
var AboutRoute = Route$1.update({
	id: "/about",
	path: "/about",
	getParentRoute: () => Route$3
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$3
	}),
	AboutRoute,
	ContactRoute
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
