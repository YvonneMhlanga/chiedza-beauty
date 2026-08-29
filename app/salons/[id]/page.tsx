'use client';

import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import Link from 'next/link';
import { Star, MapPin, Phone, MessageCircle } from 'lucide-react';

export default function SalonDetailPage({ params }: { params: { id: string } }) {
  const { data: salon, loading, error } = useApi(() => api.getSalon(params.id), [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading salon…</p>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Salon Not Found</h1>
          {error && <p className="text-gray-500 mb-4">{error}</p>}
          <Link href="/salons" className="btn-primary inline-block">
            ← Back to Salons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-80 bg-gradient-to-br from-accent to-red-800">
        {salon.imageUrl && (
          <img
            src={salon.imageUrl}
            alt={salon.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-4xl font-black text-white drop-shadow-lg">{salon.name}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10 mb-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-black mb-4">{salon.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(salon.rating)
                      ? 'fill-secondary text-secondary'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-gray-900">{salon.rating}</span>
            <span className="text-gray-600">({salon.reviews} reviews)</span>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 mb-8 pb-8 border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-secondary" />
              <span className="text-gray-700">{salon.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-secondary" />
              <span className="text-gray-700">{salon.phone}</span>
            </div>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Services</h2>
            <div className="flex flex-wrap gap-3">
              {salon.services.map((service) => (
                <div key={service} className="badge-secondary px-4 py-2">
                  {service}
                </div>
              ))}
            </div>
            <p className="text-lg mt-4">
              <span className="text-gray-600">Price Range:</span>
              <span className="text-2xl font-bold text-secondary ml-2">{salon.priceRange}</span>
            </p>
          </div>

          {/* CTA */}
          <a
            href={`https://wa.me/${salon.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hi ${salon.name}, I found you on Chiedza Beauty and would like to book an appointment.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Contact on WhatsApp
          </a>
        </div>

        <div className="text-center mt-8">
          <Link href="/salons" className="text-primary font-bold hover:underline">
            ← Back to All Salons
          </Link>
        </div>
      </div>
    </div>
  );
}
