import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { useChapter, useChapterProducts } from '@/hooks/use-store';

const ChapterDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: chapter } = useChapter(slug || '');
  const { data: products = [] } = useChapterProducts(chapter);

  if (!chapter) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-2xl text-foreground">Chapter not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <title>{chapter.metaTitle}</title>
      <meta name="description" content={chapter.metaDescription} />

      {/* Hero */}
      <section className="relative">
        <ProductImage src={chapter.coverImage} alt={chapter.name} aspectRatio="landscape" className="max-h-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container pb-8">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-gold">Chapter {chapter.narrativeOrder}</span>
          <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">{chapter.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-xl">{chapter.shortDescription}</p>
        </div>
      </section>

      {/* Story Block (SEO) */}
      <section className="container py-12 md:py-16">
        <article className="prose prose-lg max-w-3xl mx-auto text-muted-foreground leading-relaxed">
          {chapter.story.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </article>
      </section>

      {/* Products Grid */}
      <section className="container pb-16 md:pb-24">
        <h2 className="mb-8 font-serif text-2xl font-bold text-foreground">From This Chapter</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-center text-muted-foreground">No products in this chapter yet.</p>
        )}
      </section>
    </Layout>
  );
};

export default ChapterDetailPage;
