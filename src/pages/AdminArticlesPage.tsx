/**
 * Admin Articles Management — Frontend Only
 *
 * ============================================================
 * API CONTRACT (for backend implementation)
 * ============================================================
 *
 * Base URL: /api/retail/admin/articles
 * Auth: Bearer token (admin role required)
 *
 * GET    /articles              — List all articles (paginated)
 *   Query: ?page=1&pageSize=20&status=published|draft
 *   Response: { articles: Article[], total: number, page: number, pageSize: number }
 *
 * GET    /articles/:id          — Get single article
 *   Response: Article
 *
 * POST   /articles              — Create article
 *   Body: CreateArticlePayload
 *   Response: Article
 *
 * PUT    /articles/:id          — Update article
 *   Body: Partial<CreateArticlePayload>
 *   Response: Article
 *
 * DELETE /articles/:id          — Delete article
 *   Response: { success: true }
 *
 * POST   /articles/:id/publish  — Publish a draft article
 *   Response: Article
 *
 * POST   /articles/:id/unpublish — Unpublish an article
 *   Response: Article
 *
 * ============================================================
 * TYPE DEFINITIONS
 * ============================================================
 *
 * interface Article {
 *   id: string;
 *   title: string;
 *   slug: string;
 *   excerpt: string;
 *   content: string;          // Markdown or HTML
 *   coverImage: string;       // URL
 *   category: string;
 *   tags: string[];
 *   author: string;
 *   readTime: string;         // e.g. "5 min read"
 *   status: "draft" | "published";
 *   isFeatured: boolean;
 *   isNew: boolean;
 *   isTopPost: boolean;
 *   publishedAt: string | null;
 *   createdAt: string;
 *   updatedAt: string;
 * }
 *
 * interface CreateArticlePayload {
 *   title: string;
 *   slug: string;
 *   excerpt: string;
 *   content: string;
 *   coverImage: string;
 *   category: string;
 *   tags: string[];
 *   author: string;
 *   isFeatured: boolean;
 *   isNew: boolean;
 *   isTopPost: boolean;
 * }
 *
 * ============================================================
 */

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, Sparkles, TrendingUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  readTime: string;
  status: "draft" | "published";
  isFeatured: boolean;
  isNew: boolean;
  isTopPost: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Mock data for UI development
const MOCK_ARTICLES: Article[] = [
  {
    id: "1",
    title: "The Ancient Art of Balinese Silver Crafting",
    slug: "bali-silver-craft-heritage",
    excerpt: "Discover how centuries-old techniques shape every piece.",
    content: "Full article content here...",
    coverImage: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
    category: "Heritage",
    tags: ["craft", "bali", "tradition"],
    author: "Estela",
    readTime: "5 min read",
    status: "published",
    isFeatured: true,
    isNew: false,
    isTopPost: false,
    publishedAt: "2026-02-10",
    createdAt: "2026-02-08",
    updatedAt: "2026-02-10",
  },
  {
    id: "2",
    title: "Spring 2026: A Preview of What's Coming",
    slug: "spring-2026-collection-preview",
    excerpt: "Get an exclusive first look at our upcoming seasonal collection.",
    content: "Full article content here...",
    coverImage: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    category: "News",
    tags: ["collection", "spring", "preview"],
    author: "Estela",
    readTime: "3 min read",
    status: "draft",
    isFeatured: false,
    isNew: true,
    isTopPost: false,
    publishedAt: null,
    createdAt: "2026-03-12",
    updatedAt: "2026-03-12",
  },
];

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "",
  tags: "",
  author: "",
  isFeatured: false,
  isNew: false,
  isTopPost: false,
};

