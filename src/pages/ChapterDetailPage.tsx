import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { useChapter, useChapterProducts } from "@/hooks/use-store";
import { SEO } from "@/components/SEO";

const ChapterDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: chapter } = useChapter(slug || "");
  const { data: products = [] } = useChapterProducts(chapter);

  if (!chapter) {
    return (
      <Layout>
        <div className="container py-40 text-center">
          <h1 className="font-display text-4xl font-black text-foreground">
            CHAPTER NOT FOUND
          </h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title={chapter.metaTitle || chapter.name}
        description={chapter.metaDescription || chapter.shortDescription}
        image={chapter.coverImage}
        url={`/chapters/${chapter.slug}`}
        keywords={`${chapter.name}, silver jewelry, ${chapter.productTags?.join(', ')}, Bali artisan jewelry, Bambu Silver collection`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": chapter.name,
          "description": chapter.metaDescription || chapter.shortDescription,
          "url": `https://bambusilver.com/chapters/${chapter.slug}`,
          "image": chapter.coverImage,
          "isPartOf": {
            "@type": "WebSite",
            "name": "Bambu Silver by Estela",
            "url": "https://bambusilver.com"
          }
        }}
      />

      {/* Editorial Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={chapter.coverImage}
            alt={chapter.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white" />
        </div>

        <div className="relative z-10 container text-center pt-20">
          <div className="inline-block px-4 py-1 border border-black/10 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">
              Chapter {chapter.narrativeOrder}
            </span>
          </div>
          <h1 className="font-display text-[12vw] md:text-[8vw] font-black text-foreground leading-none tracking-tighter uppercase mb-6">
            {chapter.name}
          </h1>
          <p className="max-w-xl mx-auto text-xl md:text-2xl text-foreground font-light italic leading-relaxed">
            {chapter.shortDescription}
          </p>
        </div>

        <div className="absolute bottom-10 left-10 hidden md:block">
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/20 vertical-text origin-left">
            EST. 2025 • BALI
          </span>
        </div>
      </section>

      {/* The Story - Editorial Layout */}
      <section className="py-24 md:py-40 bg-muted/20 relative overflow-hidden border-y border-black/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />

        <div className="container relative z-10 w-full overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div className="overflow-hidden">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground mb-12 italic leading-none">
                THE
                <br />
                NARRATIVE.
              </h2>
              <div className="space-y-8 max-w-lg">
                {chapter.story.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-lg text-foreground/60 leading-[1.8] font-light"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl skew-x-1 border border-black/5">
                <img
                  src={chapter.coverImage}
                  className="w-full h-full object-cover"
                  alt="Story Detail"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 glass p-10 rounded-2xl max-w-xs shadow-xl ring-1 ring-black/5">
                <p className="text-xs font-black uppercase text-primary mb-4 tracking-widest">
                  A Piece of Bali
                </p>
                <p className="text-sm font-medium italic text-foreground">
                  "We don't just shape silver. We shape energy into something
                  you can hold close."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Pieces - Artistic Grid */}
      <section className="py-32 container relative w-full overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
          <div>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              From Chapter {chapter.narrativeOrder}
            </p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase leading-none">
              THE PIECES.
            </h2>
          </div>
          <p className="text-foreground/40 max-w-xs text-sm uppercase tracking-widest leading-loose">
            Hand-picked selections that define this narrative chapter.
          </p>
        </div>

        <div className="grid gap-x-12 gap-y-24 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p, i) => (
            <div key={p.id} className={`${i % 2 === 1 ? "md:mt-12" : ""}`}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="py-20 text-center glass rounded-[3rem] border-black/5">
            <p className="text-foreground/40 font-black tracking-widest uppercase">
              No products in this chapter yet.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default ChapterDetailPage;
