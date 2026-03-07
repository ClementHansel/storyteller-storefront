import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();

  useDocumentTitle('Sign In — Bambu Silver by Estela');

  return (
    <Layout>
      <div className="container flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div>
            <h1 className="font-display text-4xl font-extrabold text-foreground">Welcome</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {isAuthenticated
                ? 'You\'re in! Time to explore.'
                : 'Sign in to access your bag, wishlist, and checkout.'}
            </p>
          </div>

          {isAuthenticated ? (
            <div className="space-y-3">
              <Button className="w-full rounded-full font-bold uppercase tracking-widest text-xs" size="lg" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
              <Button variant="outline" className="w-full rounded-full font-bold uppercase tracking-widest text-xs" size="lg" onClick={logout}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {import.meta.env.DEV ? (
                <>
                  <Button className="w-full rounded-full font-bold uppercase tracking-widest text-xs" size="lg" onClick={() => { login(); navigate('/'); }}>
                    Sign In (Dev Mode)
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Development mode — authentication will be integrated with your account provider.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Authentication is coming soon. Please check back later.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
