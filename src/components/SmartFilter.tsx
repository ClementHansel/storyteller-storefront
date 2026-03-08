import { FilterState, SortOption } from "@/types";
import { storyChapters } from "@/config/store-config";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const MATERIALS = [
  "Sterling Silver",
  "Sterling Silver & Moonstone",
  "Sterling Silver & Linen",
  "Sterling Silver & Silk",
  "Sterling Silver & Leather",
  "Sterling Silver & Porcelain",
  "Sterling Silver & Garnet",
  "Fine Silver",
];
const STYLES = [
  "Minimal",
  "Rustic",
  "Artisan",
  "Elegant",
  "Contemporary",
  "Bold",
  "Classic",
  "Romantic",
  "Bohemian",
  "Rugged",
  "Organic",
  "Avant-Garde",
  "Statement",
];

interface SmartFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function SmartFilter({ filters, onChange }: SmartFilterProps) {
  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];

  return (
    <div className="space-y-10">
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

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Collections
        </h4>
        <div className="flex flex-wrap gap-2">
          {storyChapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() =>
                onChange({
                  ...filters,
                  chapters: toggleArrayItem(filters.chapters, ch.slug),
                })
              }
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                filters.chapters.includes(ch.slug)
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                  : "bg-black/[0.03] text-foreground/40 hover:bg-black/[0.05] border border-black/5"
              }`}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Materials
        </h4>
        <div className="flex flex-col gap-3">
          {MATERIALS.map((m) => (
            <div
              key={m}
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() =>
                onChange({
                  ...filters,
                  materials: toggleArrayItem(filters.materials, m),
                })
              }
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${filters.materials.includes(m) ? "bg-primary border-primary" : "bg-black/[0.03] border-black/10"}`}
              >
                {filters.materials.includes(m) && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${filters.materials.includes(m) ? "text-foreground" : "text-foreground/40 group-hover:text-foreground/60"}`}
              >
                {m}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
          Style Vibe
        </h4>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() =>
                onChange({
                  ...filters,
                  styles: toggleArrayItem(filters.styles, s),
                })
              }
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                filters.styles.includes(s)
                  ? "bg-secondary text-white shadow-lg shadow-secondary/20 scale-105"
                  : "bg-black/[0.03] text-foreground/40 hover:bg-black/[0.05]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
