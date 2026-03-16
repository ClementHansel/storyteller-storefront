import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";

const BOUTIQUES = [
  {
    slug: "seminyak",
    name: "Seminyak",
    tagline: "Our flagship in the heart of Bali's style district.",
    image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80",
    hours: "Daily 9am – 9pm",
  },
  {
    slug: "double-six",
    name: "Double Six",
    tagline: "Bold pieces meet the iconic surf culture of 66.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    hours: "Daily 9am – 9pm",
  },
  {
    slug: "sahadewa",
    name: "Sahadewa",
    tagline: "Where tradition blends with contemporary design.",
    image: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&q=80",
    hours: "Daily 9am – 8pm",
  },
];

export function HomeBoutiqueSection() {
  return (
    <section className="py-32 container">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <p className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-4">
            Experience In Person
          </p>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            VISIT OUR
            <br />
            <span className="text-primary italic">BOUTIQUES.</span>
          </h2>
        </div>
        <Link
          to="/contact"
          className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors whitespace-nowrap flex items-center gap-2"
        >
          All Locations <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {BOUTIQUES.map((shop) => (
          <Link
            key={shop.slug}
            to={`/shop/${shop.slug}`}
            className="group relative overflow-hidden rounded-3xl aspect-[3/4] block"
          >
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-700 z-10" />
            <img
              src={shop.image}
              alt={`${shop.name} boutique`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 p-8 z-20">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {shop.hours}
                </span>
              </div>
              <h3 className="text-3xl font-black text-white leading-none mb-2">
                {shop.name}
              </h3>
              <p className="text-sm text-white/70 font-light mb-6">
                {shop.tagline}
              </p>
              <Button
                variant="outline"
                className="rounded-full border-white/20 text-white bg-white/5 hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Visit This Store
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
