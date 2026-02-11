'use client';

import { ReactNode } from 'react';

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'dark' | 'purple' | 'cyan';
  showDecorations?: boolean;
}

export function GradientCard({
  children,
  className = '',
  variant = 'primary',
  showDecorations = true,
}: GradientCardProps) {
  const gradientClasses = {
    primary: 'bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#0284C7]',
    secondary: 'bg-gradient-to-br from-[#2563EB] to-[#3B82F6]',
    success: 'bg-gradient-to-br from-[#10B981] to-[#059669]',
    dark: 'bg-gradient-to-br from-[#1E293B] to-[#0F172A]',
    purple: 'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]',
    cyan: 'bg-gradient-to-br from-[#06B6D4] to-[#0891B2]',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${gradientClasses[variant]} ${className}`}
      style={{ boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)' }}
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
