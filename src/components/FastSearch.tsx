import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useProducts } from '@/hooks/use-store';
import { Product } from '@/types';
import { Search, X } from 'lucide-react';

export function FastSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();

  const fuse = useMemo(
    () => new Fuse(products, { keys: ['title', 'description', 'tags', 'material'], threshold: 0.35 }),
    [products]
  );

  const results: Product[] = useMemo(
    () => (query.length >= 2 ? fuse.search(query).slice(0, 6).map((r) => r.item) : []),
    [query, fuse]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search pieces…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-full border border-border bg-muted/50 py-2 pl-9 pr-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => { navigate(`/products/${p.id}`); setOpen(false); setQuery(''); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{p.title}</p>
                <p className="text-[10px] text-muted-foreground">${p.price}</p>
              </div>
            </button>
          ))}
          <button
            onClick={() => { navigate(`/search?q=${encodeURIComponent(query)}`); setOpen(false); }}
            className="w-full border-t border-border px-3 py-2.5 text-center text-[10px] uppercase tracking-widest text-primary font-bold hover:bg-muted transition-colors"
          >
            View all results
          </button>
        </div>
      )}
    </div>
  );
}
