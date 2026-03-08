import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { useChapter, useChapterProducts } from "@/hooks/use-store";
import { useDocumentTitle } from "@/hooks/use-document-title";

const ChapterDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: chapter } = useChapter(slug || "");
  const { data: products = [] } = useChapterProducts(chapter);

  useDocumentTitle(
    chapter ? `${chapter.name} — Bambu Silver` : "Collection — Bambu Silver",
  );

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
      {/* Editorial Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={chapter.coverImage}
            alt={chapter.name}
            className="w-full h-full object-cover grayscale brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-ink" />
        </div>

        <div className="relative z-10 container text-center pt-20">
          <div className="inline-block px-4 py-1 border border-white/20 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
              Chapter {chapter.narrativeOrder}
            </span>
          </div>
          <h1 className="font-display text-[12vw] md:text-[8vw] font-black text-white leading-none tracking-tighter uppercase mb-6">
            {chapter.name}
          </h1>
          <p className="max-w-xl mx-auto text-xl md:text-2xl text-white/50 font-light italic leading-relaxed">
            {chapter.shortDescription}
          </p>
        </div>

        <div className="absolute bottom-10 left-10 hidden md:block">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20 vertical-text origin-left">
            EST. 2025 • BALI
          </span>
        </div>
      </section>

      {/* The Story - Editorial Layout */}
      <section className="py-24 md:py-40 bg-ink relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-12 italic leading-none">
                THE
                <br />
                NARRATIVE.
              </h2>
              <div className="space-y-8 max-w-lg">
                {chapter.story.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-lg text-white/40 leading-[1.8] font-light"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl skew-x-1">
                <img
                  src={chapter.coverImage}
                  className="w-full h-full object-cover grayscale"
                  alt="Story Detail"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 glass p-10 rounded-2xl max-w-xs">
                <p className="text-xs font-black uppercase text-primary mb-4 tracking-widest">
                  A Piece of Bali
                </p>
                <p className="text-sm font-medium italic">
                  "We don't just shape silver. We shape energy into something
                  you can hold close."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Pieces - Artistic Grid */}
      <section className="py-32 container relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
          <div>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              From Chapter {chapter.narrativeOrder}
            </p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase">
              THE PIECES.
            </h2>
          </div>
          <p className="text-white/40 max-w-xs text-sm uppercase tracking-widest leading-loose">
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
          <div className="py-20 text-center glass rounded-[3rem]">
            <p className="text-white/40 font-black tracking-widest uppercase">
              No products in this chapter yet.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default ChapterDetailPage;
