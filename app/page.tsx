'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Star,
  Shield,
  ArrowRight,
  Scissors,
  Flower2,
  Hand,
  Droplets,
  Waves,
  Brush,
  Grip,
  UserPlus,
  CalendarCheck,
  Smile,
  Plus,
  Minus,
} from 'lucide-react';
import SalonCard from '@/components/SalonCard';
import StyleCard from '@/components/StyleCard';
import Avatar from '@/components/Avatar';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';

const HERO_IMAGE = '/images/hero.jpg';
const TRENDING_THUMB = '/images/styles/knotless.jpg';

const categories = [
  { label: 'Braids', Icon: Scissors },
  { label: 'Natural Hair', Icon: Flower2 },
  { label: 'Nails', Icon: Hand },
  { label: 'Hair Treatments', Icon: Droplets },
  { label: 'Locs', Icon: Waves },
  { label: 'Makeup', Icon: Brush },
  { label: 'More', Icon: Grip },
];

const steps = [
  { Icon: UserPlus, title: 'Create an account', text: 'Sign up as a client to book, or as a braider to get discovered.' },
  { Icon: Search, title: 'Browse & compare', text: 'Explore salons, real styles and verified braiders near you.' },
  { Icon: CalendarCheck, title: 'Request a booking', text: 'Pick a style and date on the site — your braider gets the request instantly.' },
  { Icon: Smile, title: 'Get styled', text: 'Show up, get braided, and leave a review to help others.' },
];

const testimonials = [
  {
    name: 'Chipo M.',
    area: 'Avondale, Harare',
    img: '/images/people/p1.jpg',
    quote: 'Booked knotless braids through Chiedza and found a braider 10 minutes from home. The pictures matched exactly what I got.',
  },
  {
    name: 'Tariro N.',
    area: 'Bulawayo',
    img: '/images/people/p2.jpg',
    quote: 'As a braider, my books used to depend on WhatsApp status. Now new clients find my work and message me directly.',
  },
  {
    name: 'Rutendo K.',
    area: 'Highlands, Harare',
    img: '/images/people/p3.jpg',
    quote: 'I love that every salon has real reviews and prices. No more guessing or surprise charges when I arrive.',
  },
];

