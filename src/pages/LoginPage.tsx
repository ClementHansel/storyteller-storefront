import { useState } from "react";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";

const LoginPage = () => {
  const { isAuthenticated, login, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      await login({ email, password });
      toast({
        title: "Welcome back! ✨",
        description: "You are now signed in.",
      });
      navigate("/");
    } catch (err: unknown) {
      toast({
        title: "Sign in failed",
        description:
          err instanceof Error
            ? err.message
            : "Please check your credentials and try again.",
        variant: "destructive",
      });
    }

  };

  if (isAuthenticated) {
    return (
      <Layout>
        <SEO title="Sign In" noIndex={true} url="/login" />
        <div className="container flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-sm space-y-8 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h1 className="font-display text-4xl font-extrabold text-foreground">
              You're In!
            </h1>
            <p className="text-muted-foreground">
              Time to explore something bold.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full rounded-full font-bold uppercase tracking-widest text-xs"
                size="lg"
                onClick={() => navigate("/")}
              >
                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full font-bold uppercase tracking-widest text-xs"
                size="lg"
                onClick={logout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Sign In" description="Sign in to your Bambu Silver account to manage orders, track your wishlist, and checkout faster." noIndex={true} url="/login" />
      <div className="container flex items-center justify-center min-h-screen py-32 w-full overflow-hidden">
        <div className="w-full max-w-lg space-y-12 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

          {/* Header */}
          <div className="text-center space-y-6 relative z-10">
            <h1 className="font-display text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-none">
              WELCOME <br />
              <span className="text-primary italic">BACK.</span>
            </h1>
            <p className="text-foreground/40 font-light uppercase tracking-widest text-xs">
              Sign in to your bold journey.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 relative z-10 bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 shadow-2xl"
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 px-4"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="YOU@EXAMPLE.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="rounded-full h-14 px-8 border-black/10 bg-white font-black text-xs tracking-widest focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 px-4"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded-full h-14 px-8 border-black/10 bg-white font-black text-xs tracking-widest focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full font-black uppercase tracking-[0.3em] text-[10px] h-14 bg-black text-white hover:bg-primary hover:text-white transition-all shadow-xl"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Enter the Soul"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-black/5" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-white px-6 text-foreground/20">
                New here?
              </span>
            </div>
          </div>

          {/* Register link */}
          <div className="text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-3 text-xs font-black text-primary hover:text-black transition-colors uppercase tracking-[0.2em]"
            >
              Create an account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
