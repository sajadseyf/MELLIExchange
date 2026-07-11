import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Exclude /landing so it's served directly without locale redirect
  matcher: ['/((?!api|_next|landing|vcard|.*\\..*).*)'],
};
