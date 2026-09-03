'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Award, MapPin, MessageCircle, ArrowLeft, CalendarCheck } from 'lucide-react';
import Avatar from '@/components/Avatar';
import BookingModal from '@/components/BookingModal';
import { api, assetUrl } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { workTypeLabel } from '@/lib/workTypes';

export default function StylistDetailPage({ params }: { params: { id: string } }) {
  const { data: s, loading, error } = useApi(() => api.getStylist(params.id), [params.id]);
  const [booking, setBooking] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !s) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4 text-center">
        <h1 className="text-2xl font-black text-primary mb-2">Braider not found</h1>
        <p className="text-gray-600 mb-6">{error || 'This profile may have been removed.'}</p>
        <Link href="/stylists" className="btn-primary inline-block">
          Back to braiders
        </Link>
      </div>
    );
  }

  const isRealAccount = Boolean(s.userId);
  const gallery = (s.portfolio || []).map((u) => assetUrl(u));
  const whatsapp = `https://wa.me/${(s.phone || '+263771234567').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hi ${s.name}, I found you on Chiedza Beauty and would like to book an appointment.`
  )}`;

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Link href="/stylists" className="inline-flex items-center gap-2 text-blue-200 text-sm hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> All braiders
          </Link>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar
              src={assetUrl(s.imageUrl) || s.imageUrl || undefined}
              name={s.name}
              className="w-28 h-28 ring-4 ring-white/20"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-black">{s.name}</h1>
              <p className="text-secondary font-semibold mt-1">{s.specialty}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-1 mt-3 text-sm text-blue-100">
                <span className="inline-flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> {s.experience}
                </span>
                {(s.location || s.salonId) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {s.location || `Salon #${s.salonId}`}
                  </span>
                )}
                {workTypeLabel(s.workType) && <span>{workTypeLabel(s.workType)}</span>}
                {s.rating > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-secondary text-secondary" /> {s.rating} ({s.reviews})
                  </span>
                )}
              </div>
              <p className="mt-3 font-bold">
                From <span className="text-secondary">{s.startingPrice}</span>
              </p>
              {isRealAccount && (
                <p
                  className={`mt-1 text-sm inline-flex items-center gap-1.5 ${
                    s.available ? 'text-green-300' : 'text-blue-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${s.available ? 'bg-green-400' : 'bg-blue-300'}`}
                  />
                  {s.available ? 'Available for bookings' : 'Not taking bookings right now'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {s.bio && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-black text-primary mb-2">About</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{s.bio}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-black text-primary mb-4">Work</h2>
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Work sample"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No photos uploaded yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-black text-primary mb-3">Get in touch</h2>
            {isRealAccount && (
              <>
                <button
                  onClick={() => setBooking(true)}
                  className="btn-primary w-full text-center py-2.5 inline-flex items-center justify-center gap-2 mb-3"
                >
                  <CalendarCheck className="w-4 h-4" /> Request a booking
                </button>
                <Link
                  href={`/messages?to=${s.userId}`}
                  className="btn-outline-accent w-full text-center py-2.5 inline-flex items-center justify-center gap-2 mb-3"
                >
                  <MessageCircle className="w-4 h-4" /> Message on Chiedza
                </Link>
              </>
            )}
            {s.phone && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-accent w-full text-center py-2.5 inline-block"
              >
                WhatsApp
              </a>
            )}
            {s.salonId && (
              <Link
                href={`/salons/${s.salonId}`}
                className="block text-center text-sm text-primary hover:underline mt-3"
              >
                View their salon
              </Link>
            )}
          </div>
        </div>
      </div>

      {booking && s.userId && (
        <BookingModal
          braiderId={s.userId}
          braiderName={s.name}
          defaultService={s.specialty}
          onClose={() => setBooking(false)}
        />
      )}
    </div>
  );
}
