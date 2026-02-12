import { useEffect, useRef, useState } from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export function ProductImage({ src, alt, className = '', aspectRatio = 'square' }: ProductImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-muted ${aspectClasses[aspectRatio]} ${className}`}>
      {/* Blur placeholder */}
      <div
        className={`absolute inset-0 bg-muted transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: inView ? `url(${src}&w=20&q=10)` : undefined,
          backgroundSize: 'cover',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
        }}
      />
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
