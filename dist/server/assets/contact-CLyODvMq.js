import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/contact.tsx?tsr-split=component
function ContactPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "site-container page-top page-bottom min-h-dvh",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "nav-label opacity-60",
				children: "Contact"
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "font-display page-title-lg mt-3 sm:mt-4 max-w-4xl",
				children: "Share yourself. Write a letter. A note. Sing something."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-16 max-w-5xl",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "nav-label opacity-50 mb-2",
						children: "Email"
					}), /* @__PURE__ */ jsx("a", {
						href: "mailto:mark@manofthealps.com",
						className: "font-display text-xl sm:text-2xl md:text-3xl quiet-link break-all",
						"data-cursor": "Write",
						children: "mark@manofthealps.com"
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "nav-label opacity-50 mb-2",
						children: "Instagram"
					}), /* @__PURE__ */ jsx("a", {
						href: "https://instagram.com/alpermark",
						target: "_blank",
						rel: "noreferrer",
						className: "font-display text-xl sm:text-2xl md:text-3xl quiet-link",
						"data-cursor": "Open",
						children: "@alpermark"
					})] }),
					/* @__PURE__ */ jsxs("div", {
						className: "sm:col-span-2 md:col-span-1",
						children: [/* @__PURE__ */ jsx("p", {
							className: "nav-label opacity-50 mb-2",
							children: "Based"
						}), /* @__PURE__ */ jsxs("p", {
							className: "font-display text-xl sm:text-2xl md:text-3xl leading-snug",
							children: [
								"London",
								/* @__PURE__ */ jsx("br", {}),
								/* @__PURE__ */ jsx("span", {
									className: "font-sans text-sm sm:text-base opacity-60",
									children: "United Kingdom"
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-16 sm:mt-20 md:mt-24 max-w-2xl",
				children: /* @__PURE__ */ jsx("p", {
					className: "text-muted-foreground text-[15px] sm:text-base leading-relaxed",
					children: "This is not a place for business. It is a place for people. If you have a story, a thought, or simply want to share a piece of yourself, write. I read every message and reply when I can."
				})
			})
		]
	});
}
//#endregion
export { ContactPage as component };
