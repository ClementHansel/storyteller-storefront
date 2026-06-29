import { useMemo, useState } from "react";
import { FilterState, Product, SortOption } from "@/types";
import { deriveCategoriesFromProducts, PRICE_RANGES } from "@/config/category-mapping";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const INITIAL_CATEGORY_COUNT = 10;

interface SmartFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  products?: Product[];
}

export function SmartFilter({ filters, onChange, products = [] }: SmartFilterProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const categories = useMemo(
    () => deriveCategoriesFromProducts(products),
    [products],
  );
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, INITIAL_CATEGORY_COUNT);
  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];

  const isPriceRangeActive = (min: number, max: number) => {
    if (!filters.priceRange) return false;
    return filters.priceRange[0] === min && filters.priceRange[1] === max;
  };

  const togglePriceRange = (min: number, max: number) => {
    if (isPriceRangeActive(min, max)) {
      onChange({ ...filters, priceRange: undefined });
    } else {
      onChange({ ...filters, priceRange: [min, max] });
    }
  };

  return (
    <div className="space-y-10">
      {/* Sort */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Sort Selection
        </h4>
        <Select
          value={filters.sort}
          onValueChange={(v) => onChange({ ...filters, sort: v as SortOption })}
        >
          <SelectTrigger className="w-full rounded-full bg-black/[0.03] border-black/10 text-[10px] font-black uppercase tracking-widest h-12 px-6">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-black/10">
            <SelectItem
              value="narrative"
              className="text-[10px] font-black uppercase tracking-widest text-foreground"
            >
              Curated Order
            </SelectItem>
            <SelectItem
              value="price-asc"
              className="text-[10px] font-black uppercase tracking-widest text-foreground"
            >
              Price: Low → High
            </SelectItem>
            <SelectItem
              value="price-desc"
              className="text-[10px] font-black uppercase tracking-widest text-foreground"
            >
              Price: High → Low
            </SelectItem>
            <SelectItem
              value="newest"
              className="text-[10px] font-black uppercase tracking-widest text-foreground"
            >
              Newest Drops
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Categories
        </h4>
        <div className="flex flex-wrap gap-2">
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                onChange({
                  ...filters,
                  categories: toggleArrayItem(filters.categories, cat.id),
                })
              }
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                filters.categories.includes(cat.id)
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                  : "bg-black/[0.03] text-foreground/40 hover:bg-black/[0.05] border border-black/5"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
        {categories.length > INITIAL_CATEGORY_COUNT && (
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            {showAllCategories
              ? "Show Less"
              : `Show More (${categories.length - INITIAL_CATEGORY_COUNT} more)`}
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Price Range
        </h4>
        <div className="flex flex-col gap-3">
          {PRICE_RANGES.map((range) => (
            <div
              key={range.label}
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => togglePriceRange(range.min, range.max)}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  isPriceRangeActive(range.min, range.max)
                    ? "bg-primary border-primary"
                    : "bg-black/[0.03] border-black/10"
                }`}
              >
                {isPriceRangeActive(range.min, range.max) && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                  isPriceRangeActive(range.min, range.max)
                    ? "text-foreground"
                    : "text-foreground/40 group-hover:text-foreground/60"
                }`}
              >
                {range.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
