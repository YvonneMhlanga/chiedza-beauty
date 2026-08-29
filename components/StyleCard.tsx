'use client';

import Link from 'next/link';
import { Heart, Scissors } from 'lucide-react';
import { useState } from 'react';

interface StyleCardProps {
  style: {
    id: string;
    title: string;
    imageUrl: string;
    stylistName: string;
    salonId: string;
    styleType: string;
    price: string;
  };
}

const gradients = [
  'from-accent to-red-800',
  'from-primary to-dark-navy',
  'from-secondary to-yellow-600',
  'from-rose-700 to-accent',
  'from-dark-navy to-primary',
  'from-yellow-700 to-secondary',
];

export default function StyleCard({ style }: StyleCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imgOk, setImgOk] = useState(Boolean(style.imageUrl));
  const gradient = gradients[(parseInt(style.id.replace(/\D/g, ''), 10) || 0) % gradients.length];

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorited((v) => !v);
  };

  return (
    <Link href={`/styles/${style.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        {/* Image */}
        <div className="relative h-64">
          {imgOk ? (
            <img
              src={style.imageUrl}
              alt={style.title}
              className="w-full h-full object-cover"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white`}>
              <Scissors className="w-10 h-10 mb-3 opacity-90" strokeWidth={1.5} />
              <span className="text-xl font-black">{style.styleType}</span>
            </div>
          )}

          <button
            onClick={toggleFavorite}
            aria-label="Save style"
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-accent text-accent' : 'text-gray-400'}`} />
          </button>

          <span className="absolute bottom-3 right-3 bg-white/95 text-accent font-bold text-sm px-3 py-1 rounded-full shadow">
            {style.price}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-bold text-primary line-clamp-1 group-hover:text-accent transition">
            {style.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            by <span className="font-semibold text-gray-700">{style.stylistName}</span>
          </p>
          <p className="text-xs font-semibold text-accent mt-2">{style.styleType}</p>
        </div>
      </div>
    </Link>
  );
}
