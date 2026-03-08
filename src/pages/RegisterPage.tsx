import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight } from "lucide-react";

const RegisterPage = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useDocumentTitle("Create Account — Bambu Silver by Estela");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      await register({ name, email, password, phone: phone || undefined });
      toast({
        title: "Account created! 🎉",
        description: "Welcome to Bambu Silver.",
      });
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container flex items-center justify-center min-h-screen py-32 w-full overflow-hidden">
        <div className="w-full max-w-lg space-y-12 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />

          {/* Header */}
          <div className="text-center space-y-6 relative z-10">
            <h1 className="font-display text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-none">
              JOIN THE <br />
              <span className="text-primary italic">CIRCLE.</span>
            </h1>
            <p className="text-foreground/40 font-light uppercase tracking-widest text-xs">
              Begin your bold silver journey.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 relative z-10 bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-black/5 shadow-2xl"
          >
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 px-4"
              >
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="YOUR NAME"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="rounded-full h-14 px-8 border-black/10 bg-white font-black text-xs tracking-widest focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="reg-email"
                className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 px-4"
              >
                Email
              </Label>
              <Input
                id="reg-email"
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
                htmlFor="phone"
                className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 px-4"
              >
                Phone (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className="rounded-full h-14 px-8 border-black/10 bg-white font-black text-xs tracking-widest focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="reg-password"
                className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 px-4"
              >
                Password
              </Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded-full h-14 px-8 border-black/10 bg-white font-black text-xs tracking-widest focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 px-4"
              >
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
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
                "Join the Rebellion"
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
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-3 text-xs font-black text-primary hover:text-black transition-colors uppercase tracking-[0.2em]"
            >
              Sign in instead <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
