import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { isAuthenticated, devLogin, devLogout } = useAuth();
  const navigate = useNavigate();

  useDocumentTitle('Sign In — Bambu Silver by Estela');

  return (
    <Layout>
      <div className="container flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div>
            <h1 className="font-serif text-4xl font-light text-foreground">Welcome</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {isAuthenticated
                ? 'You are signed in. Enjoy shopping!'
                : 'Sign in to access your cart, wishlist, and checkout.'}
            </p>
          </div>

          {isAuthenticated ? (
            <div className="space-y-3">
              <Button className="w-full rounded-none uppercase tracking-widest text-xs" size="lg" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
              <Button variant="outline" className="w-full rounded-none uppercase tracking-widest text-xs" size="lg" onClick={devLogout}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button className="w-full rounded-none uppercase tracking-widest text-xs" size="lg" onClick={() => { devLogin(); navigate('/'); }}>
                Sign In (Dev Mode)
              </Button>
              <p className="text-xs text-muted-foreground">
                This is a stub login. Real authentication will be integrated with Zenvix later.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
