// ============================================================
// Zenvix Category UUID → Display Name Mapping
// ============================================================
// Maps the tenant's raw category UUIDs to human-readable names
// for the storefront filter UI. Derived from product data analysis.
// ============================================================

export interface CategoryDisplay {
  id: string;
  name: string;
  slug: string;
}

/**
 * Maps Zenvix category UUIDs to display-friendly names.
 * Based on the product types contained in each category.
 */
export const CATEGORY_MAP: Record<string, CategoryDisplay> = {
  "6b6e799d-2be7-46bf-bf5a-0f4e26b99e74": {
    id: "6b6e799d-2be7-46bf-bf5a-0f4e26b99e74",
    name: "Anklets - Chain & Charm",
    slug: "anklets-chain-charm",
  },
  "b844e44b-bb61-4613-9cb6-acd4c21ab5b6": {
    id: "b844e44b-bb61-4613-9cb6-acd4c21ab5b6",
    name: "Anklets - Stone & Beads",
    slug: "anklets-stone-beads",
  },
  "a59ab85b-9ceb-4fb5-aab5-c16c03e6ebe3": {
    id: "a59ab85b-9ceb-4fb5-aab5-c16c03e6ebe3",
    name: "Anklets - Classic Silver",
    slug: "anklets-classic-silver",
  },
  "ad6ad620-503f-48cb-9ff6-f73be59b28ab": {
    id: "ad6ad620-503f-48cb-9ff6-f73be59b28ab",
    name: "Anklets - Premium",
    slug: "anklets-premium",
  },
  "4cb6dc52-0ad8-424e-9e3b-aef0bc123a14": {
    id: "4cb6dc52-0ad8-424e-9e3b-aef0bc123a14",
    name: "Anklets - Pearl",
    slug: "anklets-pearl",
  },
  "b29b7321-6612-4e2a-aa03-496f6c4cd893": {
    id: "b29b7321-6612-4e2a-aa03-496f6c4cd893",
    name: "Bracelets",
    slug: "bracelets",
  },
  "b703d028-8688-4ea4-bca5-c54c109e9c25": {
    id: "b703d028-8688-4ea4-bca5-c54c109e9c25",
    name: "Anklets - Love & Agate",
    slug: "anklets-love-agate",
  },
  "931b09bd-dcae-4c7e-9599-4fc410f0c028": {
    id: "931b09bd-dcae-4c7e-9599-4fc410f0c028",
    name: "Anklets - Bell & Charm",
    slug: "anklets-bell-charm",
  },
  "e68a052d-a813-4203-99cf-9695484ba57d": {
    id: "e68a052d-a813-4203-99cf-9695484ba57d",
    name: "Display Accessories",
    slug: "display-accessories",
  },
  "21cc74ec-7141-4552-a9e1-1c33d606277f": {
    id: "21cc74ec-7141-4552-a9e1-1c33d606277f",
    name: "Bags",
    slug: "bags",
  },
  "6193e90a-eecc-4713-b027-183bed12d114": {
    id: "6193e90a-eecc-4713-b027-183bed12d114",
    name: "Bags - Premium",
    slug: "bags-premium",
  },
  "bbb01ce5-1809-465a-8cf6-2ab2df30c365": {
    id: "bbb01ce5-1809-465a-8cf6-2ab2df30c365",
    name: "Bangles",
    slug: "bangles",
  },
  "23dc4c43-7419-4eeb-9267-bfe6e37d8e10": {
    id: "23dc4c43-7419-4eeb-9267-bfe6e37d8e10",
    name: "Brooches",
    slug: "brooches",
  },
  "71766eab-26b4-4485-8b64-4d8d4dcaca92": {
    id: "71766eab-26b4-4485-8b64-4d8d4dcaca92",
    name: "Anklets - Ball",
    slug: "anklets-ball",
  },
  "7495f5e2-c81f-44e4-9f66-5f9c1982979a": {
    id: "7495f5e2-c81f-44e4-9f66-5f9c1982979a",
    name: "Anklets - Bell",
    slug: "anklets-bell",
  },
  "8221e9cb-5d0b-49af-b2de-1d7d26e77514": {
    id: "8221e9cb-5d0b-49af-b2de-1d7d26e77514",
    name: "Anklets - Rubber",
    slug: "anklets-rubber",
  },
  "914ec9f1-f93c-4580-9c45-ebd8483a9d49": {
    id: "914ec9f1-f93c-4580-9c45-ebd8483a9d49",
    name: "Anklets - Star",
    slug: "anklets-star",
  },
  "5bb641e7-2118-4c89-aa46-53be345580f8": {
    id: "5bb641e7-2118-4c89-aa46-53be345580f8",
    name: "Anklets - Gemstone",
    slug: "anklets-gemstone",
  },
  "d63bbe64-0567-4015-9566-99c0b57cc7b1": {
    id: "d63bbe64-0567-4015-9566-99c0b57cc7b1",
    name: "Anklets - Amethyst",
    slug: "anklets-amethyst",
  },
};

/**
 * Get display name for a category UUID. Returns "Other" for unmapped categories.
 */
export function getCategoryName(categoryId: string): string {
  return CATEGORY_MAP[categoryId]?.name ?? "Other";
}

/**
 * Get all mapped categories sorted by name.
 */
export function getAllCategories(): CategoryDisplay[] {
  return Object.values(CATEGORY_MAP).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Price range presets in IDR (the tenant's currency).
 */
export const PRICE_RANGES = [
  { label: "Under 350K", min: 0, max: 350000 },
  { label: "350K - 500K", min: 350000, max: 500000 },
  { label: "500K - 1M", min: 500000, max: 1000000 },
  { label: "1M - 5M", min: 1000000, max: 5000000 },
  { label: "Over 5M", min: 5000000, max: Infinity },
] as const;
