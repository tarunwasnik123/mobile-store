import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import SEO from '../components/SEO';
import './News.css';

export default function NewsDetail() {
  const { id, category = 'news' } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [news, setNews] = useState([]);
  const [newsError, setNewsError] = useState(null);

  const getNewsKey = (item) =>
    String(item?.externalId || item?._id || item?.id || '').trim();

  // Helper to extract plain text from HTML content
  const stripHTML = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  };

  const getContentPreview = (content) => {
    const plainText = stripHTML(content);
    return plainText
      .replace(/\s+/g, ' ') // collapse multiple spaces
      .trim()
      .substring(0, 80);
  };

  const articleMetaDescription =
    article?.metaDescription ||
    article?.summary ||
    getContentPreview(article?.content) ||
    'Read this article for the latest smartphone news, reviews, and updates.';

  const articleMetaTitle =
    article?.metaTitle || `${article?.title} | Mobile Store`;

  const currentKeys = new Set(
    [id, article?.externalId, article?._id, article?.id]
      .filter(Boolean)
      .map((v) => String(v).trim()),
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
      .catch(
        (err) => mounted && setError(err.message || 'Failed to load article'),
      )
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

  return (
    <div className="page news-page news-detail">
      <SEO
        title={articleMetaTitle}
        description={articleMetaDescription}
        keywords={article?.metaName}
      />
      <main className="news-main-wrapper">
        <Link to={`/${category}`} className="back-link">
          Back to News
        </Link>
        <h1 className="news-detail-title">{article.title}</h1>
        {article.category && (
          <div className="news-category-badge">
            {article.category.charAt(0).toUpperCase() +
              article.category.slice(1).toLowerCase()}
          </div>
        )}
        <div className="news-metadata">
          <span className="posted-by">
            Posted by{' '}
            <Link to="/author/tarun" className="author-link">
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
          <img
            src={article.image}
            alt={article.title}
            className="news-detail-img"
          />
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
                    <img
                      src={newsItem.image}
                      alt={newsItem.title}
                      className="news-img"
                    />
                  )}
                  <h3>{newsItem.title}</h3>
                  <p className="news-date">
                    {newsItem.createdAt
                      ? new Date(newsItem.createdAt).toLocaleDateString()
                      : ''}
                  </p>
                  <p className="news-content">
                    {getContentPreview(newsItem.content)}
                    ...
                  </p>
                  <button
                    className="read-more-btn"
                    onClick={() =>
                      navigate(`/${category}/${getNewsKey(newsItem)}`)
                    }>
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
