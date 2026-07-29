'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '../api/client';
import SEO from '../components/SEO';
import './News.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

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
          <div style={{ position: 'relative', width: '100%', height: 400 }}>
            <Image
              src={article.image}
              alt={article.imageAltText || article.title}
              fill
              style={{ objectFit: 'cover', borderRadius: '16px' }}
              className="news-detail-img"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
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
                  <p className="news-content">{getContentPreview(newsItem.content)}...</p>
                  <button
                    className="read-more-btn"
                    onClick={() => router.push(`/${category}/${getNewsKey(newsItem)}`)}>
                    Read More
                  </button>
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