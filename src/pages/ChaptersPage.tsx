import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProductImage } from "@/components/ProductImage";
import { useChapters } from "@/hooks/use-store";
import { SEO } from "@/components/SEO";

import { Button } from "@/components/ui/button";

const ChaptersPage = () => {
  const { data: chapters = [] } = useChapters();

  return (
    <Layout>
      <SEO 
        title="The Collections" 
        description="Discover the narrative collections of Bambu Silver. From raw artisan crafts to signature silver pieces, each chapter tells a story of Bali."
      />

      <section className="container pt-40 pb-32">
        <div className="mb-24 px-4">
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4">
            The Narrative Arc
          </p>
          <h1 className="font-display text-7xl md:text-9xl font-black text-foreground tracking-tighter leading-[0.8]">
            THE
            <br />
            <span className="italic text-gradient-vibrant">CHAPTERS.</span>
          </h1>
        </div>

        <div className="flex flex-col gap-24 md:gap-40">
          {chapters.map((ch, i) => (
            <Link
              key={ch.id}
              to={`/chapters/${ch.slug}`}
              className={`group flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-12 items-center`}
            >
              <div className="relative flex-1 w-full overflow-hidden rounded-[3rem] aspect-[4/3] md:aspect-auto md:h-[600px] shadow-2xl skew-y-1 group-hover:skew-y-0 transition-transform duration-1000 border border-black/5">
                <img
                  src={ch.coverImage}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                  alt={ch.name}
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-40 group-hover:opacity-0 transition-opacity" />
              </div>

              <div className="flex-1 space-y-8 px-4">
                <div className="inline-block px-4 py-1 border border-primary/20 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Chapter {ch.narrativeOrder}
                  </span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors leading-none uppercase">
                  {ch.name}
                </h2>
                <p className="text-xl md:text-2xl text-foreground/40 font-light leading-relaxed max-w-md">
                  {ch.shortDescription}
                </p>
                <div className="pt-4">
                  <Button
                    variant="ghost"
                    className="rounded-full px-0 hover:bg-transparent group-hover:translate-x-4 transition-transform font-black uppercase tracking-[0.3em] text-[10px] text-primary"
                  >
                    EXPLORE CHAPTER →
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Decorative large text */}
      <div className="fixed bottom-0 left-0 w-full opacity-[0.02] select-none pointer-events-none -z-10 translate-y-1/2">
        <span className="text-[40vw] font-black tracking-tighter italic whitespace-nowrap">
          BAMBU SILVER
        </span>
      </div>
    </Layout>
  );
};

export default ChaptersPage;
