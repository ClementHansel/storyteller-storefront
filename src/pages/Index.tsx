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
  const featured = products.slice(0, 4);
  const featuredChapters = chapters.slice(0, 3);

  return (
    <Layout>
      {/* SEO */}
      <title>{storeName} — Silver 925 Jewelry, Pearls, Stones</title>
      <meta name="description" content={storeTagline} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-card">
        <div className="container py-20 md:py-32">
          <div className="max-w-2xl space-y-6 animate-fade-in">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-gold">Handcrafted Silver</p>
            <h1 className="font-serif text-4xl font-bold leading-tight text-foreground md:text-6xl">
              Every Piece Tells<br />a Story
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              {storeTagline}. Discover collections curated around the narratives that inspire our craft.
            </p>
            <div className="flex gap-3">
              <Button asChild size="lg">
                <Link to="/chapters">Explore Chapters <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/search">Browse All</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Chapters */}
      <section className="container py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-gold mb-2">Our Stories</p>
            <h2 className="font-serif text-3xl font-bold text-foreground">Story Chapters</h2>
          </div>
          <Link to="/chapters" className="text-sm font-medium text-primary hover:underline hidden md:block">
            View all chapters →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredChapters.map((ch) => (
            <Link key={ch.id} to={`/chapters/${ch.slug}`} className="group">
              <ProductImage src={ch.coverImage} alt={ch.name} aspectRatio="landscape" className="rounded-sm" />
              <h3 className="mt-3 font-serif text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {ch.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ch.shortDescription}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-card py-16 md:py-24">
        <div className="container">
          <div className="mb-10">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-gold mb-2">Curated Selection</p>
            <h2 className="font-serif text-3xl font-bold text-foreground">Featured Pieces</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
