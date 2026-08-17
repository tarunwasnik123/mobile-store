import { notFound } from 'next/navigation';
import PhoneDetail from '../../components/PhoneDetail';

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

async function getPhone(id) {
  try {
    const res = await fetch(`${BASE}/phones/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.message === 'Not found' || Object.keys(data).length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const phone = await getPhone(id);

  if (!phone) {
    return {
      title: 'Phone Not Found | Handsetnews',
      description: 'View full phone specifications, pricing, and related smartphone reviews.',
    };
  }

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
    alternates: { canonical },
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
}

export default async function Page({ params }) {
  const { id } = await params;
  const phone = await getPhone(id);

  if (!phone) {
    notFound();
  }

  return <PhoneDetail initialPhone={phone} />;
}