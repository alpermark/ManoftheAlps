import { useEffect, useRef, useState } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createPortal } from "react-dom";
//#region src/styles.css?url
var styles_default = "/assets/styles-T0Yx6hYs.css";
//#endregion
//#region src/components/SiteHeader.tsx
function SiteHeader() {
	return /* @__PURE__ */ jsx("header", {
		className: "fixed top-0 left-0 right-0 z-50 text-foreground",
		children: /* @__PURE__ */ jsxs("div", {
			className: "site-container py-4 sm:py-5 md:py-6 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4",
			children: [/* @__PURE__ */ jsx(Link, {
				to: "/",
				className: "nav-label hidden sm:inline-block",
				"data-cursor": "Home",
				children: "Man of the Alps"
			}), /* @__PURE__ */ jsxs("nav", {
				className: "flex items-center justify-center gap-5 md:gap-8 nav-label",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "quiet-link",
						activeOptions: { exact: true },
						activeProps: { className: "quiet-link opacity-100" },
						"data-cursor": "View",
						children: "Gallery"
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": true,
						className: "opacity-40",
						children: "/"
					}),
					/* @__PURE__ */ jsx(Link, {
						to: "/about",
						className: "quiet-link",
						activeProps: { className: "quiet-link opacity-100" },
						"data-cursor": "Read",
						children: "About"
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": true,
						className: "opacity-40",
						children: "/"
					}),
					/* @__PURE__ */ jsx(Link, {
						to: "/contact",
						className: "quiet-link",
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
* Only active on hover-capable, fine pointer devices.
*/
function CustomCursor() {
	const dotRef = useRef(null);
	const [label, setLabel] = useState(null);
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
		document.documentElement.classList.add("has-custom-cursor");
		let raf = 0;
		let x = window.innerWidth / 2;
		let y = window.innerHeight / 2;
		let tx = x;
		let ty = y;
		const onMove = (e) => {
			tx = e.clientX;
			ty = e.clientY;
			if (!visible) setVisible(true);
			const next = (e.target?.closest("[data-cursor]"))?.dataset.cursor ?? null;
			setLabel((prev) => prev === next ? prev : next);
		};
		const onLeave = () => setVisible(false);
		const tick = () => {
			x += (tx - x) * .22;
			y += (ty - y) * .22;
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
	}, [visible]);
	const cursor = /* @__PURE__ */ jsx("div", {
		ref: dotRef,
		"aria-hidden": true,
		className: "pointer-events-none fixed left-0 top-0 z-[99999] hidden md:flex items-center justify-center",
		style: {
			opacity: visible ? 1 : 0,
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
	});
	if (typeof document === "undefined") return null;
	return createPortal(cursor, document.body);
}
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "site-container flex min-h-dvh items-center justify-center",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-7xl",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 font-display text-2xl",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "This trail doesn't exist. Head back to the gallery."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "nav-label quiet-link",
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
		className: "site-container flex min-h-dvh items-center justify-center",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-3xl",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong. Try again or head home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-4",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "nav-label quiet-link",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "nav-label quiet-link",
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
	return /* @__PURE__ */ jsxs("footer", {
		className: "site-container py-10 nav-label flex flex-wrap items-center justify-between gap-4 border-t border-border",
		children: [/* @__PURE__ */ jsxs("span", { children: [
			"© ",
			(/* @__PURE__ */ new Date()).getFullYear(),
			" Man of the Alps"
		] }), /* @__PURE__ */ jsx("span", {
			className: "opacity-60",
			children: "On the road"
		})]
	});
}
function RootComponent() {
	const { queryClient } = Route$3.useRouteContext();
	return /* @__PURE__ */ jsxs(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ jsx(SiteHeader, {}),
			/* @__PURE__ */ jsx(CustomCursor, {}),
			/* @__PURE__ */ jsx("main", { children: /* @__PURE__ */ jsx(Outlet, {}) }),
			/* @__PURE__ */ jsx(SiteFooter, {})
		]
	});
}
//#endregion
//#region src/routes/contact.tsx
var $$splitComponentImporter$2 = () => import("./contact-C0Ew-8YK.js");
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
var $$splitComponentImporter$1 = () => import("./about-BOjsC6SV.js");
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
var $$splitComponentImporter = () => import("./routes-DZCRlCL7.js");
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
