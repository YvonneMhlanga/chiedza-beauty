'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

export default function StyleDetailPage({ params }: { params: { id: string } }) {
  const { data: style, loading, error } = useApi(() => api.getStyle(params.id), [params.id]);
  const [imgOk, setImgOk] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading style…</p>
      </div>
    );
  }

  if (error || !style) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Style Not Found</h1>
          {error && <p className="text-gray-500 mb-4">{error}</p>}
          <Link href="/styles" className="btn-primary inline-block">
            ← Back to Styles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image */}
          <div className="lg:col-span-2">
            {style.imageUrl && imgOk ? (
              <img
                src={style.imageUrl}
                alt={style.title}
                onError={() => setImgOk(false)}
                className="w-full h-96 object-cover rounded-2xl"
              />
            ) : (
              <div className="bg-gradient-to-br from-primary to-dark-navy rounded-2xl h-96 flex items-center justify-center">
                <div className="text-center text-white">
                  <Scissors className="w-14 h-14 mx-auto mb-4 opacity-90" strokeWidth={1.5} />
                  <p className="text-3xl font-black">{style.title}</p>
                  <p className="text-secondary font-semibold mt-2">{style.styleType}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h1 className="text-3xl font-bold mb-2">{style.title}</h1>
              <p className="text-secondary font-semibold mb-6">by {style.stylistName}</p>

              <div className="space-y-3 py-4 border-y border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-bold text-lg text-secondary">{style.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-semibold">{style.styleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{style.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Technique</span>
                  <span className="font-semibold">{style.technique}</span>
                </div>
              </div>

              <Link href={`/salons/${style.salonId}`} className="btn-primary w-full mt-6 inline-block text-center">
                View Salon
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/styles" className="text-primary font-bold hover:underline">
            ← Back to All Styles
          </Link>
        </div>
      </div>
    </div>
  );
}
