import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from './i18n/config';

export function middleware(request: NextRequest) {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value as Locale | undefined;

  if (!cookieLocale || !locales.includes(cookieLocale)) {
    const response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', defaultLocale, {
      path: '/',
      maxAge: 31536000,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
