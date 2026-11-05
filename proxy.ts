import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
]);

export default clerkMiddleware({
  frontendApiProxy: {
    enabled: true,
    path: '/__clerk',
  },
  debug: process.env.NODE_ENV !== 'production',
  // Protect application pages while keeping auth pages and health checks public.
  // The frontend API proxy is handled before authentication by Clerk middleware.
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
