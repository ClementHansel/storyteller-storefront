import { FilterState, SortOption } from '@/types';
import { storyChapters } from '@/config/store-config';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const MATERIALS = ['Sterling Silver', 'Sterling Silver & Moonstone', 'Sterling Silver & Linen', 'Sterling Silver & Silk', 'Sterling Silver & Leather', 'Sterling Silver & Porcelain', 'Sterling Silver & Garnet', 'Fine Silver'];
const STYLES = ['Minimal', 'Rustic', 'Artisan', 'Elegant', 'Contemporary', 'Bold', 'Classic', 'Romantic', 'Bohemian', 'Rugged', 'Organic', 'Avant-Garde', 'Statement'];

interface SmartFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function SmartFilter({ filters, onChange }: SmartFilterProps) {
  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];

  return (
    <aside className="space-y-6">
      {/* Sort */}
      <div>
        <h4 className="mb-2 font-serif text-sm font-semibold text-foreground">Sort By</h4>
        <Select value={filters.sort} onValueChange={(v) => onChange({ ...filters, sort: v as SortOption })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="narrative">Curated Order</SelectItem>
            <SelectItem value="price-asc">Price: Low → High</SelectItem>
            <SelectItem value="price-desc">Price: High → Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chapters */}
      <div>
        <h4 className="mb-2 font-serif text-sm font-semibold text-foreground">Collections</h4>
        <div className="space-y-2">
          {storyChapters.map((ch) => (
            <div key={ch.id} className="flex items-center gap-2">
              <Checkbox
                id={`ch-${ch.id}`}
                checked={filters.chapters.includes(ch.slug)}
                onCheckedChange={() => onChange({ ...filters, chapters: toggleArrayItem(filters.chapters, ch.slug) })}
              />
              <Label htmlFor={`ch-${ch.id}`} className="text-sm cursor-pointer">{ch.name}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Materials */}
      <div>
        <h4 className="mb-2 font-serif text-sm font-semibold text-foreground">Material</h4>
        <div className="space-y-2">
          {MATERIALS.map((m) => (
            <div key={m} className="flex items-center gap-2">
              <Checkbox
                id={`mat-${m}`}
                checked={filters.materials.includes(m)}
                onCheckedChange={() => onChange({ ...filters, materials: toggleArrayItem(filters.materials, m) })}
              />
              <Label htmlFor={`mat-${m}`} className="text-sm cursor-pointer">{m}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Styles */}
      <div>
        <h4 className="mb-2 font-serif text-sm font-semibold text-foreground">Style</h4>
        <div className="space-y-2">
          {STYLES.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <Checkbox
                id={`sty-${s}`}
                checked={filters.styles.includes(s)}
                onCheckedChange={() => onChange({ ...filters, styles: toggleArrayItem(filters.styles, s) })}
              />
              <Label htmlFor={`sty-${s}`} className="text-sm cursor-pointer">{s}</Label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
