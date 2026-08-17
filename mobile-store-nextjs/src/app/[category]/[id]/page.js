import { notFound } from 'next/navigation';
import NewsDetail from '../../components/NewsDetail';

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

async function getArticle(id) {
  try {
    const res = await fetch(`${BASE}/news/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.message === 'Not found' || Object.keys(data).length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { category, id } = await params;
  const article = await getArticle(id);

  if (!article) {
    return {
      title: 'Article Not Found | Handsetnews',
      description: 'Explore smartphones, reviews, news, and detailed comparisons on Handsetnews.',
    };
  }

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
    alternates: { canonical },
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
}

export default async function Page({ params }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  return <NewsDetail initialArticle={article} />;
}