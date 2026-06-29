import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useProducts } from "@/hooks/use-store";
import { deriveCategoriesFromProducts, getAllCategories } from "@/config/category-mapping";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

const ChaptersPage = () => {
  const { data: products = [], isLoading } = useProducts();

  // Use derived categories (with counts) when products are loaded,
  // fall back to static category list while loading
  const categories = useMemo(() => {
    if (products.length > 0) {
      return deriveCategoriesFromProducts(products);
    }
    return getAllCategories().map((c) => ({ ...c, count: 0 }));
  }, [products]);

  return (
    <Layout>
      <SEO
        title="Collections"
        description="Browse all jewelry categories from Bambu Silver. Anklets, rings, earrings, necklaces, and more — handcrafted sterling silver from Bali."
      />

      <section className="container pt-40 pb-32">
        <div className="mb-16 px-4">
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4">
            Browse By Category
          </p>
          <h1 className="font-display text-6xl md:text-8xl font-black text-foreground tracking-tighter leading-[0.85]">
            ALL
            <br />
            <span className="italic text-gradient-vibrant">CATEGORIES.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            {isLoading
              ? "Loading catalog..."
              : `${categories.length} categories across ${products.length.toLocaleString()} products`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/search?cat=${cat.id}`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted border border-border/50 p-6 md:p-8 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl font-black text-primary">
                  {cat.name.charAt(0)}
                </span>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm md:text-base font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-wide leading-tight mb-2">
                  {cat.name}
                </h3>
                {cat.count > 0 && (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {cat.count} {cat.count === 1 ? "piece" : "pieces"}
                  </p>
                )}
              </div>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Shop →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {isLoading && (
          <div className="mt-12 text-center">
            <div className="animate-pulse text-primary font-display text-lg">
              Loading full catalog...
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default ChaptersPage;
