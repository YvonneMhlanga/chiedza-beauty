'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderText?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  placeholderText = 'Image',
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  if (imageError) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary to-secondary flex items-center justify-center`}
      >
        <div className="text-center text-white">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-70" />
          <p className="text-sm font-semibold opacity-70">{placeholderText}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`${className} bg-gray-200 animate-pulse`}></div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </>
  );
}