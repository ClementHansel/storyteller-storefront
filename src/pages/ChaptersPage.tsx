import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProductImage } from '@/components/ProductImage';
import { useChapters } from '@/hooks/use-store';
import { useDocumentTitle } from '@/hooks/use-document-title';

const ChaptersPage = () => {
  const { data: chapters = [] } = useChapters();

  useDocumentTitle('Collections — Bambu Silver by Estela');

  return (
    <Layout>

      <section className="container py-16 md:py-24">
        <div className="mb-14 text-center max-w-xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">Collections</p>
          <h1 className="font-serif text-5xl font-light text-foreground">Our Stories</h1>
          <p className="mt-4 text-sm text-muted-foreground font-light leading-relaxed">
            Each collection is a chapter in our story — curated pieces bound by narrative, material, and spirit.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          {chapters.map((ch, i) => (
            <Link
              key={ch.id}
              to={`/chapters/${ch.slug}`}
              className="group animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="overflow-hidden">
                <ProductImage src={ch.coverImage} alt={ch.name} aspectRatio="landscape" className="transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">Chapter {ch.narrativeOrder}</p>
                <h2 className="mt-1 font-serif text-3xl font-light text-foreground group-hover:text-accent transition-colors">
                  {ch.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground font-light">{ch.shortDescription}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default ChaptersPage;
