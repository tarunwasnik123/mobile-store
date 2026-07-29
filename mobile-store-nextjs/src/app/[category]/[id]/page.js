import NewsDetail from '../../components/NewsDetail';

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

export async function generateMetadata({ params }) {
  const { category, id } = await params;
  try {
    const res = await fetch(`${BASE}/news/${id}`, { cache: 'no-store' });
    const article = await res.json();

    const title = article?.metaTitle || `${article?.title || 'Article'} | Handsetnews`;
    const description =
      article?.metaDescription ||
      article?.summary ||
      'Read this article for the latest smartphone news, reviews, and updates.';
    const canonical = article?.canonicalUrl || `${SITE_URL}/${category}/${id}`;
    const image = article?.ogImage || article?.image;
    const twitterImage = article?.twitterImage || article?.image;

    return {
      title,
      description,
      keywords: article?.metaName,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        images: image ? [{ url: image, alt: article?.imageAltText || article?.title }] : [],
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
      title: 'Article | Handsetnews',
      description: 'Explore smartphones, reviews, news, and detailed comparisons on Handsetnews.',
    };
  }
}

export default function Page() {
  return <NewsDetail />;
}