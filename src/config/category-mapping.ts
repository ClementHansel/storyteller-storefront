// ============================================================
// Zenvix Category UUID → Display Name Mapping
// ============================================================
// Maps the tenant's category UUIDs to human-readable names.
// Pulled from the product_categories table in the Zenvix database.
// ============================================================

export interface CategoryDisplay {
  id: string;
  name: string;
  slug: string;
}

/**
 * Complete mapping of Zenvix category UUIDs to display names.
 * Source: product_categories table for tenant tnt-3rlhko.
 */
export const CATEGORY_MAP: Record<string, string> = {
  "5bb641e7-2118-4c89-aa46-53be345580f8": "587 Stone",
  "abf86762-7079-40b2-8dc3-44cfd8d54c16": "125 Gergaji",
  "246a5e8a-6612-4b89-8a07-0ee5aa068153": "135 Pearl",
  "0c4c9638-a800-49b7-ac58-0a936d49ebbe": "251 New",
  "1d3be877-3bad-41f5-ba84-4fa05bb7b53e": "Accessories",
  "7b2db0ca-eab2-4031-882a-b8585e4bef81": "Ambar",
  "25c8b9d2-a91f-4429-aa04-b77c64ea12b8": "Amber",
  "6b6e799d-2be7-46bf-bf5a-0f4e26b99e74": "Anklet",
  "93cb190e-7160-414c-9de8-7308105251a7": "Anorak",
  "d0e0ea17-6cee-41ca-9e6c-8a1b3c8b41e9": "Arma / Gold",
  "22e9b0e8-1330-4305-ba67-104111318c58": "Armadillo",
  "df8af4c7-38db-4510-81ff-cefc93b55d80": "Aro",
  "8e70b77b-94d2-43b8-8e6a-dfd00d003fc9": "Aro / Hoops",
  "21cc74ec-7141-4552-a9e1-1c33d606277f": "Bag & Print",
  "5553e1d4-2376-49fc-8273-21d6437486e2": "Bag / Pocket",
  "b967ea64-a96e-4bff-bfdd-6041ea1018e5": "Bambu",
  "8708679f-4ebe-4a75-b87b-40a9e4da6045": "Baroq",
  "931b09bd-dcae-4c7e-9599-4fc410f0c028": "Beads Crochet",
  "413a56b0-c96a-477b-9b42-920e92ba7bfc": "Borobudur",
  "e68a052d-a813-4203-99cf-9695484ba57d": "Box",
  "72b45eaa-061f-4831-a9cf-b447fe5b7436": "Box Accessories",
  "22be0ae7-5aac-44a1-9ea7-a70c5453b3a2": "BRT",
  "6ff20559-9b25-4914-90a4-3964a131a0f5": "Buda",
  "5a6d0834-7a49-4c8d-b267-e2e22d220821": "Charm",
  "5715b312-93ff-497c-a154-3b14e14ff2f8": "Chain",
  "7e695b24-00a9-4347-8bc2-e456d11470b6": "Clothing / Lukisan",
  "ab613f91-9b8c-443b-bf8c-7fe80cbd4e24": "Combi",
  "8e81b9ee-c4f8-451d-bb1a-d1662351c22f": "Crochet",
  "696588fb-48c7-47b2-ba54-c3b326fd8d8c": "Cross",
  "ad5bb761-ad36-4941-806a-188aae4380ef": "Crystal",
  "d88bd1c1-33cc-4db3-80cb-c130bbc3f1cf": "Cuff BRT",
  "21e70be9-7f57-44cd-9549-a46fa2330188": "DB",
  "099548a9-a88a-4bbd-8ef9-3b6428e47aa0": "Depo",
  "d0b59fdc-c4db-46d8-8a86-60dc288f2a50": "Dragon F",
  "e05612fc-6c68-4b8f-836b-64de14025e58": "Earring Bun",
  "81395b64-5c8d-4086-88bc-5d377aa5dd77": "Earring Gold Silver",
  "4268eec7-107d-4637-9c77-854fca542d73": "Earring Mabe",
  "1c15afa8-0040-4985-bcdf-479be3abd5c0": "Earring S",
  "5114a927-0b4f-426d-8a02-252897ca8fd9": "Earring Stone",
  "ffb808fd-0f8a-4825-9b7a-2f4d30743ca2": "Ema",
  "fdc71afb-dc9a-4f09-9dd5-211d30c7dffc": "Fan",
  "87079eb7-bebf-4b1d-9776-74e14fe68480": "Fan & Decor",
  "51008541-f8d4-47ef-aef1-1dec53225885": "Garab",
  "d4d60653-a385-48e3-aadb-04bb7bd5eb63": "Gerga",
  "2671feea-296f-43fc-9d4d-d94bb94d1ac4": "Gergaji",
  "c5d4f5a7-532c-40d6-9486-3c16268cb43f": "Gold Egyp",
  "7a52c8db-9dc8-4ba6-ab4f-c05472b7951c": "Gold Tali Shell Bun",
  "70d45490-0043-409d-a5ee-bcdceb76a2bf": "General",
  "59f1f33e-6e4e-44bc-97dc-1078fb21b736": "H.Ball - D.Box",
  "ed67c277-e33e-49fe-95fc-6bcf0089a633": "Hamm Oxid",
  "829c2231-ffcf-41bf-a18d-44e7bbb446b9": "HB",
  "5c0846b9-0451-456a-8c2a-613e6f3ecd9e": "Horn",
  "a6d4d7a7-d1bc-4bac-8017-454a38e37b86": "Karean Hills",
  "b9cdc490-5d9c-4b3a-865a-b5aed86a7f8e": "Leather",
  "484c77b6-a56e-4c68-9324-2fe271e3ccaf": "Lotus",
  "b0b120cc-d46d-404b-b7fc-f06bc780ac59": "Magic",
  "7c45c1c1-bef2-4886-89ac-9638ef8fa3b0": "MOB / Shell / Shiva Eyes",
  "8221e9cb-5d0b-49af-b2de-1d7d26e77514": "Leather / Rubber / Cotton",
  "a59ab85b-9ceb-4fb5-aab5-c16c03e6ebe3": "Necklace / Chain / BRT Silver",
  "23dc4c43-7419-4eeb-9267-bfe6e37d8e10": "No Name",
  "37aa7fd8-dfb8-4344-863d-e2040e15da07": "Onix / Horn",
  "f7f9813e-c726-4633-bea1-5e8d119176c4": "Painting Mix",
  "479e8828-c269-45a3-adff-3907a3c8cb05": "Pasir",
  "4cb6dc52-0ad8-424e-9e3b-aef0bc123a14": "Pearl",
  "9806e5c2-8198-4670-b44d-e486a5952519": "Pearls",
  "96b81efa-5875-454d-822c-ad29def139c3": "Pendant Mix",
  "71766eab-26b4-4485-8b64-4d8d4dcaca92": "Plain",
  "b29b7321-6612-4e2a-aa03-496f6c4cd893": "Plain Any",
  "699072ce-0325-4223-9f6e-a381bd012526": "Plain Gergaji",
  "bbb01ce5-1809-465a-8cf6-2ab2df30c365": "Plain Men",
  "d6f5f883-e376-4fb9-8a38-6ed91f4a4ace": "Plain Shell",
  "836885bd-4404-426d-86ac-36709e3f4965": "Plain Silver",
  "5f1ebcb9-d645-4828-8d5d-f50c9850b719": "Plant",
  "c43914ac-9b84-4be3-8e98-2a5fa79f1421": "Reject",
  "4ee36c8b-8f09-4754-a940-a1421a548f50": "Ring",
  "669ab1ab-2846-4d7a-ad17-a79cdc119479": "Ring Small",
  "55401864-8d0f-42fd-bf9f-4e124b3b6399": "Rotan",
  "3c6e28e8-01b4-4ab1-97bd-42b95f39a5b2": "Service",
  "dc6f455a-7926-41de-8f72-e14acb12cf37": "Set Jewelry",
  "c607b07e-1ca6-42b8-b887-21af3bb01975": "Shell",
  "da01e95b-0142-438c-b486-b156648989e5": "Shells / MOP",
  "b844e44b-bb61-4613-9cb6-acd4c21ab5b6": "Silk / Anklet",
  "b703d028-8688-4ea4-bca5-c54c109e9c25": "Silver 1",
  "7495f5e2-c81f-44e4-9f66-5f9c1982979a": "Silver 2",
  "e758aa0d-7970-4b5c-832d-da8b77e5843f": "Silver Gold A",
  "c53a68f5-9174-4887-b1a5-fd568b5c2def": "Spunbond",
  "4fd2007c-a530-48f3-82e4-ae95c3d54105": "ST",
  "914ec9f1-f93c-4580-9c45-ebd8483a9d49": "ST Mix",
  "28b38e4a-fc6c-4a2f-9585-1639a0bf56ac": "Stainless Steel",
  "d63bbe64-0567-4015-9566-99c0b57cc7b1": "Stones",
  "6193e90a-eecc-4713-b027-183bed12d114": "Sheet1",
  "7c2da6a1-741a-4a9c-a7d3-42f4d78966d1": "Tali",
  "45681ad8-84a3-4220-b942-bee550b871a3": "Tali Air / Kawatan",
  "d4b3df22-8793-4b05-8d12-45e7053720cb": "Tali Arm G",
  "0bab2883-edc0-4ffc-b7fb-fe474b863a35": "Toe Ring",
  "c20fbfd2-c84d-4873-b72d-9f04f4ce1566": "Tribe / Hills",
  "98a6105b-b05a-4bb8-afd0-7e2c34bf956b": "Uncategorized",
  "a1caa60b-bb17-7777-7777-a1caa60bb177": "Recovered Scans",
  "de5f316f-22c0-45d7-b841-086d9106f655": "Vintage",
  "64a0a22e-46c0-4903-a4cf-c9884422aac6": "W.Metal",
  "345e3996-2662-4abf-983f-78cc9404604c": "Zircon",
  "d0bfeb79-9fca-41f1-ae4d-08c0c4f1d9c8": "Zirconia",
  "ad6ad620-503f-48cb-9ff6-f73be59b28ab": "Chain 539",
  "f4584a4c-d0f6-4a7a-adba-a1caa60bb177": "Piercing",
};

/**
 * Get display name for a category UUID.
 * Returns the UUID itself (truncated) for unmapped categories.
 */
export function getCategoryName(categoryId: string): string {
  return CATEGORY_MAP[categoryId] ?? categoryId.slice(0, 8);
}

/**
 * Get all mapped categories as CategoryDisplay objects sorted by name.
 */
export function getAllCategories(): CategoryDisplay[] {
  return Object.entries(CATEGORY_MAP)
    .map(([id, name]) => ({
      id,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Derive categories dynamically from product data.
 * Returns categories found in the products, sorted by product count (most first).
 * Only includes categories that have at least one product.
 */
export function deriveCategoriesFromProducts(
  products: Array<{ tags: string[] }>
): CategoryDisplay[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const tag of p.tags) {
      if (CATEGORY_MAP[tag]) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({
      id,
      name: `${CATEGORY_MAP[id]} (${count})`,
      slug: CATEGORY_MAP[id].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    }));
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
