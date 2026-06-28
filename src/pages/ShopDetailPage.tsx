import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, Navigation, Instagram, ArrowLeft } from "lucide-react";

const SHOPS: Record<string, {
  name: string;
  fullName: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  mapEmbed: string;
  mapUrl: string;
  image: string;
  gallery: string[];
  instagram?: string;
}> = {
  seminyak: {
    name: "Seminyak",
    fullName: "Bambu Silver — Seminyak Flagship",
    address: "Jl. Kayu Aya No. 42, Seminyak, Kuta Utara, Badung, Bali 80361",
    phone: "+62 361 XXX XXX",
    hours: "Daily: 9:00 AM – 9:00 PM WITA",
    description: "Our flagship boutique in the heart of Bali's most vibrant shopping district. Nestled among Seminyak's best galleries and fashion houses, this store showcases our full range of collections in a space designed to feel like stepping into a silversmith's atelier. Browse at your own pace, try on pieces, and discover the story behind every design.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.0!2d115.16!3d-8.69!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSeminyak!5e0!3m2!1sen!2sid!4v1",
    mapUrl: "https://maps.google.com/?q=Jl+Kayu+Aya+Seminyak+Bali",
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
      "https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    ],
    instagram: "@bambusilver.seminyak",
  },
  "double-six": {
    name: "Double Six",
    fullName: "Bambu Silver — 66 (Double Six)",
    address: "Jl. Double Six No. 18, Seminyak, Kuta Utara, Badung, Bali 80361",
    phone: "+62 361 XXX XXX",
    hours: "Daily: 9:00 AM – 9:00 PM WITA",
    description: "Located on the legendary Double Six strip, this boutique embodies the surf-meets-style energy of the area. The space features a curated selection of our boldest pieces, perfect for those who live life with intensity. Stop by after a sunset session and find your next signature piece.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.0!2d115.16!3d-8.70!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sDouble+Six!5e0!3m2!1sen!2sid!4v1",
    mapUrl: "https://maps.google.com/?q=Double+Six+Seminyak+Bali",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    ],
    instagram: "@bambusilver.66",
  },
  sahadewa: {
    name: "Sahadewa",
    fullName: "Bambu Silver — Sahadewa",
    address: "Jl. Sahadewa No. 7, Denpasar, Bali 80234",
    phone: "+62 361 XXX XXX",
    hours: "Daily: 9:00 AM – 8:00 PM WITA",
    description: "Our Sahadewa store bridges the gap between traditional Balinese craftsmanship and modern design sensibility. Situated in a quieter neighborhood away from the tourist corridor, this boutique attracts discerning locals and design enthusiasts seeking authentic silver artistry with a contemporary edge.",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.0!2d115.22!3d-8.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSahadewa!5e0!3m2!1sen!2sid!4v1",
    mapUrl: "https://maps.google.com/?q=Sahadewa+Denpasar+Bali",
    image: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
      "https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80",
    ],
    instagram: "@bambusilver.sahadewa",
  },
};

const ShopDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const shop = slug ? SHOPS[slug] : undefined;

  if (!shop) {
    return (
      <Layout>
        <div className="container py-40 text-center">
          <h1 className="font-display text-4xl font-black text-foreground mb-8">STORE NOT FOUND</h1>
          <Button asChild className="rounded-full px-12">
            <Link to="/contact">View All Locations</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title={shop.fullName}
        description={`Visit ${shop.fullName} in Bali. ${shop.description.slice(0, 140)}`}
        url={`/shop/${slug}`}
        keywords={`Bambu Silver ${shop.name}, silver jewelry store Bali, ${shop.name} jewelry shop`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          "name": shop.fullName,
          "description": shop.description,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": shop.address,
            "addressRegion": "Bali",
            "addressCountry": "ID"
          },
          "telephone": shop.phone,
          "openingHours": shop.hours,
          "url": `https://bambusilver.com/shop/${slug}`
        }}
      />
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
        <div className="container relative z-10 pb-16 pt-40">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-primary transition-all mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> All Locations
          </Link>
          <h1 className="font-display text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
            {shop.name}
            <span className="text-primary italic"> STORE.</span>
          </h1>
        </div>
      </section>

      {/* Info & Map */}
      <section className="container py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
              {shop.description}
            </p>

            <div className="space-y-5 pt-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-full p-3"><MapPin className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">Address</p>
                  <p className="text-foreground font-medium">{shop.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-secondary/10 rounded-full p-3"><Clock className="h-5 w-5 text-secondary" /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">Opening Hours</p>
                  <p className="text-foreground font-medium">{shop.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-accent/20 rounded-full p-3"><Phone className="h-5 w-5 text-accent-foreground" /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">Phone</p>
                  <p className="text-foreground font-medium">{shop.phone}</p>
                </div>
              </div>
              {shop.instagram && (
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-full p-3"><Instagram className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">Instagram</p>
                    <p className="text-foreground font-medium">{shop.instagram}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button asChild className="rounded-full font-black text-xs uppercase tracking-widest h-14 px-10">
                <a href={shop.mapUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-2 h-4 w-4" /> Get Directions
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full font-black text-xs uppercase tracking-widest h-14 px-10 border-border">
                <a href={`tel:${shop.phone.replace(/\s/g, "")}`}>
                  <Phone className="mr-2 h-4 w-4" /> Call Store
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-border shadow-xl h-[400px] lg:h-auto">
            <iframe
              src={shop.mapEmbed}
              className="w-full h-full min-h-[400px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${shop.name}`}
            />
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="container pb-20">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-10">
          INSIDE THE <span className="text-primary italic">STORE.</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {shop.gallery.map((img, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl overflow-hidden border border-border">
              <img src={img} alt={`${shop.name} gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20">
        <div className="container text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter mb-8">
            CAN'T VISIT IN PERSON?
          </h2>
          <Button asChild className="rounded-full bg-white text-primary hover:bg-black hover:text-white transition-all h-16 px-12 font-black text-xs uppercase tracking-widest">
            <Link to="/search">Browse Our Full Collection Online</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default ShopDetailPage;
