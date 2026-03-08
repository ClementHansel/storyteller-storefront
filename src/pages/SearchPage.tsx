import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { SmartFilter } from "@/components/SmartFilter";
import { useProducts } from "@/hooks/use-store";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { FilterState, Product } from "@/types";
import { storyChapters } from "@/config/store-config";

function applyFilters(products: Product[], filters: FilterState): Product[] {
  let result = [...products];

  if (filters.chapters.length > 0) {
    const chapterTags = filters.chapters.flatMap(
      (slug) => storyChapters.find((ch) => ch.slug === slug)?.productTags ?? [],
    );
    result = result.filter((p) => p.tags.some((t) => chapterTags.includes(t)));
  }

  if (filters.materials.length > 0) {
    result = result.filter((p) => filters.materials.includes(p.material));
  }

  if (filters.styles.length > 0) {
    result = result.filter((p) => filters.styles.includes(p.style));
  }

  switch (filters.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result.sort(
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
  const { data: products = [] } = useProducts();
  const [filters, setFilters] = useState<FilterState>({
    chapters: [],
    materials: [],
    styles: [],
    sort: "narrative",
  });

  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ["title", "description", "tags", "material"],
        threshold: 0.35,
      }),
    [products],
  );

  const searchResults = useMemo(() => {
    const base = query ? fuse.search(query).map((r) => r.item) : products;
    return applyFilters(base, filters);
  }, [query, products, fuse, filters]);

  useDocumentTitle(`${query ? `Search: ${query}` : "Shop All"} — Bambu Silver`);

  return (
    <Layout>
      <div className="relative min-h-screen pt-40 pb-20">
        <div className="container relative z-10">
          <div className="mb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4">
                  {query ? "Search Results" : "Catalog"}
                </p>
                <h1 className="font-display text-6xl md:text-8xl font-black text-white tracking-tighter leading-none uppercase">
                  {query ? `"${query}"` : "The shop."}
                </h1>
              </div>
              <div className="glass px-6 py-4 rounded-2xl">
                <span className="text-2xl font-black text-white">
                  {searchResults.length}
                </span>
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                  Unique Pieces Found
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
            <aside className="lg:sticky lg:top-32 h-fit">
              <div className="glass-dark p-8 rounded-[2rem] border-white/5 shadow-2xl">
                <SmartFilter filters={filters} onChange={setFilters} />
              </div>
            </aside>

            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((p, i) => (
                <div key={p.id} className={`${i % 3 === 1 ? "lg:mt-12" : ""}`}>
                  <ProductCard product={p} />
                </div>
              ))}
              {searchResults.length === 0 && (
                <div className="col-span-full py-40 text-center glass rounded-[3rem]">
                  <p className="text-white/40 font-black tracking-widest uppercase">
                    No pieces found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