const AdminArticlesPage = () => {
  const { isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useDocumentTitle("Admin — Manage Articles");

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const openCreate = () => {
    setEditingArticle(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      coverImage: article.coverImage,
      category: article.category,
      tags: article.tags.join(", "),
      author: article.author,
      isFeatured: article.isFeatured,
      isNew: article.isNew,
      isTopPost: article.isTopPost,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.slug) {
      toast.error("Title and slug are required");
      return;
    }

    const now = new Date().toISOString();
    if (editingArticle) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === editingArticle.id
            ? {
                ...a,
                ...form,
                tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
                readTime: `${Math.max(1, Math.ceil(form.content.split(" ").length / 200))} min read`,
                updatedAt: now,
              }
            : a
        )
      );
      toast.success("Article updated");
    } else {
      const newArticle: Article = {
        id: `art_${Date.now()}`,
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        readTime: `${Math.max(1, Math.ceil(form.content.split(" ").length / 200))} min read`,
        status: "draft",
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      setArticles((prev) => [newArticle, ...prev]);
      toast.success("Article created as draft");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    toast.success("Article deleted");
  };

  const togglePublish = (id: string) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: a.status === "published" ? "draft" : "published",
              publishedAt: a.status === "published" ? null : new Date().toISOString(),
            }
          : a
      )
    );
  };

  const toggleFlag = (id: string, flag: "isFeatured" | "isNew" | "isTopPost") => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [flag]: !a[flag] } : a))
    );
    toast.success("Flag updated");
  };

  return (
    <Layout>
      <div className="container max-w-5xl pt-32 md:pt-40 pb-20 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-5xl font-black text-foreground tracking-tighter">
              MANAGE <span className="text-primary italic">ARTICLES.</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Create, edit, and flag articles for the journal.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="rounded-full font-black text-xs uppercase tracking-widest h-12 px-8">
                <Plus className="mr-2 h-4 w-4" /> New Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-black uppercase tracking-tighter">
                  {editingArticle ? "Edit Article" : "Create New Article"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                    <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="rounded-xl" placeholder="Article title" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slug</Label>
                    <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="rounded-xl" placeholder="article-slug" />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                    <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl" placeholder="Heritage, News, Style Guide" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Author</Label>
                    <Input value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} className="rounded-xl" placeholder="Author name" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cover Image URL</Label>
                  <Input value={form.coverImage} onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))} className="rounded-xl" placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tags (comma separated)</Label>
                  <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="rounded-xl" placeholder="craft, bali, tradition" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Excerpt</Label>
                  <Textarea value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} className="rounded-xl" placeholder="Short summary (1-2 sentences)" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content</Label>
                  <Textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} className="rounded-xl min-h-[200px]" placeholder="Full article content (Markdown supported)" />
                </div>
                <div className="flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
                    <span className="text-xs font-black uppercase tracking-widest">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={form.isNew} onCheckedChange={(v) => setForm((p) => ({ ...p, isNew: v }))} />
                    <span className="text-xs font-black uppercase tracking-widest">New</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={form.isTopPost} onCheckedChange={(v) => setForm((p) => ({ ...p, isTopPost: v }))} />
                    <span className="text-xs font-black uppercase tracking-widest">Top Post</span>
                  </label>
                </div>
                <Button onClick={handleSave} className="w-full rounded-full font-black text-xs uppercase tracking-widest h-12">
                  {editingArticle ? "Save Changes" : "Create Article"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Article List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {article.coverImage && (
                  <div className="sm:w-40 h-32 sm:h-auto shrink-0">
                    <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={article.status === "published" ? "default" : "secondary"} className="text-[10px] uppercase tracking-widest rounded-full">
                      {article.status}
                    </Badge>
                    {article.isFeatured && (
                      <Badge className="bg-accent text-accent-foreground text-[10px] uppercase tracking-widest rounded-full">
                        <Star className="h-2.5 w-2.5 mr-1" /> Featured
                      </Badge>
                    )}
                    {article.isNew && (
                      <Badge className="bg-secondary text-secondary-foreground text-[10px] uppercase tracking-widest rounded-full">
                        <Sparkles className="h-2.5 w-2.5 mr-1" /> New
                      </Badge>
                    )}
                    {article.isTopPost && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] uppercase tracking-widest rounded-full">
                        <TrendingUp className="h-2.5 w-2.5 mr-1" /> Top Post
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-black text-foreground mb-1">{article.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{article.excerpt}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    By {article.author} · {article.category} · {article.readTime}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center justify-end gap-2 p-4 border-t sm:border-t-0 sm:border-l border-border">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => togglePublish(article.id)} title={article.status === "published" ? "Unpublish" : "Publish"}>
                    {article.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => toggleFlag(article.id, "isFeatured")} title="Toggle Featured">
                    <Star className={`h-4 w-4 ${article.isFeatured ? "fill-accent text-accent" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => openEdit(article)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive hover:text-destructive" onClick={() => handleDelete(article.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {articles.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No articles yet. Create your first one!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminArticlesPage;
