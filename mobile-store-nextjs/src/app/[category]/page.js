import NewsList from '../components/NewsList';

const categoryLabels = {
  news: 'News',
  leaks: 'Leaks',
  reviews: 'Reviews',
};

export async function generateMetadata({ params }) {
  const { category } = await params;
  const title = categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${title} | Mobile Store`,
    description: `Browse the latest ${title.toLowerCase()} and smartphone news on Mobile Store.`,
  };
}

export default function Page() {
  return <NewsList />;
}