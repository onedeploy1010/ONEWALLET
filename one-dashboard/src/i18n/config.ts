export const locales = ['en', 'zh-Hans'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
