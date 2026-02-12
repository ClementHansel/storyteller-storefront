import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductImage } from '@/components/ProductImage';
import { useChapters } from '@/hooks/use-store';

const ChaptersPage = () => {
  const { data: chapters = [] } = useChapters();

  return (
    <Layout>
      <title>Story Chapters — Argentum & Craft</title>
      <meta name="description" content="Browse our curated Story Chapters — collections of silver jewelry and handcraft pieces, each with a unique narrative." />

      <section className="container py-12 md:py-20">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-gold mb-2">Collections</p>
          <h1 className="font-serif text-4xl font-bold text-foreground">Story Chapters</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">
            Each chapter is a curated collection with its own story — browse them all below.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {chapters.map((ch, i) => (
            <Link
              key={ch.id}
              to={`/chapters/${ch.slug}`}
              className="group animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <ProductImage src={ch.coverImage} alt={ch.name} aspectRatio="landscape" className="rounded-sm" />
              <div className="mt-4">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-gold">Chapter {ch.narrativeOrder}</span>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {ch.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{ch.shortDescription}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default ChaptersPage;
