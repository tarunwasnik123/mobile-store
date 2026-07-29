import PhoneDetail from '../../components/PhoneDetail';

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetch(`${BASE}/phones/${id}`, { cache: 'no-store' });
    const phone = await res.json();

    const title = phone?.metaTitle || `${phone?.name || 'Phone'} | Handsetnews`;
    const description =
      phone?.metaDescription ||
      `View full specifications, pricing, and reviews for ${phone?.name || 'this phone'}.`;
    const canonical = phone?.canonicalUrl || `${SITE_URL}/phone/${id}`;
    const image = phone?.ogImage || phone?.image;
    const twitterImage = phone?.twitterImage || phone?.image;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        images: image ? [{ url: image, alt: phone?.imageAltText || phone?.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: twitterImage ? [twitterImage] : [],
      },
    };
  } catch {
    return {
      title: 'Phone Details | Handsetnews',
      description: 'View full phone specifications, pricing, and related smartphone reviews.',
    };
  }
}

export default function Page() {
  return <PhoneDetail />;
}