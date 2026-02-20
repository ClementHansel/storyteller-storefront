import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { useProducts, useChapters } from '@/hooks/use-store';
import { storeName, storeTagline } from '@/config/store-config';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  const { data: products = [] } = useProducts();
  const { data: chapters = [] } = useChapters();
  const featured = products.slice(0, 8);
  const featuredChapters = chapters.slice(0, 3);

  return (
    <Layout>
      <title>{storeName} — Silver 925 Jewelry, Pearls, Stones</title>
      <meta name="description" content={storeTagline} />

      {/* Hero — full-bleed background image like Yin Jewelry */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Centered content */}
        <div className="relative z-10 text-center max-w-2xl mx-auto px-6 animate-fade-in-up">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70 mb-6">
            Handcrafted Silver · Since 2024
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-light leading-[1.1] text-white">
            Every Piece<br />
            <span className="italic">Tells a Story</span>
          </h1>
          <p className="mt-6 text-base text-white/70 leading-relaxed max-w-md mx-auto font-light">
            {storeTagline}. Discover collections curated around the narratives that inspire our craft.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Button asChild size="lg" className="rounded-none px-8 tracking-wider text-xs uppercase bg-white text-black hover:bg-white/90">
              <Link to="/chapters">Explore Collections <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-none px-8 tracking-wider text-xs uppercase border-white/40 text-white hover:bg-white/10">
              <Link to="/search">Shop All</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Chapters */}
      <section className="container py-20 md:py-28">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">Our Stories</p>
          <h2 className="font-serif text-4xl font-light text-foreground">Collections</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {featuredChapters.map((ch, i) => (
            <Link
              key={ch.id}
              to={`/chapters/${ch.slug}`}
              className="group animate-fade-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="overflow-hidden">
                <ProductImage
                  src={ch.coverImage}
                  alt={ch.name}
                  aspectRatio="portrait"
                  className="transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-1">Chapter {ch.narrativeOrder}</p>
                <h3 className="font-serif text-2xl font-light text-foreground group-hover:text-accent transition-colors">
                  {ch.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 font-light">{ch.shortDescription}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/chapters" className="text-xs font-semibold uppercase tracking-[0.2em] text-accent hover:text-foreground transition-colors">
            View All Collections →
          </Link>
        </div>
      </section>

      {/* Divider quote */}
      <section className="border-y border-border/50 py-16 md:py-20">
        <div className="container text-center max-w-2xl">
          <blockquote className="font-serif text-2xl md:text-3xl font-light italic text-foreground/80 leading-relaxed">
            "Jewelry is a way of keeping memories close — each piece a chapter in the story of your life."
          </blockquote>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">Curated Selection</p>
            <h2 className="font-serif text-4xl font-light text-foreground">Featured Pieces</h2>
          </div>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => (
              <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
