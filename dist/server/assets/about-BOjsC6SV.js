import { jsx, jsxs } from "react/jsx-runtime";
//#region src/assets/about/portrait.webp
var portrait_default = "/assets/portrait-CbPZESJv.webp";
//#endregion
//#region src/routes/about.tsx?tsr-split=component
function AboutPage() {
	return /* @__PURE__ */ jsx("div", {
		className: "site-container pt-28 sm:pt-32 md:pt-40 pb-20 md:pb-28",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16",
			children: [/* @__PURE__ */ jsx("div", {
				className: "md:col-span-5 md:pt-10",
				children: /* @__PURE__ */ jsx("figure", {
					className: "photo-card aspect-square",
					children: /* @__PURE__ */ jsx("img", {
						src: portrait_default,
						alt: "Portrait of the photographer",
						className: "photo-img"
					})
				})
			}), /* @__PURE__ */ jsxs("div", {
				className: "md:col-span-7",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "nav-label opacity-60 mb-6",
						children: "About"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "font-display text-4xl md:text-6xl leading-[1.1] md:leading-[1.05]",
						children: "I photograph people, cities, and the moments between them - wherever the road goes."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl text-base md:text-[17px] leading-relaxed text-muted-foreground",
						children: [/* @__PURE__ */ jsxs("p", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-foreground",
							children: "Man of the Alps"
						}), " is a name, not a place. It is the meaning of my surname, carried down from the village my grandparents left. The work itself is made on the move - in cities I keep returning to, in cities I will only ever see once, and in the quiet middle of an afternoon when nothing in particular is happening."] }), /* @__PURE__ */ jsx("p", { children: "I work in long series rather than single frames. A waiter folding napkins, a square emptying after rain, the same balcony at three different hours - all of it belongs together. The archive on this site is a working edit; it is meant to be read, not scrolled." })]
					})
				]
			})]
		})
	});
}
//#endregion
export { AboutPage as component };
