import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import { Layout } from '@/components/Layout';
import { ProductCard } from '@/components/ProductCard';
import { SmartFilter } from '@/components/SmartFilter';
import { useProducts } from '@/hooks/use-store';
import { FilterState, Product } from '@/types';
import { storyChapters } from '@/config/store-config';

function applyFilters(products: Product[], filters: FilterState): Product[] {
  let result = [...products];

  if (filters.chapters.length > 0) {
    const chapterTags = filters.chapters.flatMap(
      (slug) => storyChapters.find((ch) => ch.slug === slug)?.productTags ?? []
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
    case 'price-asc': result.sort((a, b) => a.price - b.price); break;
    case 'price-desc': result.sort((a, b) => b.price - a.price); break;
    case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    default: break;
  }

  return result;
}

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { data: products = [] } = useProducts();
  const [filters, setFilters] = useState<FilterState>({
    chapters: [], materials: [], styles: [], sort: 'narrative',
  });

  const fuse = useMemo(
    () => new Fuse(products, { keys: ['title', 'description', 'tags', 'material'], threshold: 0.35 }),
    [products]
  );

  const searchResults = useMemo(() => {
    const base = query ? fuse.search(query).map((r) => r.item) : products;
    return applyFilters(base, filters);
  }, [query, products, fuse, filters]);

  return (
    <Layout>
      <title>{query ? `Search: ${query}` : 'Browse All'} — Argentum & Craft</title>

      <div className="container py-10 md:py-16">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            {query ? `Results for "${query}"` : 'Browse All Pieces'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{searchResults.length} piece{searchResults.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          <SmartFilter filters={filters} onChange={setFilters} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {searchResults.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-12">No products match your criteria.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
