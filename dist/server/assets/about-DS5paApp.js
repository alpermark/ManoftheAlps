import { jsx, jsxs } from "react/jsx-runtime";
//#region src/assets/about/portrait.webp
var portrait_default = "/assets/portrait-CbPZESJv.webp";
//#endregion
//#region src/routes/about.tsx?tsr-split=component
function AboutPage() {
	return /* @__PURE__ */ jsx("div", {
		className: "site-container page-top page-bottom",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start",
			children: [/* @__PURE__ */ jsx("div", {
				className: "md:col-span-5 md:pt-8 lg:pt-10",
				children: /* @__PURE__ */ jsx("figure", {
					className: "photo-card aspect-square max-w-md md:max-w-none mx-auto md:mx-0",
					children: /* @__PURE__ */ jsx("img", {
						src: portrait_default,
						alt: "Portrait of the photographer",
						width: 1200,
						height: 1200,
						loading: "lazy",
						decoding: "async",
						className: "photo-img"
					})
				})
			}), /* @__PURE__ */ jsxs("div", {
				className: "md:col-span-7",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "nav-label opacity-60 mb-5 sm:mb-6",
						children: "About"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "font-display page-title max-w-3xl",
						children: "I photograph people, cities, and the moments between them - whatever life presents in front of me."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-3xl text-[15px] sm:text-base md:text-[17px] leading-relaxed text-muted-foreground",
						children: [/* @__PURE__ */ jsxs("p", { children: [
							/* @__PURE__ */ jsx("span", {
								className: "text-foreground",
								children: "Man of the Alps"
							}),
							" is a name, not a place. It is the meaning of my surname, carried down from the village my grandfather left.",
							/* @__PURE__ */ jsx("br", {}),
							"My name is ",
							/* @__PURE__ */ jsx("span", {
								className: "text-foreground",
								children: "Mark Alper"
							}),
							".",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("br", {}),
							"The work itself is made on the move - in cities I keep returning to, in cities I will only ever see once, and in the quiet middle of an afternoon when nothing in particular is happening. A moment that feel like eternity."
						] }), /* @__PURE__ */ jsxs("p", { children: [
							"I work in long series rather than single frames. A waiter folding napkins, a square emptying after rain, the same balcony at three different hours of the day, strangers longing to be seen - all of it belongs together.",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("br", {}),
							"The archive on this site is a working edit, never completed, never silent. It is meant to be read, not scrolled."
						] })]
					})
				]
			})]
		})
	});
}
//#endregion
export { AboutPage as component };
