import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;
  const locale = cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`../messages/${locale}/common.json`)).default,
      ...(await import(`../messages/${locale}/auth.json`)).default,
      ...(await import(`../messages/${locale}/dashboard.json`)).default,
      ...(await import(`../messages/${locale}/ai.json`)).default,
      ...(await import(`../messages/${locale}/forex.json`)).default,
      ...(await import(`../messages/${locale}/projects.json`)).default,
      ...(await import(`../messages/${locale}/engine.json`)).default,
      ...(await import(`../messages/${locale}/connect.json`)).default,
      ...(await import(`../messages/${locale}/records.json`)).default,
      ...(await import(`../messages/${locale}/settings.json`)).default,
      ...(await import(`../messages/${locale}/contracts.json`)).default,
      ...(await import(`../messages/${locale}/users.json`)).default,
      ...(await import(`../messages/${locale}/migration.json`)).default,
    },
  };
});
