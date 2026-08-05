'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '../api/client';
import SEO from '../components/SEO';
import './News.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

// Helper: pick the best available "slug or id" field for building a clean URL.
// The API returns the human-readable slug in `externalId`, so that takes priority.
const getUrlKey = (item) =>
  item?.externalId || item?.slug || item?.urlSlug || item?.friendlyUrl || item?._id || item?.id;

// 👇 NEW - Rating helpers
const getRatingText = (rating) => {
  if (rating >= 9) return 'Excellent';
  if (rating >= 7.5) return 'Very Good';
  if (rating >= 6) return 'Good';
  if (rating >= 4) return 'Average';
  return 'Poor';
};

const StarRating = ({ rating }) => {
  const percentage = Math.max(0, Math.min(100, (rating / 10) * 100));
  return (
    <div className="stars-outer">
      <div className="stars-inner" style={{ width: `${percentage}%` }} />
    </div>
  );
};

export default function NewsDetail() {
  const params = useParams();
  const id = params?.id;
  const category = params?.category || 'news';
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [news, setNews] = useState([]);
  const [newsError, setNewsError] = useState(null);

  const getNewsKey = (item) => String(item?.externalId || item?._id || item?.id || '').trim();

  const stripHTML = (html) => {
    if (typeof document === 'undefined') return html || '';
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  };

  const getContentPreview = (content) => {
    const plainText = stripHTML(content);
    return plainText.replace(/\s+/g, ' ').trim().substring(0, 80);
  };

  const articleMetaDescription =
    article?.metaDescription ||
    article?.summary ||
    getContentPreview(article?.content) ||
    'Read this article for the latest smartphone news, reviews, and updates.';

  const articleMetaTitle = article?.metaTitle || `${article?.title} | Handsetnews`;

  const currentKeys = new Set(
    [id, article?.externalId, article?._id, article?.id].filter(Boolean).map((v) => String(v).trim()),
  );

  const sidebarNews = news.filter((newsItem) => {
    const key = getNewsKey(newsItem);
    if (key && currentKeys.has(key)) return false;
    if (article?.title && newsItem?.title === article.title) return false;
    return true;
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .get(`/news/${id}`)
      .then((res) => {
        if (mounted) setArticle(res);
      })
      .catch((err) => mounted && setError(err.message || 'Failed to load article'))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const fetchNews = async () => {
      try {
        setNewsError(null);
        const query = `?sort=-createdAt&limit=20&category=${category}`;
        const res = await api.get(`/news${query}`);
        const list = res?.results || res?.data || [];
        if (mounted) setNews(list);
      } catch (err) {
        if (mounted) setNewsError(err.message || 'Failed to load latest news');
      }
    };

    fetchNews();
    return () => (mounted = false);
  }, [category]);

  if (loading)
    return (
      <div className="page news-page">
        <h2>Loading...</h2>
      </div>
    );

  if (error)
    return (
      <div className="page news-page">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );

  if (!article)
    return (
      <div className="page news-page">
        <h2>Article not found</h2>
      </div>
    );

  const articleId = article.externalId || article._id;
  const pageUrl = article.canonicalUrl || `${SITE_URL}/${category}/${articleId}`;

  // 👇 NEW - normalize rating, only render section if summary or rating exists
  const ratingValue = article.rating !== undefined && article.rating !== null && article.rating !== ''
    ? Number(article.rating)
    : null;
  const showSummarySection = Boolean(article.summary) || ratingValue !== null;

  const newsArticleSchema = {
    '@context': 'https://schema.org',
    '@type': article.schemaType || 'NewsArticle',
    headline: article.title,
    image: article.ogImage || article.image ? [article.ogImage || article.image] : undefined,
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
    author: {
      '@type': 'Person',
      name: 'Tarun Wasnik',
      url: `${SITE_URL}/author/tarun`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Handset News',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/HandsetLogo.svg`,
      },
    },
    description: articleMetaDescription,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };

  return (
    <div className="page news-page news-detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      <SEO title={articleMetaTitle} description={articleMetaDescription} keywords={article?.metaName} />
      <main className="news-main-wrapper">
        <Link href={`/${category}`} className="back-link">
          Back to News
        </Link>
        <h1 className="news-detail-title">{article.title}</h1>
        {article.category && (
          <div className="news-category-badge">
            {article.category.charAt(0).toUpperCase() + article.category.slice(1).toLowerCase()}
          </div>
        )}
        <div className="news-metadata">
          <span className="posted-by">
            Posted by{' '}
            <Link href="/author/tarun" className="author-link">
              Tarun wasnik
            </Link>
          </span>
          <span className="posted-on">
            Posted on{' '}
            {article.createdAt
              ? new Date(article.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A'}{' '}
            IST
          </span>
        </div>
        {article.image && (
        <div className="news-detail-img-wrapper">
        <Image
          src={article.image}
          alt={article.imageAltText || article.title}
          fill
          style={{ objectFit: 'contain' }}
          className="news-detail-img"
          sizes="(max-width: 768px) 100vw, 1200px"
          priority
        />
        </div>
       )}

        {/* 👇 NEW - Summary + Rating section (from admin panel) */}
        {showSummarySection && (
          <div className="news-summary-rating-wrapper">
            {article.summary && (
              <div className="news-summary-box">
                <div className="summary-header">
                  <span className="summary-icon" aria-hidden="true">📝</span>
                  <h3>Summary</h3>
                </div>
                <p className="summary-text">{article.summary}</p>
              </div>
            )}

            {ratingValue !== null && (
              <div className="news-rating-box">
                <h3 className="rating-title">
                  HANDSET<span className="rating-title-accent">NEWS</span> RATING
                </h3>
                <div className="rating-score">
                  <span className="rating-number">{ratingValue.toFixed(1)}</span>
                  <span className="rating-outof">/10</span>
                </div>
                <StarRating rating={ratingValue} />
                <div className="rating-text">{getRatingText(ratingValue)}</div>
              </div>
            )}
          </div>
        )}

        <div className="news-detail-content">
          <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
        </div>
      </main>

      <aside className="news-sidebar-wrapper">
        <div className="news-sidebar-inner">
          <div className="news-header">
            <h2>Related Articles</h2>
          </div>

          {newsError && <p className="status-text error">{newsError}</p>}

          {sidebarNews.length > 0 ? (
            <div className="news-list">
              {sidebarNews.map((newsItem) => (
                <div key={getNewsKey(newsItem)} className="news-card">
                  {newsItem.image && (
                    <div style={{ position: 'relative', width: '100%', height: 140 }}>
                      <Image
                        src={newsItem.image}
                        alt={newsItem.title}
                        fill
                        style={{ objectFit: 'cover', borderRadius: '10px' }}
                        className="news-img"
                        sizes="280px"
                      />
                    </div>
                  )}
                  <h3>{newsItem.title}</h3>
                  <p className="news-date">
                    {newsItem.createdAt ? new Date(newsItem.createdAt).toLocaleDateString() : ''}
                  </p>
                  {/* <p className="news-content">{getContentPreview(newsItem.content)}...</p> */}
                  <Link
                    href={`/${category}/${getUrlKey(newsItem)}`}
                    className="read-more-btn">
                    Read More
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-results">No news available</p>
          )}
        </div>
      </aside>
    </div>
  );
}