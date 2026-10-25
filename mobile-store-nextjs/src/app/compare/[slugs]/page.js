import ComparisonPage from '../../components/ComparisonPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

function parseSlugs(raw) {
  let decoded = raw || '';
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}
  return decoded
    .split('-vs-')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function prettify(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }) {
  const { slugs } = await params;
  const names = parseSlugs(slugs).map(prettify);

  const title = names.length
    ? `${names.join(' vs ')} - Comparison | Handsetnews`
    : 'Compare Devices | Handsetnews';
  const description = names.length
    ? `Compare ${names.join(' vs ')} side by side: specs, price, display, camera, battery and more.`
    : 'Compare mobile phones side by side on Handsetnews.';

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/compare/${slugs}` },
  };
}

export default async function Page({ params }) {
  const { slugs } = await params;
  return <ComparisonPage initialSlugs={parseSlugs(slugs)} />;
}