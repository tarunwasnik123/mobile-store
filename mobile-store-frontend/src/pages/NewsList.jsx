import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import './News.css';

export default function NewsList() {
  const navigate = useNavigate();
  const { category = 'news' } = useParams();
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Capitalize category name for display
  const getCategoryTitle = (cat) => {
    const titles = {
      news: 'News',
      leaks: 'Leaks',
      reviews: 'Reviews',
    };
    return (
      titles[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
    );
  };

  // Fetch news by category
  const fetchNewsByCategory = async (cat) => {
    try {
      setLoading(true);
      const res = await api.get(
        `/news?limit=50&category=${cat}&sort=-createdAt`,
      );
      const items = res.results || res.data || [];
      setNews(items);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all categories on mount
  useEffect(() => {
    let mounted = true;
    api
      .get('/news?limit=50&sort=-createdAt')
      .then((res) => {
        const items = res.results || res;
        if (mounted) {
          // Extract unique categories from all news
          const uniqueCategories = [
            ...new Set(items.map((n) => n.category).filter(Boolean)),
          ];
          setCategories(uniqueCategories);
        }
      })
      .catch(() => {});
    return () => (mounted = false);
  }, []);

  // Fetch news for the current category
  useEffect(() => {
    fetchNewsByCategory(category);
  }, [category]);

  return (
    <div className="page news-page news-list">
      <SEO
        title={`${getCategoryTitle(category)} | Handsetnews`}
        description={`Browse the latest ${getCategoryTitle(category).toLowerCase()} and smartphone news on Handsetnews.`}
      />
      <div className="news-header">
        <h2>{getCategoryTitle(category)}</h2>
        <div className="filter-container">
          <select
            value={category}
            onChange={(e) => navigate(`/${e.target.value}`)}
            className="category-filter">
            <option value="news">News</option>
            <option value="leaks">Leaks</option>
            <option value="reviews">Reviews</option>
            {categories
              .filter(
                (cat) =>
                  !['news', 'leaks', 'reviews'].includes(cat.toLowerCase()),
              )
              .map((cat) => (
                <option key={cat} value={cat.toLowerCase()}>
                  {getCategoryTitle(cat)}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="cards-grid">
        {loading ? (
          <p className="status-text">
            Loading {getCategoryTitle(category).toLowerCase()}...
          </p>
        ) : news.length > 0 ? (
          news.map((n) => {
            const articleId = n.externalId || n.id || n._id;
            return (
              <article key={articleId} className="news-card">
                <img src={n.image} alt={n.title} />
                <div className="news-card-content">
                  {n.category && (
                    <div className="news-card-category">
                      {n.category.charAt(0).toUpperCase() +
                        n.category.slice(1).toLowerCase()}
                    </div>
                  )}
                  <h3>{n.title}</h3>
                  <p>{n.summary}</p>
                  <Link to={`/${category}/${articleId}`} className="read-more">
                    Read more →
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <p className="no-results">
            No {getCategoryTitle(category).toLowerCase()} available
          </p>
        )}
      </div>
    </div>
  );
}
