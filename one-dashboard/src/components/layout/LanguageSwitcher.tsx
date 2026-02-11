'use client';

import { useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    router.refresh();
  };

  const currentLocale =
    (typeof document !== 'undefined' &&
      document.cookie
        .split('; ')
        .find((c) => c.startsWith('NEXT_LOCALE='))
        ?.split('=')[1]) ||
    'en';

  return (
    <button
      onClick={() => switchLocale(currentLocale === 'en' ? 'zh-Hans' : 'en')}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      title={currentLocale === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
      <span className="text-xs font-medium">
        {currentLocale === 'en' ? 'EN' : '中文'}
      </span>
    </button>
  );
}
