import Link from 'next/link';
import { Heart, Users, Scissors, Sunrise } from 'lucide-react';

export const metadata = {
  title: 'About — Chiedza Beauty',
  description:
    "Chiedza Beauty is Zimbabwe's beauty discovery platform for African hair — connecting clients with braiders they can trust.",
};

const values = [
  { title: 'Beauty', text: 'African hair is identity, culture and confidence — we treat it that way.' },
  { title: 'Trust', text: 'Real photos, real reviews, real prices. No surprises when you arrive.' },
  { title: 'Dignity', text: 'Every braider gets a professional profile and a track record they own.' },
  { title: 'Local-first', text: 'Built for Harare, starting around HIT and Belvedere, then the rest of Zimbabwe.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-secondary font-bold tracking-[0.3em] text-xs mb-4">CHIEDZA GROUP</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            About <span className="text-secondary">Chiedza Beauty</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Zimbabwe&apos;s beauty discovery platform — focused on African hair. We&apos;re starting
            with braiding, the category women care about most.
          </p>
        </div>
      </section>

      {/* The name */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-2xl font-black text-primary mb-3">
            Chiedza <span className="text-accent font-bold">— light, brightness, a new dawn</span>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            In Shona, <em>chiedza</em> means more than light. It is clarity, revelation, the feeling
            of a new day arriving. When someone brings chiedza into a situation, they bring hope and
            a way forward. Chiedza Beauty exists to shine that light on a part of everyday life that
            has stayed in the dark: finding a braider you can trust, and being found as one.
          </p>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="max-w-4xl mx-auto px-4 pb-14 grid md:grid-cols-2 gap-6">
        <div className="bg-accent text-white rounded-2xl p-8">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black mb-2">Mission</h3>
          <p className="text-white/90 leading-relaxed">
            Make it easy for every woman in Zimbabwe to find, choose and book the right hair service —
            and for every braider to be found, reviewed, and grow.
          </p>
        </div>
        <div className="bg-primary text-white rounded-2xl p-8">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
            <Sunrise className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black mb-2">Vision</h3>
          <p className="text-white/90 leading-relaxed">
            A continent where African beauty culture is celebrated, searchable, and economically
            empowering for every woman who practises it.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-4xl mx-auto px-4 pb-14">
        <h2 className="text-2xl font-black text-primary mb-6">What we value</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {values.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-black text-accent mb-1">{v.title}</h3>
              <p className="text-gray-600 text-sm">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who we serve */}
      <section className="max-w-4xl mx-auto px-4 pb-16 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-lg font-black text-primary mb-2">For clients</h3>
          <ul className="text-gray-600 text-sm space-y-1.5 list-disc pl-5">
            <li>Find braiders by area, price and style</li>
            <li>Browse real photos before you decide</li>
            <li>Book a time slot and message the braider directly</li>
            <li>Students verify with a school email for a 10% first-visit discount</li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
            <Scissors className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-lg font-black text-primary mb-2">For braiders</h3>
          <ul className="text-gray-600 text-sm space-y-1.5 list-disc pl-5">
            <li>Be discovered by clients outside your personal network</li>
            <li>Show a growing portfolio and booking history</li>
            <li>Set your own hours — booked slots grey out automatically</li>
            <li>Build a track record you own</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-black mb-3">Join the pilot</h2>
          <p className="text-blue-100 mb-6">We&apos;re testing now around HIT and Belvedere.</p>
          <Link href="/auth/register" className="btn-primary inline-block">
            Create an account
          </Link>
        </div>
      </section>
    </div>
  );
}
