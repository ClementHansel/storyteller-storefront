import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { useProducts, useChapters } from '@/hooks/use-store';
import { storeName, storeTagline } from '@/config/store-config';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import heroModel from '@/assets/hero-model.jpg';
import modelRings from '@/assets/model-rings.jpg';
import modelNecklace from '@/assets/model-necklace.jpg';

const Index = () => {
  const { data: products = [] } = useProducts();
  const { data: chapters = [] } = useChapters();
  const featured = products.slice(0, 8);
  const featuredChapters = chapters.slice(0, 3);

  useDocumentTitle(`${storeName} — Bold Silver Jewelry, Bali`);

  return (
    <Layout>
      {/* Hero — bold split layout with model */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Color accent blocks */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-vibrant-gradient opacity-90 hidden md:block" />
        <div className="absolute top-0 left-0 w-full md:w-1/2 h-full bg-background" />

        <div className="relative z-10 container grid md:grid-cols-2 gap-8 items-center">
          {/* Left — text */}
          <div className="py-16 md:py-0 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Handcrafted in Bali</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-[0.95] text-foreground">
              Wear Your<br />
              <span className="text-gradient-vibrant">Boldest Self</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-md">
              Silver 925 jewelry that pops. Designed for the vibrant, the creative, the unapologetically bold.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Button asChild size="lg" className="rounded-full px-8 font-bold text-sm bg-primary hover:bg-primary/90">
                <Link to="/chapters">Explore Collections <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 font-bold text-sm border-foreground/20 hover:bg-foreground hover:text-background">
                <Link to="/search">Shop All</Link>
              </Button>
            </div>
          </div>

          {/* Right — model image */}
          <div className="relative hidden md:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>
              <img src={heroModel} alt="Model wearing bold silver jewelry" className="w-full h-[70vh] object-cover" />
            </div>
            {/* Floating accent card */}
            <div className="absolute -bottom-6 -left-8 bg-background rounded-2xl shadow-xl p-4 animate-float">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">New Drop</p>
              <p className="font-display text-lg font-bold text-foreground">Silver & Soul</p>
            </div>
          </div>
        </div>
      </section>

      {/* Model showcase strip */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-2xl overflow-hidden">
              <img src={modelRings} alt="Silver rings on model's hand" className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">The Art of Adornment</p>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                Every Piece is a <span className="text-primary">Statement</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                From bold stacking rings to sculptural pendants — each piece is handcrafted by Balinese artisans
                who pour generations of skill into every curve and polish.
              </p>
              <Button asChild variant="outline" className="rounded-full font-bold border-foreground/20 hover:bg-foreground hover:text-background">
                <Link to="/search">Discover Pieces <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="container py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Curated Stories</p>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground">Collections</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {featuredChapters.map((ch, i) => (
            <Link
              key={ch.id}
              to={`/chapters/${ch.slug}`}
              className="group animate-fade-in rounded-2xl overflow-hidden bg-card hover:shadow-xl transition-shadow duration-500"
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
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Chapter {ch.narrativeOrder}</p>
                <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {ch.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{ch.shortDescription}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/chapters" className="text-sm font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors">
            View All Collections →
          </Link>
        </div>
      </section>

      {/* Bold quote */}
      <section className="bg-vibrant-gradient py-20">
        <div className="container text-center max-w-3xl">
          <blockquote className="font-display text-3xl md:text-5xl font-extrabold text-primary-foreground leading-tight">
            "Life is too short for boring jewelry."
          </blockquote>
          <p className="mt-4 text-primary-foreground/70 text-sm font-medium uppercase tracking-widest">— The Bambu Philosophy</p>
        </div>
      </section>

      {/* Necklace showcase */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">New Collection</p>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                Designed to<br /><span className="text-gradient-warm">Turn Heads</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Sterling silver that catches the light and commands attention. Pearls, stones, and precious metals woven into wearable art.
              </p>
              <Button asChild className="rounded-full font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Link to="/chapters">See What's New <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="rounded-2xl overflow-hidden order-1 md:order-2">
              <img src={modelNecklace} alt="Silver necklace and earrings" className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Best Sellers</p>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground">Featured Pieces</h2>
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
