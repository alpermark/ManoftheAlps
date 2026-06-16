import { createFileRoute } from "@tanstack/react-router";
import portrait from "@/assets/about/portrait.webp";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About - Man of the Alps" },
      { name: "description", content: "A travel photographer's notebook - cities, people, and moments held in a long, slow archive." },
      { property: "og:title", content: "About - Man of the Alps" },
      { property: "og:description", content: "Notes on the work - cities, people, and moments in time." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="site-container pt-28 sm:pt-32 md:pt-40 pb-20 md:pb-28">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-5 md:pt-10">
          <figure className="photo-card aspect-square">
            <img src={portrait} alt="Portrait of the photographer" className="photo-img" />
          </figure>
        </div>

        <div className="md:col-span-7">

          <p className="nav-label opacity-60 mb-6">About</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.1] md:leading-[1.05]">
            I photograph people, cities, and the moments between them - wherever the road goes.
          </h1>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl text-base md:text-[17px] leading-relaxed text-muted-foreground">
            <p>
              <span className="text-foreground">Man of the Alps</span> is a name, not a place. It is the meaning
              of my surname, carried down from the village my grandparents left. The
              work itself is made on the move - in cities I keep returning to, in
              cities I will only ever see once, and in the quiet middle of an
              afternoon when nothing in particular is happening.
            </p>
            <p>
              I work in long series rather than single frames. A waiter folding
              napkins, a square emptying after rain, the same balcony at three
              different hours - all of it belongs together. The archive on this site
              is a working edit; it is meant to be read, not scrolled.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
