import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const { isAuthenticated, login, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useDocumentTitle('Sign In — Bambu Silver by Estela');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      await login({ email, password });
      toast({ title: 'Welcome back! ✨', description: 'You are now signed in.' });
      navigate('/');
    } catch (err: any) {
      toast({
        title: 'Sign in failed',
        description: err?.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    }
  };

  if (isAuthenticated) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-sm space-y-8 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <h1 className="font-display text-4xl font-extrabold text-foreground">You're In!</h1>
            <p className="text-muted-foreground">Time to explore something bold.</p>
            <div className="space-y-3">
              <Button className="w-full rounded-full font-bold uppercase tracking-widest text-xs" size="lg" onClick={() => navigate('/')}>
                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full rounded-full font-bold uppercase tracking-widest text-xs" size="lg" onClick={logout}>
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
      <div className="container flex items-center justify-center min-h-[70vh] py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-5xl font-extrabold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue your journey.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="rounded-full h-12 px-5 border-border bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold uppercase tracking-wider text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded-full h-12 px-5 border-border bg-background"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full font-bold uppercase tracking-widest text-xs h-12"
              size="lg"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground tracking-widest">New here?</span>
            </div>
          </div>

          {/* Register link */}
          <div className="text-center">
            <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4">
              Create an account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
