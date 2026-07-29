import NewsList from '../components/NewsList';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

const categoryLabels = {
  news: 'News',
  leaks: 'Leaks',
  reviews: 'Reviews',
};

export async function generateMetadata({ params }) {
  const { category } = await params;
  const title = categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${title} | Handsetnews`,
    description: `Browse the latest ${title.toLowerCase()} and smartphone news on Handsetnews.`,
    alternates: {
      canonical: `${SITE_URL}/${category}`,
    },
  };
}

export default function Page() {
  return <NewsList />;
}