const faqs = [
  {
    q: 'Is Chiedza Beauty free to use?',
    a: 'Yes. Browsing salons, styles and braiders is completely free for clients. Braiders can create a profile for free too.',
  },
  {
    q: 'How do I book an appointment?',
    a: 'Open a salon or braider, choose the style you want, then use the "Contact on WhatsApp" button to agree a date and time directly with them.',
  },
  {
    q: 'What is the difference between a client and a braider account?',
    a: 'A client account is for people who want their hair done — you can save styles and book. A braider account is for professionals who want to list their services and be discovered.',
  },
  {
    q: 'Are the braiders verified?',
    a: 'Salon and braider profiles show ratings and reviews from real clients. We highlight verified professionals so you can book with confidence.',
  },
  {
    q: 'Which areas do you cover?',
    a: 'Chiedza Beauty covers Harare, Bulawayo, Mutare, Gweru, Kwekwe and more towns across Zimbabwe, with new braiders joining every week.',
  },
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Harare');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const locations = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Kwekwe'];

  const { data: salons } = useApi(() => api.getSalons(), []);
  const { data: styles } = useApi(() => api.getStyles(), []);
  const featuredSalons = (salons ?? []).slice(0, 5);
  const trendingStyles = (styles ?? []).slice(0, 3);

  const handleSearch = () => router.push('/salons');

  return (
    <>
      {/* HERO */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <p className="inline-flex items-center gap-2 text-accent font-bold text-sm tracking-[0.15em] uppercase mb-5">
                <span className="w-6 h-px bg-accent" />
                Welcome to Chiedza Beauty
              </p>

              <h1 className="text-5xl lg:text-6xl font-black text-primary leading-[1.05] mb-6">
                Find Your Beauty.
                <br />
                Find Your <span className="text-accent">Chiedza.</span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-md leading-relaxed">
                Discover trusted salons, explore real styles and connect with braiders
                across Zimbabwe.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/salons" className="btn-primary text-center">
                  Find a Salon
                </Link>
                <Link href="/styles" className="btn-outline-accent text-center">
                  Explore Styles
                </Link>
              </div>
            </div>

            {/* Right */}
            <div className="relative">
              <div className="relative h-[420px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={HERO_IMAGE}
                  alt="Woman with braided hairstyle"
                  className="w-full h-full object-cover object-[50%_20%]"
                />
              </div>

              {/* Trending card */}
              <div className="absolute -bottom-8 left-4 right-4 sm:left-8 sm:right-auto sm:w-80 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-accent font-bold text-[0.65rem] tracking-widest uppercase mb-1">
                    Trending in Harare
                  </p>
                  <p className="font-black text-primary text-lg leading-tight">Knotless Braids</p>
                  <p className="flex items-center gap-1.5 text-sm mt-1">
                    <Star className="w-4 h-4 fill-secondary text-secondary" />
                    <span className="font-bold text-gray-900">4.8</span>
                    <span className="text-gray-400">(120 reviews)</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">23 salons offer this style</p>
                </div>
                <img
                  src={TRENDING_THUMB}
                  alt="Knotless braids"
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 -mt-4 pb-4 relative z-10">
          <div className="bg-primary rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-white text-lg font-bold mb-5">What are you looking for?</h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for services, styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-base pl-12"
                />
              </div>

              <div className="relative md:w-56">
                <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="input-base pl-12 pr-8 appearance-none cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={handleSearch} className="btn-primary font-bold md:px-10">
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 mt-6 sm:divide-x sm:divide-white/15">
              <Feature Icon={MapPin} title="Near You" text="Search salons around you" />
              <Feature Icon={Shield} title="Verified Pros" text="Trusted & reviewed" />
              <Feature Icon={Star} title="Real Reviews" text="From real clients" />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-primary">Find what you need</h2>
            <Link
              href="/styles"
              className="text-accent font-bold hover:opacity-80 flex items-center gap-2 text-sm"
            >
              View all categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map(({ label, Icon }) => (
              <Link
                key={label}
                href="/styles"
                className="flex flex-col items-center justify-center gap-3 py-7 px-2 rounded-2xl bg-secondary/5 hover:bg-secondary/15 transition group"
              >
                <Icon className="w-8 h-8 text-accent group-hover:scale-110 transition" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-primary text-center">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-primary mb-3">How Chiedza Beauty works</h2>
            <p className="text-gray-600">
              Whether you want your hair done or you braid for a living, getting started takes minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ Icon, title, text }, i) => (
              <div key={title} className="relative bg-cream rounded-2xl p-6">
                <span className="absolute top-4 right-5 text-5xl font-black text-secondary/25">
                  {i + 1}
                </span>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold text-primary mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR SALONS */}
      <section className="py-8 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-primary">Popular Salons Near You</h2>
            <Link
              href="/salons"
              className="text-accent font-bold hover:opacity-80 flex items-center gap-2 text-sm"
            >
              View all salons <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredSalons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {featuredSalons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Loading salons…</p>
          )}
        </div>
      </section>

      {/* TRENDING STYLES */}
      <section className="py-12 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-primary">Trending Styles</h2>
            <Link
              href="/styles"
              className="text-accent font-bold hover:opacity-80 flex items-center gap-2 text-sm"
            >
              View all styles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {trendingStyles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingStyles.map((style) => (
                <StyleCard key={style.id} style={style} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Loading styles…</p>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-black text-primary text-center mb-12">Loved by clients and braiders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-cream rounded-2xl p-6 flex flex-col">
                <div className="flex items-center gap-1 text-secondary mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-secondary" />
                  ))}
                </div>
                <p className="text-gray-700 flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 mt-5">
                  <Avatar src={t.img} name={t.name} className="w-11 h-11" />
                  <div>
                    <p className="font-bold text-primary text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.area}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-cream">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black text-primary text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-bold text-primary">{f.q}</span>
                  {openFaq === i ? (
                    <Minus className="w-5 h-5 text-accent flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-accent flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && <p className="px-5 pb-5 -mt-1 text-gray-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAIDER CTA */}
      <section className="pb-16 pt-4 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-accent rounded-3xl px-8 py-10 sm:px-12 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl font-black text-white mb-2">Are you a braider?</h2>
              <p className="text-rose-100">
                Create a free profile, show your work and let new clients across Zimbabwe find you.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="btn-primary inline-flex items-center gap-2 flex-shrink-0"
            >
              Join as a Braider <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({
  Icon,
  title,
  text,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 sm:px-6 first:sm:pl-0">
      <Icon className="w-6 h-6 text-secondary flex-shrink-0" />
      <div>
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-blue-100 text-xs">{text}</p>
      </div>
    </div>
  );
}
