'use client';

import { ReactNode } from 'react';

interface FrostedGlassCardProps {
  children: ReactNode;
  className?: string;
}

export function FrostedGlassCard({ children, className = '' }: FrostedGlassCardProps) {
  return (
    <div
      className={`frosted-glass shimmer p-6 text-white ${className}`}
    >
      {/* Decorative elements */}
      <div
        className="absolute -top-20 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      />
      <div
        className="absolute -bottom-24 -left-20 w-52 h-52 rounded-full pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      />
      <div
        className="absolute top-5 left-8 w-20 h-20 rounded-full pointer-events-none"
        style={{ backgroundColor: 'rgba(78, 205, 196, 0.12)' }}
      />
      <div
        className="absolute top-14 right-12 w-16 h-16 rounded-full pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      />

      {/* Frost particles */}
      <div className="absolute top-11 left-16 w-1 h-1 rounded-full bg-white/30 pointer-events-none" />
      <div className="absolute top-20 right-20 w-1 h-1 rounded-full bg-white/25 pointer-events-none" />
      <div className="absolute bottom-14 left-24 w-1.5 h-1.5 rounded-full bg-white/20 pointer-events-none" />
      <div className="absolute bottom-24 right-28 w-1 h-1 rounded-full bg-white/35 pointer-events-none" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
