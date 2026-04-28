import { useEffect } from 'react';
import { storeName } from '@/config/store-config';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
}

export function SEO({ 
  title, 
  description, 
  image = '/og-image.jpg', 
  url, 
  type = 'website' 
}: SEOProps) {
  const fullTitle = title ? `${title} | ${storeName}` : `${storeName} — Bold Artisan Silver Jewelry`;
  const defaultDescription = "Hand-forged .925 sterling silver jewelry. Unapologetic, artisan-crafted pieces inspired by the soul of Bali.";
  const metaDescription = description || defaultDescription;

  useEffect(() => {
    // Update basic tags
    document.title = fullTitle;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', metaDescription);

    // Update OpenGraph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', metaDescription);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', image);

    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute('content', type);

    if (url) {
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute('content', url);
    }

    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', metaDescription);

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute('content', image);

  }, [fullTitle, metaDescription, image, url, type]);

  return null; // This component doesn't render anything
}
