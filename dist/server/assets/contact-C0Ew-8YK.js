import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/contact.tsx?tsr-split=component
function ContactPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "site-container pt-28 sm:pt-32 md:pt-40 pb-20 md:pb-28 min-h-dvh",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "nav-label opacity-60",
				children: "Contact"
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "font-display text-5xl md:text-8xl mt-4 leading-[0.95]",
				children: "Write a letter."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 max-w-5xl",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "nav-label opacity-50 mb-2",
						children: "Email"
					}), /* @__PURE__ */ jsx("a", {
						href: "mailto:hello@manofthealps.com",
						className: "font-display text-2xl md:text-3xl quiet-link",
						"data-cursor": "Copy",
						children: "hello@manofthealps.com"
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "nav-label opacity-50 mb-2",
						children: "Instagram"
					}), /* @__PURE__ */ jsx("a", {
						href: "https://instagram.com/",
						target: "_blank",
						rel: "noreferrer",
						className: "font-display text-2xl md:text-3xl quiet-link",
						"data-cursor": "Open",
						children: "@manofthealps"
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "nav-label opacity-50 mb-2",
						children: "Based"
					}), /* @__PURE__ */ jsxs("p", {
						className: "font-display text-2xl md:text-3xl",
						children: [
							"London",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("span", {
								className: "font-sans text-base opacity-60",
								children: "United Kingdom"
							})
						]
					})] })
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-24 max-w-2xl",
				children: /* @__PURE__ */ jsx("p", {
					className: "text-muted-foreground text-[15px] leading-relaxed",
					children: "This is not a place for business. It is a place for people. If you have a story, a thought, or simply want to share a piece of yourself, write. I read every message and reply when I can."
				})
			})
		]
	});
}
//#endregion
export { ContactPage as component };
