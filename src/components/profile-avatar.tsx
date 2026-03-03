'use client';

import Image from 'next/image';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileAvatar({ src, name, size = 'md' }: ProfileAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0`}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0`}>
      {initials ? (
        <span className="font-medium text-primary">{initials}</span>
      ) : (
        <User size={iconSizes[size]} className="text-primary" />
      )}
    </div>
  );
}
