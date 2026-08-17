'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '../api/client';
import SEO from '../components/SEO';
import './News.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

const getUrlKey = (item) =>
  item?.externalId || item?.slug || item?.urlSlug || item?.friendlyUrl || item?._id || item?.id;

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
      <div className="stars-inner" style={{ width: percentage + '%' }} />
    </div>
  );
};

export default function NewsDetail({ initialArticle = null }) {
  const params = useParams();
  const id = params?.id;
  const category = params?.category || 'news';
  const router = useRouter();
  const [article, setArticle] = useState(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);
  const [error, setError] = useState(null);
  const [news, setNews] = useState([]);
  const [newsError, setNewsError] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const articleMetaTitle = article?.metaTitle || (article?.title + ' | Handsetnews');

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
    if (initialArticle) return; // server se already mil chuka, dobara fetch mat kar
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .get('/news/' + id)
      .then((res) => {
        if (mounted) setArticle(res);
      })
      .catch((err) => mounted && setError(err.message || 'Failed to load article'))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [id, initialArticle]);

  useEffect(() => {
    let mounted = true;
    const fetchNews = async () => {
      try {
        setNewsError(null);
        const query = '?sort=-createdAt&limit=20&category=' + category;
        const res = await api.get('/news' + query);
        const list = res?.results || res?.data || [];
        if (mounted) setNews(list);
      } catch (err) {
        if (mounted) setNewsError(err.message || 'Failed to load latest news');
      }
    };

    fetchNews();
    return () => (mounted = false);
  }, [category]);

  if (loading) {
    return (
      <div className="page news-page">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page news-page">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="page news-page">
        <h2>Article not found</h2>
      </div>
    );
  }

  const articleId = article.externalId || article._id;
  const pageUrl = article.canonicalUrl || (SITE_URL + '/' + category + '/' + articleId);

  const encodedUrl = encodeURIComponent(pageUrl);
  const shareText = encodeURIComponent(article?.title || '');
  const linkedinUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl;
  const facebookUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
  const twitterUrl = 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + shareText;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ratingValue =
    article.rating !== undefined && article.rating !== null && article.rating !== ''
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
      url: SITE_URL + '/author/tarun',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Handset News',
      logo: {
        '@type': 'ImageObject',
        url: SITE_URL + '/HandsetLogo.svg',
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
        {/* <Link href={'/' + category} className="back-link">
          Back to News
        </Link> */}
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

          <div className="news-share-icons">
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-icon share-linkedin"
              aria-label="Share on LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.44-2.14 2.94v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z" />
              </svg>
            </a>

            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-icon share-facebook"
              aria-label="Share on Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
              </svg>
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-icon share-x"
              aria-label="Share on X"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M18.9 2H22l-7.6 8.7L23 22h-6.6l-5.2-6.8L5 22H1.9l8.1-9.3L1 2h6.7l4.7 6.2L18.9 2zm-2.3 18h1.8L7.5 4H5.6l11 16z" />
              </svg>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="share-icon share-copy"
              aria-label="Copy link"
            >
              {copied ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
                  <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
                </svg>
              )}
            </button>
          </div>
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
                  <Link href={'/' + category + '/' + getUrlKey(newsItem)} className="read-more-btn">
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