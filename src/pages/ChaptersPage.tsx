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
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Collections</p>
          <h1 className="font-display text-5xl font-extrabold text-foreground">Our Stories</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Each collection is a chapter — bold, colorful, and alive with the energy of Bali.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {chapters.map((ch, i) => (
            <Link
              key={ch.id}
              to={`/chapters/${ch.slug}`}
              className="group animate-fade-in rounded-2xl overflow-hidden bg-card hover:shadow-xl transition-shadow duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="overflow-hidden">
                <ProductImage src={ch.coverImage} alt={ch.name} aspectRatio="landscape" className="transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Chapter {ch.narrativeOrder}</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
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
