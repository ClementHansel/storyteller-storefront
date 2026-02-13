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
          <h1 className="font-serif text-3xl font-light text-foreground">Chapter not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <title>{chapter.metaTitle}</title>
      <meta name="description" content={chapter.metaDescription} />

      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-end">
        <ProductImage src={chapter.coverImage} alt={chapter.name} aspectRatio="landscape" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative container pb-12 pt-32">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-2">Chapter {chapter.narrativeOrder}</p>
          <h1 className="font-serif text-5xl font-light text-foreground md:text-6xl">{chapter.name}</h1>
          <p className="mt-3 text-base text-muted-foreground max-w-lg font-light">{chapter.shortDescription}</p>
        </div>
      </section>

      {/* Story Block */}
      <section className="container py-16 md:py-20">
        <article className="max-w-2xl mx-auto space-y-6">
          {chapter.story.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-[1.8] font-light">{para}</p>
          ))}
        </article>
      </section>

      {/* Products Grid */}
      <section className="container pb-20 md:pb-28">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-2">From this chapter</p>
          <h2 className="font-serif text-3xl font-light text-foreground">The Pieces</h2>
        </div>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-center text-muted-foreground font-light">No products in this chapter yet.</p>
        )}
      </section>
    </Layout>
  );
};

export default ChapterDetailPage;
