'use client';

import { ReactNode } from 'react';

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'dark' | 'purple';
  showDecorations?: boolean;
}

export function GradientCard({
  children,
  className = '',
  variant = 'primary',
  showDecorations = true,
}: GradientCardProps) {
  const gradientClasses = {
    primary: 'bg-gradient-to-br from-[#188775] via-[#0D6B5C] to-[#0A5A4D]',
    secondary: 'bg-gradient-to-br from-[#1E9B88] to-[#1AA384]',
    success: 'bg-gradient-to-br from-[#10B981] to-[#059669]',
    dark: 'bg-gradient-to-br from-[#3A4144] to-[#2D3436]',
    purple: 'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl ${gradientClasses[variant]} ${className}`}
      style={{ boxShadow: '0 12px 24px rgba(13, 107, 92, 0.35)' }}
    >
      {showDecorations && (
        <>
          <div
            className="absolute -top-16 -right-10 w-44 h-44 rounded-full pointer-events-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
          />
          <div
            className="absolute -bottom-8 -left-5 w-24 h-24 rounded-full pointer-events-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          />
          <div
            className="absolute top-20 left-10 w-14 h-14 rounded-full pointer-events-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
