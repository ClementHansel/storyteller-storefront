import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { useProducts, useChapters } from '@/hooks/use-store';
import { storeName, storeTagline } from '@/config/store-config';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  const { data: products = [] } = useProducts();
  const { data: chapters = [] } = useChapters();
  const featured = products.slice(0, 8);
  const featuredChapters = chapters.slice(0, 3);

  return (
    <Layout>
      <title>{storeName} — Silver 925 Jewelry, Pearls, Stones</title>
      <meta name="description" content={storeTagline} />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center bg-card">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="container relative py-24 md:py-32">
          <div className="max-w-2xl space-y-8 animate-fade-in-up">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Handcrafted Silver · Since 2024</p>
            <h1 className="font-serif text-5xl font-light leading-[1.1] text-foreground md:text-7xl">
              Every Piece<br />
              <span className="italic">Tells a Story</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md font-light">
              {storeTagline}. Discover collections curated around the narratives that inspire our craft.
            </p>
            <div className="flex gap-4 pt-2">
              <Button asChild size="lg" className="rounded-none px-8 tracking-wider text-xs uppercase">
                <Link to="/chapters">Explore Collections <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-none px-8 tracking-wider text-xs uppercase">
                <Link to="/search">Shop All</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Chapters */}
      <section className="container py-20 md:py-28">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">Our Stories</p>
            <h2 className="font-serif text-4xl font-light text-foreground">Collections</h2>
          </div>
          <Link to="/chapters" className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors hidden md:block">
            View All →
          </Link>
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
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-1">Chapter {ch.narrativeOrder}</p>
                <h3 className="font-serif text-2xl font-light text-foreground group-hover:text-accent transition-colors">
                  {ch.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 font-light">{ch.shortDescription}</p>
              </div>
            </Link>
          ))}
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
          <div className="mb-12">
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
