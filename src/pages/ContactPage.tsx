import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Mail, MapPin, Clock, Phone, Building2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

const STORES = [
  {
    name: 'Seminyak Store',
    type: 'store' as const,
    address: 'Jl. Kayu Aya, Seminyak, Bali',
    phone: '+62 361 XXX XXX',
    hours: 'Daily: 9am – 9pm WITA',
    mapUrl: 'https://maps.google.com/?q=Seminyak+Bali',
    color: 'bg-primary',
  },
  {
    name: '66 (Double Six) Store',
    type: 'store' as const,
    address: 'Jl. Double Six, Seminyak, Bali',
    phone: '+62 361 XXX XXX',
    hours: 'Daily: 9am – 9pm WITA',
    mapUrl: 'https://maps.google.com/?q=Double+Six+Seminyak+Bali',
    color: 'bg-secondary',
  },
  {
    name: 'Sahadewa Store',
    type: 'store' as const,
    address: 'Jl. Sahadewa, Denpasar, Bali',
    phone: '+62 361 XXX XXX',
    hours: 'Daily: 9am – 8pm WITA',
    mapUrl: 'https://maps.google.com/?q=Sahadewa+Denpasar+Bali',
    color: 'bg-accent',
  },
];

const OFFICE = {
  name: 'Kedonganan Office',
  type: 'office' as const,
  address: 'Kedonganan, Kuta Selatan, Badung, Bali',
  phone: '+62 361 XXX XXX',
  hours: 'Mon – Fri: 9am – 5pm WITA',
  mapUrl: 'https://maps.google.com/?q=Kedonganan+Bali',
};

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
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  useDocumentTitle('Contact Us — Bambu Silver by Estela');

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Get In Touch</p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-foreground">Contact Us</h1>
          <p className="mt-4 text-base text-muted-foreground max-w-md mx-auto">
            Visit us at any of our stores in Bali, or drop us a message.
          </p>
        </div>

        {/* Store Locations */}
        <div className="mb-16">
          <h2 className="text-center font-display text-2xl font-bold text-foreground mb-8">Our Stores</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STORES.map((store) => (
              <a
                key={store.name}
                href={store.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${store.color} rounded-full p-2`}>
                    <Store className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">{store.name}</h3>
                </div>
                <div className="space-y-2.5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                    <span>{store.hours}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-primary font-bold uppercase tracking-wider group-hover:underline">
                  View on Map →
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* Office */}
        <div className="mb-16">
          <h2 className="text-center font-display text-2xl font-bold text-foreground mb-8">Head Office</h2>
          <div className="max-w-md mx-auto">
            <a
              href={OFFICE.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-foreground rounded-full p-2">
                  <Building2 className="h-4 w-4 text-background" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">{OFFICE.name}</h3>
              </div>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                  <span>{OFFICE.address}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                  <span>{OFFICE.phone}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                  <span>{OFFICE.hours}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-primary font-bold uppercase tracking-wider group-hover:underline">
                View on Map →
              </p>
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="border-t border-border pt-14">
          <h2 className="text-center font-display text-2xl font-bold text-foreground mb-10">Send Us a Message</h2>
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-full p-2"><Mail className="h-4 w-4 text-primary" /></div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Email</h3>
                  <p className="text-sm text-muted-foreground">hello@bambusilver.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-secondary/10 rounded-full p-2"><Phone className="h-4 w-4 text-secondary" /></div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Phone</h3>
                  <p className="text-sm text-muted-foreground">+62 361 XXX XXX</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-accent/20 rounded-full p-2"><Clock className="h-4 w-4 text-accent-foreground" /></div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Support Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    Mon – Fri: 9am – 5pm WITA<br />
                    Sat: 10am – 2pm WITA
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</Label>
                  <Input id="name" name="name" value={form.name} onChange={handleChange} className="rounded-lg" placeholder="Your name" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="rounded-lg" placeholder="your@email.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</Label>
                <Input id="subject" name="subject" value={form.subject} onChange={handleChange} className="rounded-lg" placeholder="What is this about?" />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</Label>
                <Textarea id="message" name="message" value={form.message} onChange={handleChange} className="rounded-lg min-h-[140px]" placeholder="Tell us more…" />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
              </div>
              <Button type="submit" className="w-full rounded-full font-bold uppercase tracking-widest text-xs" disabled={sending}>
                {sending ? 'Sending…' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
