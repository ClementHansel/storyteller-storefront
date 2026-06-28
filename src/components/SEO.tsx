import { Helmet } from 'react-helmet-async';
import { storeName } from '@/config/store-config';

const SITE_URL = 'https://bambusilver.com';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  keywords?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEO({
  title,
  description,
  image = `${SITE_URL}/og-image.jpg`,
  url,
  type = 'website',
  keywords,
  canonicalUrl,
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${storeName}`
    : `${storeName} — Handcrafted Sterling Silver Jewelry from Bali`;
  const metaDescription =
    description ||
    'Hand-forged .925 sterling silver jewelry crafted by Balinese artisans. Shop rings, necklaces, bracelets, and exclusive collections from Bambu Silver by Estela.';
  const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const canonical = canonicalUrl || pageUrl;
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={storeName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
