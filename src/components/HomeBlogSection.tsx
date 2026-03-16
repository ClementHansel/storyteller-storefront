import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";

// Mock articles — will be replaced by API data later
const MOCK_ARTICLES = [
  {
    id: "1",
    slug: "bali-silver-craft-heritage",
    title: "The Ancient Art of Balinese Silver Crafting",
    excerpt: "Discover how centuries-old techniques shape every piece in our collections.",
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
    category: "Heritage",
    readTime: "5 min read",
    isFeatured: true,
    isNew: false,
    publishedAt: "2026-02-10",
  },
  {
    id: "2",
    slug: "styling-silver-for-every-occasion",
    title: "How to Style Silver Jewelry for Every Occasion",
    excerpt: "From beach days to boardrooms — the ultimate guide to wearing silver with confidence.",
    image: "https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80",
    category: "Style Guide",
    readTime: "4 min read",
    isFeatured: true,
    isNew: false,
    publishedAt: "2026-02-25",
  },
  {
    id: "3",
    slug: "sustainable-jewelry-movement",
    title: "Why Sustainable Jewelry Matters Now More Than Ever",
    excerpt: "Our commitment to ethical sourcing and zero-waste production practices.",
    image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
    category: "Sustainability",
    readTime: "6 min read",
    isFeatured: false,
    isNew: false,
    publishedAt: "2026-01-15",
  },
  {
    id: "4",
    slug: "spring-2026-collection-preview",
    title: "Spring 2026: A Preview of What's Coming",
    excerpt: "Get an exclusive first look at our upcoming seasonal collection.",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    category: "News",
    readTime: "3 min read",
    isFeatured: false,
    isNew: true,
    publishedAt: "2026-03-12",
  },
];

export function HomeBlogSection() {
  const featured = MOCK_ARTICLES.filter((a) => a.isFeatured).slice(0, 2);
  const topPost = MOCK_ARTICLES.find((a) => !a.isFeatured && !a.isNew) || MOCK_ARTICLES[2];
  const latestPost = MOCK_ARTICLES.find((a) => a.isNew) || MOCK_ARTICLES[3];

  return (
    <section className="py-32 bg-muted/30 backdrop-blur-3xl relative overflow-hidden">
      <div className="container relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <p className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-4">
              Stories & Insights
            </p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              FROM THE
              <br />
              <span className="text-primary italic">JOURNAL.</span>
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors whitespace-nowrap flex items-center gap-2"
          >
            Read All Articles <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* 2 Featured articles — large cards */}
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-8">
            {featured.map((article) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-3xl aspect-[4/5] mb-6">
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all z-10" />
                  <img
                    src={article.image}
                    alt={article.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    loading="lazy"
                  />
                  <div className="absolute top-6 left-6 z-20 flex gap-2">
                    <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-full">
                      Featured
                    </Badge>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                      {article.category}
                    </p>
                    <h3 className="text-2xl font-black text-white leading-tight">
                      {article.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-light line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                  <Clock className="h-3 w-3" />
                  {article.readTime}
                </div>
              </Link>
            ))}
          </div>

          {/* Sidebar: Top Post + Latest Post */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Top Post */}
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-4">
                Top Post
              </p>
              <Link to={`/blog/${topPost.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl aspect-[16/10] mb-4">
                  <img
                    src={topPost.image}
                    alt={topPost.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                  {topPost.category}
                </p>
                <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                  {topPost.title}
                </h3>
                <p className="text-sm text-muted-foreground font-light mt-2 line-clamp-2">
                  {topPost.excerpt}
                </p>
              </Link>
            </div>

            {/* Latest Post */}
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-4">
                Latest
              </p>
              <Link to={`/blog/${latestPost.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl aspect-[16/10] mb-4">
                  <img
                    src={latestPost.image}
                    alt={latestPost.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  {latestPost.isNew && (
                    <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground font-black text-[10px] uppercase tracking-widest rounded-full">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                  {latestPost.category}
                </p>
                <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                  {latestPost.title}
                </h3>
                <p className="text-sm text-muted-foreground font-light mt-2 line-clamp-2">
                  {latestPost.excerpt}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
