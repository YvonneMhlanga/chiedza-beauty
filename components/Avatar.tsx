'use client';

import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

// Round photo avatar. Falls back to the person's initial on a brand-colour
// circle if the image is missing — never an icon.
export default function Avatar({ src, name, className = 'w-11 h-11' }: AvatarProps) {
  const [ok, setOk] = useState(Boolean(src));
  const initial = name?.trim()?.charAt(0).toUpperCase() || '?';

  if (ok && src) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setOk(false)}
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <span
      className={`${className} rounded-full flex-shrink-0 bg-accent text-white font-black flex items-center justify-center`}
      aria-label={name}
    >
      {initial}
    </span>
  );
}
