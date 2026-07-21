export default function robots() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/login', '/signup', '/profile', '/settings'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}