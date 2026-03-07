import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-display text-8xl font-extrabold text-gradient-vibrant">404</h1>
          <p className="text-xl text-muted-foreground">This page doesn't exist — yet.</p>
          <Button asChild className="rounded-full font-bold">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
