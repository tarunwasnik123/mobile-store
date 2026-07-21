'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Image from 'next/image';
import { setPrice } from '../store/filterSlice';
import api from '../api/client';
import SEO from './SEO';
import './HomePage.css';

const HomePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [phones, setPhones] = useState([]);
  const [upcomingPhones, setUpcomingPhones] = useState([]);
  const [news, setNews] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [priceRange, setPriceRange] = useState([0, 200000]);

  const handleMinChange = (e) => {
    const min = Number(e.target.value) || 0;
    setPriceRange([min, Math.max(min, priceRange[1])]);
  };

  const handleMaxChange = (e) => {
    const max = Number(e.target.value) || 200000;
    setPriceRange([Math.min(priceRange[0], max), max]);
  };
  const [loading, setLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  const formatCurrency = (value) =>
  typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : '';

  const stripHTML = (html) => {
    if (typeof document === 'undefined') return html || '';
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  };

  const getContentPreview = (content) =>
    stripHTML(content).replace(/\s+/g, ' ').trim().substring(0, 120);

  const getCachedData = (key) => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const ttl = 5 * 60 * 1000;
      if (now - timestamp < ttl) {
        return data;
      }
    }
    return null;
  };

  const setCachedData = (key, data) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  };

  const fetchPhones = useCallback(async () => {
    const cached = getCachedData('phones');
    if (cached) {
      setPhones(cached);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/phones?limit=10&sort=-createdAt');
      const data = res.results || res.data || [];
      setPhones(data);
      setCachedData('phones', data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUpcomingPhones = useCallback(async () => {
    const cached = getCachedData('upcomingPhones');
    if (cached) {
      setUpcomingPhones(cached);
      setUpcomingLoading(false);
      return;
    }
    try {
      setUpcomingLoading(true);
      const res = await api.get('/upcoming?limit=10&sort=-createdAt');
      const data = res.results || res.data || [];
      setUpcomingPhones(data);
      setCachedData('upcomingPhones', data);
    } catch (err) {
      console.error(err);
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  const fetchNewsCategory = useCallback(async (category, setter, cacheKey) => {
    const cached = getCachedData(cacheKey);
    if (cached) {
      setter(cached);
      return;
    }
    try {
      const res = await api.get(`/news?limit=4&category=${category}&sort=-createdAt`);
      const data = res.results || res.data || [];
      setter(data);
      setCachedData(cacheKey, data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchPhones(),
        fetchUpcomingPhones(),
        fetchNewsCategory('news', setNews, 'news'),
        fetchNewsCategory('reviews', setReviews, 'reviews'),
      ]);
    };
    loadData();
  }, [fetchPhones, fetchUpcomingPhones, fetchNewsCategory]);

  const handleQuickPrice = (maxPrice) => setPriceRange([priceRange[0], maxPrice]);

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    const min = 0;
    const max = 200000;
    const percent = ((val - min) / (max - min)) * 100;
    e.target.style.background = `linear-gradient(to right, #ff6f00 0%, #ff6f00 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`;
    setPriceRange([priceRange[0], val]);
  };

  useEffect(() => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      const val = priceRange[1];
      const percent = (val / 200000) * 100;
      slider.style.background = `linear-gradient(to right, #ff6f00 0%, #ff6f00 ${percent}%, #e5e7eb ${percent}%, #e5e7eb 100%)`;
    }
  }, [priceRange[1]]);

  const handleFindMobiles = () => {
    dispatch(setPrice([priceRange[0], priceRange[1]]));
    const query = `?minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`;
    router.push(`/find${query}`);
  };

  const PhoneCard = ({ phone, upcoming }) => {
    const phoneId = phone.externalId || phone._id || phone.id;

    return (
      <div
        className="phone-carousel-card"
        onClick={() => router.push(upcoming ? `/upcoming/${phoneId}` : `/phone/${phoneId}`)}>
        <div className="phone-img-wrapper" style={{ position: 'relative' }}>
          <Image
            src={phone.image}
            alt={phone.name}
            fill
            style={{ objectFit: 'contain' }}
            sizes="190px"
          />
        </div>
        <h3 className="phone-name">{phone.name}</h3>
        {phone.price && <p className="phone-price">{formatCurrency(phone.price)}</p>}
      </div>
    );
  };

  const PhonesRow = ({ title, items, upcoming, viewAllLink }) => (
    <section className="phones-row-section">
      <div className="section-header">
        <h2>{title}</h2>
        <button className="view-all-btn" onClick={() => router.push(viewAllLink)}>
          View All →
        </button>
      </div>

      <div className="phones-carousel">
        {items.map((phone) => (
          <PhoneCard key={phone._id || phone.id} phone={phone} upcoming={upcoming} />
        ))}
      </div>
    </section>
  );

  const ArticleSection = ({ title, items, viewAllLink }) => {
    if (!items.length) return null;
    const [featured, ...others] = items;

    return (
      <section className="article-section">
        <div className="section-header">
          <h2>{title}</h2>
          <button className="view-all-btn" onClick={() => router.push(viewAllLink)}>
            View All →
          </button>
        </div>

        <div className="article-grid">
          <div
            className="featured-article"
            onClick={() => router.push(`${viewAllLink}/${featured._id || featured.id}`)}
            style={{ position: 'relative' }}>
            <Image
              src={featured.image}
              alt={featured.title}
              fill
              style={{ objectFit: 'cover', borderRadius: '14px' }}
              sizes="(max-width: 768px) 100vw, 60vw"
            />
            <div className="featured-content">
              <p className="article-date">
                {new Date(featured.createdAt).toLocaleDateString()}
              </p>
              <h3>{featured.title}</h3>
              <p>{getContentPreview(featured.content)}...</p>
            </div>
          </div>

          <div className="side-articles">
            {others.slice(0, 3).map((item) => (
              <div
                key={item._id || item.id}
                className="side-article"
                onClick={() => router.push(`${viewAllLink}/${item._id || item.id}`)}>
                <div
                  style={{
                    position: 'relative',
                    width: 90,
                    height: 68,
                    flexShrink: 0,
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                  <Image src={item.image} alt={item.title} fill style={{ objectFit: 'cover' }} sizes="90px" />
                </div>
                <div>
                  <p className="article-date">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <h4>{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="home-page">
      <SEO
        title="Mobile Store | Find Phones, News & Comparisons"
        description="Search and compare smartphones, read the latest news, and explore upcoming releases on Mobile Store."
      />
      <section className="top-filter-section">
        <h1>Find Your Perfect Phone!</h1>

        <div className="filter-card">
          <div className="price-inputs">
            <div className="price-input-group">
              <label htmlFor="min-price">Min Price (₹)</label>
              <input
                id="min-price"
                type="number"
                value={priceRange[0] || ''}
                onChange={handleMinChange}
                min="0"
                max="200000"
                step="1000"
              />
            </div>
            <div className="price-input-group">
              <label htmlFor="max-price">Max Price (₹)</label>
              <input
                id="max-price"
                type="number"
                value={priceRange[1]}
                onChange={handleMaxChange}
                min="0"
                max="200000"
                step="1000"
              />
            </div>
          </div>

          <div className="price-display">
            <span>₹{priceRange[0].toLocaleString('en-IN')}</span>
            <span>to</span>
            <span>₹{priceRange[1].toLocaleString('en-IN')}+</span>
          </div>

          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={priceRange[1]}
            onChange={handleSliderChange}
          />

          <div className="quick-price-buttons">
            {[10000, 20000, 30000, 50000].map((price) => (
              <button
                key={price}
                className={priceRange[1] === price ? 'active' : ''}
                onClick={() => handleQuickPrice(price)}>
                ₹{price.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <button className="find-btn" onClick={handleFindMobiles}>
            Find Mobiles
          </button>
        </div>
      </section>

      {loading ? (
        <p className="status-text">Loading phones...</p>
      ) : (
        <PhonesRow title="Latest Phones" items={phones} viewAllLink="/find" />
      )}

      {upcomingLoading ? (
        <p className="status-text">Loading upcoming phones...</p>
      ) : (
        <PhonesRow
          title="Upcoming Mobiles"
          items={upcomingPhones}
          upcoming
          viewAllLink="/upcoming"
        />
      )}

      <ArticleSection title="Latest News" items={news} viewAllLink="/news" />
      <ArticleSection title="Latest Reviews" items={reviews} viewAllLink="/reviews" />
    </div>
  );
};

export default HomePage;