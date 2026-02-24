import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Mail, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    // Stub — would forward to Zenvix or an email service
    setTimeout(() => {
      setSending(false);
      toast.success('Message sent! We\'ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  useDocumentTitle('Contact Us — Bambu Silver by Estela');

  return (
    <Layout>
      

      <div className="container py-12 md:py-20">
        <div className="text-center mb-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-3">Get In Touch</p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Contact Us</h1>
          <p className="mt-4 text-sm text-muted-foreground font-light max-w-md mx-auto">
            Have a question about our collections, a custom order, or anything else? We'd love to hear from you.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-5">
          {/* Info sidebar */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-serif text-lg text-foreground">Email</h3>
                  <p className="text-sm text-muted-foreground font-light">hello@bambusilver.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-serif text-lg text-foreground">Studio</h3>
                  <p className="text-sm text-muted-foreground font-light">
                    Ubud, Bali<br />Indonesia
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-serif text-lg text-foreground">Hours</h3>
                  <p className="text-sm text-muted-foreground font-light">
                    Mon – Fri: 9am – 5pm WITA<br />
                    Sat: 10am – 2pm WITA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="rounded-none"
                  placeholder="Your name"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="rounded-none"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs uppercase tracking-wider text-muted-foreground">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="rounded-none"
                placeholder="What is this about?"
              />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                className="rounded-none min-h-[140px]"
                placeholder="Tell us more…"
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full rounded-none uppercase tracking-widest text-xs"
              disabled={sending}
            >
              {sending ? 'Sending…' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
