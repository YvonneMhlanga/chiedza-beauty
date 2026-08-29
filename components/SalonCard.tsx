'use client';

import Link from 'next/link';
import { Star, MapPin, Heart } from 'lucide-react';
import { useState } from 'react';

interface SalonCardProps {
  salon: {
    id: string;
    name: string;
    location: string;
    neighborhood?: string;
    services: string[];
    priceRange: string;
    rating: number;
    reviews: number;
    imageUrl: string;
  };
}

const gradients = [
  'from-accent to-red-800',
  'from-primary to-dark-navy',
  'from-secondary to-yellow-600',
  'from-rose-700 to-accent',
  'from-dark-navy to-primary',
];

function priceFrom(priceRange: string) {
  const match = priceRange.match(/\$\s?\d+/);
  return match ? `From ${match[0].replace(/\s/g, '')}` : priceRange;
}

export default function SalonCard({ salon }: SalonCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imgOk, setImgOk] = useState(Boolean(salon.imageUrl));
  const gradient = gradients[(parseInt(salon.id, 10) || 0) % gradients.length];

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorited((v) => !v);
  };

  return (
    <Link href={`/salons/${salon.id}`} className="group block h-full">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44">
          {imgOk ? (
            <img
              src={salon.imageUrl}
              alt={salon.name}
              className="w-full h-full object-cover"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-white text-2xl font-black px-4 text-center">{salon.name}</span>
            </div>
          )}

          <button
            onClick={toggleFavorite}
            aria-label="Save salon"
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-accent text-accent' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-primary group-hover:text-accent transition line-clamp-1">
            {salon.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1 text-sm">
            <Star className="w-4 h-4 fill-secondary text-secondary" />
            <span className="font-bold text-gray-900">{salon.rating}</span>
            <span className="text-gray-400">({salon.reviews})</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
            <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="line-clamp-1">{salon.neighborhood || salon.location}</span>
          </div>

          <p className="text-gray-500 text-xs mt-2 line-clamp-1">
            {salon.services.slice(0, 3).join(' • ')}
          </p>

          <p className="text-accent font-bold mt-3">{priceFrom(salon.priceRange)}</p>
        </div>
      </div>
    </Link>
  );
}
