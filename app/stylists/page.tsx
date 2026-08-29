'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Award, MapPin, MessageCircle, CalendarCheck } from 'lucide-react';
import Avatar from '@/components/Avatar';
import BookingModal from '@/components/BookingModal';
import { api, assetUrl, type Stylist } from '@/lib/api';
import { useApi } from '@/lib/useApi';

// Fallback work samples for the seeded demo pros (who have no uploaded portfolio).
const DEMO_PORTFOLIO = [
  '/images/styles/box-braids.jpg',
  '/images/styles/cornrows.jpg',
  '/images/styles/twists.jpg',
  '/images/styles/boho-braids.jpg',
];

export default function StylistsPage() {
  const { data: stylists, loading, error } = useApi(() => api.getStylists(), []);
  const list = stylists ?? [];
  const [bookingFor, setBookingFor] = useState<Stylist | null>(null);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-primary text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-4">Meet the braiders</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Braiding professionals across Zimbabwe — see their work, experience and starting
            prices, then message them directly on Chiedza Beauty.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading && <p className="text-gray-600">Loading braiders…</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">{error}</div>
        )}

        {!loading && !error && (
          list.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {list.map((s, idx) => {
                const isRealAccount = Boolean(s.userId);
                const gallery =
                  s.portfolio && s.portfolio.length > 0
                    ? s.portfolio.slice(0, 4).map((u) => assetUrl(u))
                    : isRealAccount
                      ? []
                      : DEMO_PORTFOLIO;

                return (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex gap-4">
                      <Avatar src={assetUrl(s.imageUrl) || s.imageUrl} name={s.name} className="w-20 h-20" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold text-primary">{s.name}</h3>
                            <p className="text-accent font-semibold text-sm">{s.specialty}</p>
                          </div>
                          {s.rating > 0 && (
                            <div className="flex items-center gap-1 text-sm flex-shrink-0">
                              <Star className="w-4 h-4 fill-secondary text-secondary" />
                              <span className="font-bold">{s.rating}</span>
                              <span className="text-gray-400">({s.reviews})</span>
                            </div>
                          )}
                        </div>
                        {s.bio && <p className="text-gray-600 text-sm mt-2">{s.bio}</p>}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm">
                          <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
                            <Award className="w-4 h-4 text-accent" />
                            {s.experience}
                          </span>
                          {(s.location || s.salonId) && (
                            <span className="inline-flex items-center gap-1.5 text-primary font-semibold">
                              <MapPin className="w-4 h-4 text-accent" />
                              {s.location || `Salon #${s.salonId}`}
                            </span>
                          )}
                          <span className="text-primary font-semibold">
                            From <span className="text-accent">{s.startingPrice}</span>
                          </span>
                          {isRealAccount && (
                            <span
                              className={`inline-flex items-center gap-1.5 font-semibold ${
                                s.available ? 'text-green-600' : 'text-gray-400'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  s.available ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              />
                              {s.available ? 'Available' : 'Not available'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Portfolio strip */}
                    {gallery.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-5">
                        {gallery.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt="Work sample"
                            className={`w-full h-20 object-cover rounded-lg ${
                              (idx + i) % 4 === 3 ? 'hidden sm:block' : ''
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {isRealAccount ? (
                      <>
                        <div className="flex gap-3 mt-5">
                          <button
                            onClick={() => setBookingFor(s)}
                            className="btn-primary flex-1 text-center py-2.5 inline-flex items-center justify-center gap-2"
                          >
                            <CalendarCheck className="w-4 h-4" /> Request booking
                          </button>
                          <Link
                            href={`/messages?to=${s.userId}`}
                            className="btn-outline-accent flex-1 text-center py-2.5 inline-flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" /> Message
                          </Link>
                        </div>
                        <Link
                          href={`/stylists/${s.id}`}
                          className="block text-center text-sm text-primary hover:underline mt-3"
                        >
                          View full profile
                        </Link>
                      </>
                    ) : (
                      <div className="flex gap-3 mt-5">
                        <Link
                          href={`/stylists/${s.id}`}
                          className="btn-outline-accent flex-1 text-center py-2.5"
                        >
                          View profile
                        </Link>
                        <a
                          href={`https://wa.me/${(s.phone || '+263771234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hi ${s.name}, I found you on Chiedza Beauty and would like to book an appointment.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary flex-1 text-center py-2.5"
                        >
                          Message on WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg">
                No braiders yet. Run &quot;npm run seed&quot; in the backend to add demo data, or
                sign up as a braider.
              </p>
            </div>
          )
        )}
      </div>

      {bookingFor && bookingFor.userId && (
        <BookingModal
          braiderId={bookingFor.userId}
          braiderName={bookingFor.name}
          defaultService={bookingFor.specialty}
          onClose={() => setBookingFor(null)}
        />
      )}
    </div>
  );
}
