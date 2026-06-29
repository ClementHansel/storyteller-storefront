import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { SmartFilter } from "@/components/SmartFilter";
import { useProducts } from "@/hooks/use-store";
import { SEO } from "@/components/SEO";

import { FilterState, Product } from "@/types";

const PAGE_SIZE = 24; // Products per page for performance

function applyFilters(products: Product[], filters: FilterState): Product[] {
  let result = products;

  // Category filter
  if (filters.categories.length > 0) {
    result = result.filter((p) =>
      p.tags.some((t) => filters.categories.includes(t))
    );
  }

  // Price range filter
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    result = result.filter((p) => p.price >= min && p.price <= max);
  }

  // Sort
  switch (filters.sort) {
    case "price-asc":
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
    default:
      break;
  }

  return result;
}

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const catParam = searchParams.get("cat") || "";
  const { data: products = [], isLoading } = useProducts();
  const [filters, setFilters] = useState<FilterState>({
    chapters: [],
    categories: catParam ? [catParam] : [],
    materials: [],
    styles: [],
    sort: "narrative",
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ["title", "tags"],
        threshold: 0.35,
      }),
    [products],
  );

  const filteredResults = useMemo(() => {
    const base = query ? fuse.search(query).map((r) => r.item) : products;
    return applyFilters(base, filters);
  }, [query, products, fuse, filters]);

  // Reset visible count when filters change
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const visibleProducts = filteredResults.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResults.length;

  return (
    <Layout>
      <SEO 
        title={query ? `Search: ${query}` : "The Shop"} 
        description="Shop all handcrafted silver jewelry from Bambu Silver. Filter by category or price range."
      />
      <div className="relative min-h-screen pt-40 pb-20">

        <div className="container relative z-10 w-full overflow-hidden">
          <div className="mb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4">
                  {query ? "Search Results" : "Catalog"}
                </p>
                <h1 className="font-display text-6xl md:text-8xl font-black text-foreground tracking-tighter leading-none uppercase">
                  {query ? `"${query}"` : "The shop."}
                </h1>
              </div>
              <div className="glass px-6 py-4 rounded-2xl border-black/5">
                <span className="text-2xl font-black text-foreground">
                  {filteredResults.length}
                </span>
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                  {filteredResults.length === 1 ? "Piece Found" : "Pieces Found"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
            <aside className="lg:sticky lg:top-32 h-fit">
              <div className="glass p-8 rounded-[2rem] border-black/5 shadow-xl ring-1 ring-black/5">
                <SmartFilter filters={filters} onChange={handleFilterChange} />
              </div>
            </aside>

            <div>
              {isLoading ? (
                <div className="col-span-full py-40 text-center">
                  <div className="animate-pulse text-primary font-display text-xl">Loading products...</div>
                </div>
              ) : (
                <>
                  <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleProducts.map((p, i) => (
                      <div key={p.id} className={`${i % 3 === 1 ? "lg:mt-12" : ""}`}>
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>

                  {visibleProducts.length === 0 && (
                    <div className="py-40 text-center glass rounded-[3rem] border-black/5">
                      <p className="text-foreground/40 font-black tracking-widest uppercase">
                        No pieces found matching your criteria.
                      </p>
                    </div>
                  )}

                  {/* Load More button for pagination */}
                  {hasMore && (
                    <div className="mt-16 text-center">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="px-10 py-4 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all font-black text-xs tracking-widest uppercase shadow-xl"
                      >
                        Load More ({filteredResults.length - visibleCount} remaining)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
