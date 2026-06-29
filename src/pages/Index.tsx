import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-store";
import { storeName, storeTagline } from "@/config/store-config";
import { getAllCategories, deriveCategoriesFromProducts } from "@/config/category-mapping";
import { SEO } from "@/components/SEO";

import { Button } from "@/components/ui/button";
import { HomeBoutiqueSection } from "@/components/HomeBoutiqueSection";
import { HomeBlogSection } from "@/components/HomeBlogSection";
import heroModel from "@/assets/hero-model.jpg";
import modelRings from "@/assets/model-rings.jpg";

// Static categories for immediate render (no product load needed)
const staticCategories = getAllCategories().slice(0, 8);

const Index = () => {
  const { data: products = [], isLoading } = useProducts();
  const featured = products.filter((p) => p.inStock).slice(0, 8).length > 0
    ? products.filter((p) => p.inStock).slice(0, 8)
    : products.slice(0, 8);

  // Once products load, show categories with counts; otherwise show static names
  const topCategories = useMemo(() => {
    if (products.length > 0) {
      return deriveCategoriesFromProducts(products).slice(0, 8);
    }
    return staticCategories.map((c) => ({ ...c, count: 0 }));
  }, [products]);

  return (
    <Layout>
      <SEO 
        title="Handcrafted Sterling Silver Jewelry from Bali"
        description="Explore the soul of Bali through hand-forged .925 sterling silver jewelry. Shop artisan rings, necklaces, bracelets, and exclusive collections. Free worldwide shipping."
        url="/"
        keywords="silver jewelry Bali, handcrafted sterling silver, artisan silver rings, Bali necklace, Bambu Silver, Estela jewelry, handmade bracelet, 925 sterling silver"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Bambu Silver by Estela — Handcrafted Sterling Silver Jewelry",
          "description": "Hand-forged .925 sterling silver jewelry crafted by Balinese artisans. Shop rings, necklaces, bracelets, and exclusive collections.",
          "url": "https://bambusilver.com",
          "mainEntity": {
            "@type": "ItemList",
            "name": "Featured Collections",
            "numberOfItems": featured.length,
            "itemListElement": featured.slice(0, 6).map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "item": {
                "@type": "Product",
                "name": p.title,
                "url": `https://bambusilver.com/product/${p.slug}`,
                "image": p.images[0],
                "offers": {
                  "@type": "Offer",
                  "price": p.price,
                  "priceCurrency": p.currency,
                  "availability": p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
              }
            }))
          }
        }}
      />

      {/* Hero — Extreme Impact */}

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 scale-105 animate-float opacity-20">
          <img src={heroModel} alt="Bambu Silver hero" className="w-full h-full object-cover" />
        </div>
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-[120px] animate-pulse" />

        <div className="relative z-10 w-full text-center px-4 max-w-7xl mx-auto">
          <div className="inline-block px-4 py-1 border border-border rounded-full mb-8 animate-reveal opacity-0" style={{ animationDelay: "200ms" }}>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">
              Crafted in Bali • 925 Sterling
            </span>
          </div>
          <h1 className="font-display text-[14vw] md:text-[10vw] font-black leading-[0.85] tracking-tighter text-foreground">
            SILVER<br /><span className="text-gradient-vibrant italic">SOUL</span>
          </h1>
          <p className="mt-8 text-base sm:text-lg md:text-xl text-foreground/40 font-light max-w-xl mx-auto uppercase tracking-widest animate-reveal opacity-0" style={{ animationDelay: "600ms" }}>
            Unapologetic jewelry for the bold and the visionary.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-reveal opacity-0" style={{ animationDelay: "800ms" }}>
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full h-14 sm:h-16 px-10 sm:px-12 bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-500 font-black text-xs tracking-widest uppercase shadow-xl">
              <Link to="/search">Shop All Pieces</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full h-14 sm:h-16 px-10 sm:px-12 text-foreground hover:bg-foreground hover:text-background font-black text-xs tracking-widest uppercase border-border">
              <Link to="/chapters">Explore Collections</Link>
            </Button>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-foreground/20 to-transparent animate-shimmer" />
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 md:py-32 container">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-end">
          <div className="md:col-span-7">
            <h2 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-none mb-6 md:mb-8">
              WE DON'T DO<br /><span className="text-primary italic">BASIC.</span>
            </h2>
            <p className="text-lg md:text-2xl text-muted-foreground leading-relaxed max-w-2xl font-light">
              Bambu Silver is a rebellion against the mundane. Every curve, every polish, every piece of 925 sterling silver is hand-forged by artisans who understand that jewelry is an extension of your energy.
            </p>
          </div>
          <div className="md:col-span-5 relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl skew-x-1 hover:skew-x-0 transition-transform duration-700">
              <img src={modelRings} className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-1000" alt="Silver rings detail" />
            </div>
            <div className="absolute -bottom-10 -left-10 glass p-6 md:p-8 rounded-2xl max-w-[240px] hidden lg:block">
              <p className="text-xs font-black uppercase text-primary mb-2">Artisan Edge</p>
              <p className="text-sm font-medium">Over 200 hours of craftsmanship in every single collection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Collections — Category Grid */}
      <section className="py-20 md:py-32 bg-muted/30 backdrop-blur-3xl relative overflow-hidden">
        <div className="container relative z-10 w-full overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-6">
            <div className="max-w-full overflow-hidden">
              <p className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-4">Browse By</p>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">CATEGORIES</h2>
            </div>
            <Link to="/chapters" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors py-4 md:py-0 whitespace-nowrap">
              View All Categories →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {topCategories.map((cat, i) => (
              <Link key={cat.id} to={`/search?cat=${cat.id}`} className={`group relative overflow-hidden rounded-2xl aspect-[3/4] bg-gradient-to-br from-primary/10 to-secondary/10 ${i % 2 === 1 ? "md:mt-12" : ""}`}>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-60 transition-opacity duration-700 z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                  <span className="text-[8rem] font-black text-primary/20">{cat.name.charAt(0)}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-8 z-20 flex flex-col justify-end">
                  <h3 className="text-lg md:text-2xl font-black text-foreground group-hover:text-white leading-tight mb-2 transition-colors">{cat.name}</h3>
                  {cat.count > 0 && (
                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2">{cat.count} pieces</p>
                  )}
                  <Button variant="outline" className="w-fit rounded-full border-border/30 text-foreground/60 bg-white/50 group-hover:border-white/20 group-hover:text-white group-hover:bg-white/5 hover:bg-white hover:text-foreground font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex">
                    Shop Now
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-32 container">
        <div className="text-center mb-12 md:mb-20 px-4">
          <h2 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-[calc(-0.04em)] mb-4 md:mb-6 text-gradient-vibrant">MUST HAVES</h2>
          <p className="text-muted-foreground uppercase tracking-[0.5em] text-xs">Curated selection for the season</p>
        </div>
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-primary font-display text-xl">Loading products...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
              {featured.map((p) => (
                <div key={p.id} className="group relative">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button asChild variant="outline" className="rounded-full px-10 py-6 font-black text-xs uppercase tracking-widest">
                <Link to="/search">View All {products.length.toLocaleString()} Products →</Link>
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Visit Our Boutiques */}
      <HomeBoutiqueSection />

      {/* Blog / Articles */}
      <HomeBlogSection />

      {/* CTA */}
      <section className="relative py-24 md:py-40 overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-20 flex items-center justify-center select-none pointer-events-none">
          <span className="text-[40vw] font-black tracking-tighter text-white whitespace-nowrap animate-shimmer">BAMBU</span>
        </div>
        <div className="container relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-7xl font-black text-white italic tracking-tighter mb-8 md:mb-12">
            BE UNFORGETTABLE.
          </h2>
          <Button asChild className="rounded-full bg-white text-primary hover:bg-foreground hover:text-background transition-all size-28 md:size-32 text-xs font-black uppercase tracking-widest flex flex-col gap-2">
            <Link to="/search"><span>Shop</span><span>Now</span></Link>
          </Button>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 md:py-32 container w-full overflow-hidden">
        <div className="bg-muted/50 rounded-[2rem] md:rounded-[40px] p-6 sm:p-8 md:p-24 flex flex-col md:flex-row items-center gap-8 md:gap-12 overflow-hidden relative border border-border shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px]" />
          <div className="relative z-10 flex-1 w-full">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-4 md:mb-6 leading-none">
              JOIN THE INNER<br /><span className="text-primary italic">CIRCLE.</span>
            </h2>
            <p className="text-foreground/60 font-light max-w-sm">
              Early access to drops, exclusive events, and a peek into the soul of Bali.
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-4">
            <input type="email" placeholder="YOUR EMAIL" className="bg-background border border-border rounded-full px-8 py-5 text-foreground w-full sm:w-[300px] font-black text-xs tracking-widest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" />
            <Button className="rounded-full h-14 sm:h-16 px-10 bg-primary text-primary-foreground hover:bg-foreground hover:text-background transition-all font-black text-xs uppercase tracking-widest shadow-xl">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
