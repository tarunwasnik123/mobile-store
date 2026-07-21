const BASE = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

async function safeFetch(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return data?.results || data || [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const staticRoutes = [
    '',
    '/find',
    '/latest',
    '/best',
    '/upcoming',
    '/compare',
    '/news',
    '/leaks',
    '/reviews',
    '/about',
    '/privacy',
    '/terms-of-service',
    '/contact',
    '/faq',
    '/how-we-work',
    '/disclaimer',
    '/author/tarun',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const [phones, upcoming, news] = await Promise.all([
    safeFetch(`${BASE}/phones?limit=1000`),
    safeFetch(`${BASE}/upcoming?limit=1000`),
    safeFetch(`${BASE}/news?limit=1000`),
  ]);

  const phoneRoutes = phones.map((p) => ({
    url: `${SITE_URL}/phone/${p.externalId || p._id}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  }));

  const upcomingRoutes = upcoming.map((p) => ({
    url: `${SITE_URL}/upcoming/${p.externalId || p._id}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  }));

  const newsRoutes = news.map((n) => ({
    url: `${SITE_URL}/${n.category || 'news'}/${n.externalId || n._id}`,
    lastModified: n.updatedAt ? new Date(n.updatedAt) : new Date(),
  }));

  return [...staticRoutes, ...phoneRoutes, ...upcomingRoutes, ...newsRoutes];
}