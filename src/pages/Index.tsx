import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { useProducts, useChapters } from "@/hooks/use-store";
import { storeName, storeTagline } from "@/config/store-config";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroModel from "@/assets/hero-model.jpg";
import modelRings from "@/assets/model-rings.jpg";
import modelNecklace from "@/assets/model-necklace.jpg";

const Index = () => {
  const { data: products = [] } = useProducts();
  const { data: chapters = [] } = useChapters();
  const featured = products.slice(0, 8);
  const featuredChapters = chapters.slice(0, 4);

  useDocumentTitle(`${storeName} — Bold Silver Jewelry, Bali`);

  return (
    <Layout>
      {/* Hero — Extreme Impact */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax-like feel */}
        <div className="absolute inset-0 z-0 scale-105 animate-float opacity-40">
          <img
            src={heroModel}
            alt="Hero model"
            className="w-full h-full object-cover grayscale"
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-[120px] animate-pulse" />

        <div className="relative z-10 w-full text-center px-4">
          <div
            className="inline-block px-4 py-1 border border-white/20 rounded-full mb-8 animate-reveal opacity-0"
            style={{ animationDelay: "200ms" }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
              Crafted in Bali • 925 Sterling
            </span>
          </div>

          <h1 className="font-display text-[14vw] md:text-[10vw] font-black leading-[0.85] tracking-tighter text-white mix-blend-overlay">
            SILVER
            <br />
            <span className="text-gradient-vibrant italic">SOUL</span>
          </h1>

          <p
            className="mt-8 text-lg md:text-xl text-white/50 font-light max-w-xl mx-auto uppercase tracking-widest animate-reveal opacity-0"
            style={{ animationDelay: "600ms" }}
          >
            Unapologetic jewelry for the bold and the visionary.
          </p>

          <div
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 animate-reveal opacity-0"
            style={{ animationDelay: "800ms" }}
          >
            <Button
              asChild
              size="lg"
              className="rounded-full h-16 px-12 bg-white text-black hover:bg-primary hover:text-white transition-all duration-500 font-black text-xs tracking-widest uppercase"
            >
              <Link to="/search">Explore Pieces</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="rounded-full h-16 px-12 text-white hover:bg-white/10 font-black text-xs tracking-widest uppercase border border-white/10"
            >
              <Link to="/chapters">The Collections</Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-shimmer" />
        </div>
      </section>

      {/* Intro - Bold Statement */}
      <section className="py-32 container">
        <div className="grid md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-7">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-8">
              WE DON'T DO
              <br />
              <span className="text-primary italic">BASIC.</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl font-light">
              Bambu Silver is a rebellion against the mundane. Every curve,
              every polish, every piece of 925 sterling silver is hand-forged by
              artisans who understand that jewelry is an extension of your
              energy.
            </p>
          </div>
          <div className="md:col-span-5 relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl skew-x-1 hover:skew-x-0 transition-transform duration-700">
              <img
                src={modelRings}
                className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-1000"
                alt="Detail"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 glass p-8 rounded-2xl max-w-[240px] hidden lg:block">
              <p className="text-xs font-black uppercase text-primary mb-2">
                Artisan Edge
              </p>
              <p className="text-sm font-medium">
                Over 200 hours of craftsmanship in every single collection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapters/Collections - Masonryish grid */}
      <section className="py-32 bg-ink/50 backdrop-blur-3xl relative overflow-hidden">
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20">
            <div>
              <p className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-4">
                The Narrative
              </p>
              <h2 className="text-6xl md:text-7xl font-black tracking-tighter">
                COLLECTIONS
              </h2>
            </div>
            <Link
              to="/chapters"
              className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors py-4 md:py-0"
            >
              View All Chapters →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredChapters.map((ch, i) => (
              <Link
                key={ch.id}
                to={`/chapters/${ch.slug}`}
                className={`group relative overflow-hidden rounded-2xl aspect-[3/4] ${i % 2 === 1 ? "md:mt-12" : ""}`}
              >
                <div className="absolute inset-0 bg-black/60 opacity-20 group-hover:opacity-60 transition-opacity duration-700 z-10" />
                <img
                  src={ch.coverImage}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  alt={ch.name}
                />
                <div className="absolute inset-x-0 bottom-0 p-8 z-20 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Chapter {ch.narrativeOrder}
                  </p>
                  <h3 className="text-3xl font-black text-white leading-none mb-4">
                    {ch.name}
                  </h3>
                  <Button
                    variant="outline"
                    className="w-fit rounded-full border-white/20 text-white bg-white/5 hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Explore
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Horizontal Scroll or Unique Grid */}
      <section className="py-32 container">
        <div className="text-center mb-20 px-4">
          <h2 className="text-5xl md:text-8xl font-black tracking-[calc(-0.04em)] mb-6 text-gradient-vibrant">
            MUST HAVES
          </h2>
          <p className="text-muted-foreground uppercase tracking-[0.5em] text-xs">
            Curated selection for the season
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {featured.map((p, i) => (
            <div key={p.id} className="group relative">
              <ProductCard product={p} />
              <div className="absolute -top-4 -right-4 bg-primary text-white text-[10px] font-black w-10 h-10 rounded-full flex items-center justify-center rotate-12 scale-0 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                HOT
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA - The Vibe */}
      <section className="relative py-40 overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-20 flex items-center justify-center select-none pointer-events-none">
          <span className="text-[40vw] font-black tracking-tighter text-white whitespace-nowrap animate-shimmer">
            BAMBU
          </span>
        </div>
        <div className="container relative z-10 text-center">
          <h2 className="text-5xl md:text-9xl font-black text-white italic tracking-tighter mb-12">
            BE UNFORGETTABLE.
          </h2>
          <Button
            asChild
            className="rounded-full bg-white text-primary hover:bg-black hover:text-white transition-all size-32 text-xs font-black uppercase tracking-widest flex flex-col gap-2"
          >
            <Link to="/search">
              <span>Shop</span>
              <span>Now</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Newsletter - Glassy */}
      <section className="py-32 container">
        <div className="glass-dark rounded-[40px] p-12 md:p-24 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]" />
          <div className="relative z-10 flex-1">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
              JOIN THE INNER
              <br />
              <span className="text-primary italic">CIRCLE.</span>
            </h2>
            <p className="text-white/60 font-light max-w-sm">
              Early access to drops, exclusive events, and a peek into the soul
              of Bali.
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="YOUR EMAIL"
              className="bg-white/5 border border-white/10 rounded-full px-8 py-5 text-white w-full sm:w-[300px] font-black text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="rounded-full h-16 px-10 bg-primary hover:bg-white hover:text-primary transition-all font-black text-xs uppercase tracking-widest">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
