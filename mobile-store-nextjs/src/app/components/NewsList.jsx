'use client';

import { useEffect, useState } from 'react';
import api from '../api/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import SEO from '../components/SEO';
import './News.css';

export default function NewsList() {
  const router = useRouter();
  const params = useParams();
  const category = params?.category || 'news';
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCategoryTitle = (cat) => {
    const titles = {
      news: 'News',
      leaks: 'Leaks',
      reviews: 'Reviews',
    };
    return titles[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  const fetchNewsByCategory = async (cat) => {
    try {
      setLoading(true);
      const res = await api.get(`/news?limit=50&category=${cat}&sort=-createdAt`);
      const items = res.results || res.data || [];
      setNews(items);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    api
      .get('/news?limit=50&sort=-createdAt')
      .then((res) => {
        const items = res.results || res;
        if (mounted) {
          const uniqueCategories = [...new Set(items.map((n) => n.category).filter(Boolean))];
          setCategories(uniqueCategories);
        }
      })
      .catch(() => {});
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    fetchNewsByCategory(category);
  }, [category]);

  return (
    <div className="page news-page news-list">
      <SEO
        title={`${getCategoryTitle(category)} | Mobile Store`}
        description={`Browse the latest ${getCategoryTitle(category).toLowerCase()} and smartphone news on Mobile Store.`}
      />
      <div className="news-header">
        <h2>{getCategoryTitle(category)}</h2>
        <div className="filter-container">
          <select
            value={category}
            onChange={(e) => router.push(`/${e.target.value}`)}
            className="category-filter">
            <option value="news">News</option>
            <option value="leaks">Leaks</option>
            <option value="reviews">Reviews</option>
            {categories
              .filter((cat) => !['news', 'leaks', 'reviews'].includes(cat.toLowerCase()))
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
          <p className="status-text">Loading {getCategoryTitle(category).toLowerCase()}...</p>
        ) : news.length > 0 ? (
          news.map((n) => {
            const articleId = n.externalId || n.id || n._id;
            return (
              <article key={articleId} className="news-card">
                <div style={{ position: 'relative', width: '100%', height: 220 }}>
                  <Image
                    src={n.image}
                    alt={n.imageAltText || n.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
                <div className="news-card-content">
                  {n.category && (
                    <div className="news-card-category">
                      {n.category.charAt(0).toUpperCase() + n.category.slice(1).toLowerCase()}
                    </div>
                  )}
                  <h3>{n.title}</h3>
                  <p>{n.summary}</p>
                  <Link href={`/${category}/${articleId}`} className="read-more">
                    Read more →
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <p className="no-results">No {getCategoryTitle(category).toLowerCase()} available</p>
        )}
      </div>
    </div>
  );
}