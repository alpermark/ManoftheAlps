import { createFileRoute } from "@tanstack/react-router";
import portrait from "@/assets/about/portrait.webp";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About - Man of the Alps" },
      {
        name: "description",
        content:
          "A travel photographer's notebook - cities, people, and moments held in a long, slow archive.",
      },
      { property: "og:title", content: "About - Man of the Alps" },
      {
        property: "og:description",
        content: "Notes on the work - cities, people, and moments in time.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="site-container page-top page-bottom">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
        <div className="md:col-span-5 md:pt-8 lg:pt-10">
          <figure className="photo-card aspect-square max-w-md md:max-w-none mx-auto md:mx-0">
            <img
              src={portrait}
              alt="Portrait of the photographer"
              width={1200}
              height={1200}
              loading="lazy"
              decoding="async"
              className="photo-img"
            />
          </figure>
        </div>

        <div className="md:col-span-7">
          <p className="nav-label opacity-60 mb-5 sm:mb-6">About</p>
          <h1 className="font-display page-title max-w-3xl">
            I photograph people, cities, and the moments between them - wherever
            the road goes.
          </h1>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-3xl text-[15px] sm:text-base md:text-[17px] leading-relaxed text-muted-foreground">
            <p>
              <span className="text-foreground">Man of the Alps</span> is a
              name, not a place. It is the meaning of my surname, carried down
              from the village my grandfather left.
              <br />
              My name is <span className="text-foreground">Mark Alper</span>.
              <br />
              <br />
              The work itself is made on the move - in cities I keep returning
              to, in cities I will only ever see once, and in the quiet middle
              of an afternoon when nothing in particular is happening. A moment
              that feel like eternity.
            </p>
            <p>
              I work in long series rather than single frames. A waiter folding
              napkins, a square emptying after rain, the same balcony at three
              different hours of the day, strangers longing to be seen - all of
              it belongs together.
              <br />
              <br />
              The archive on this site is a working edit, never completed, never
              silent. It is meant to be read, not scrolled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
