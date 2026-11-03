import { notFound } from 'next/navigation';
import NewsDetail from '../../components/NewsDetail';

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

// Editor (BlockNote/Tiptap) links me rel="noopener noreferrer nofollow" daal deta hai.
// Sirf <a> tags ke rel se "nofollow" hatate hain, noopener/noreferrer rehte hain.
const removeNofollow = (html) =>
  String(html || '').replace(/<a\b[^>]*>/gi, (tag) =>
    tag.replace(/\brel\s*=\s*(["'])(.*?)\1/i, (match, quote, value) => {
      const cleaned = value
        .split(/\s+/)
        .filter((token) => token && token.toLowerCase() !== 'nofollow')
        .join(' ');
      return cleaned ? `rel=${quote}${cleaned}${quote}` : '';
    }),
  );

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

  // Content se nofollow yahin hata dete hain, taaki page ke raw data me bhi na rahe
  const cleanArticle = { ...article, content: removeNofollow(article.content) };

  return <NewsDetail initialArticle={cleanArticle} />;
}