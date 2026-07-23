import { defineMiddleware } from 'astro:middleware';

const NOINDEX_PATH_PREFIXES = [
  '/api/',
  '/account/',
  '/staff/',
  '/staged/',
  '/knowledge/',
  '/blog/drafts/',
  '/book/thank-you/',
  '/free-guide/thank-you/',
];

function shouldNoindex(pathname: string) {
  return NOINDEX_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  if (shouldNoindex(context.url.pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
});
