import HomePage from './components/HomePage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

export const metadata = {
  alternates: {
    canonical: SITE_URL,
  },
};

export default function Page() {
  return <HomePage />;
}