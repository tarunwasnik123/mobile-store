import UpcomingPhoneDetail from '../../components/UpcomingPhoneDetail';

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetch(`${BASE}/upcoming/${id}`, { cache: 'no-store' });
    const phone = await res.json();
    return {
      title: phone?.metaTitle || `${phone?.name || 'Upcoming Phone'} | Handsetnews`,
      description:
        phone?.metaDescription ||
        `View expected specifications, pricing, and launch details for ${phone?.name || 'this upcoming phone'}.`,
      alternates: {
        canonical: phone?.canonicalUrl || `${SITE_URL}/upcoming/${id}`,
      },
    };
  } catch {
    return {
      title: 'Upcoming Phone Details | Handsetnews',
      description: 'Learn more about upcoming smartphone launches, specs, and expected release dates.',
    };
  }
}

export default function Page() {
  return <UpcomingPhoneDetail />;
}