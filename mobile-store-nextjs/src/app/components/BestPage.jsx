'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addPhone, removePhone } from '../store/compareSlice';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api from '../api/client';
import FilterSidebar from '../components/FilterSidebar';
import './FindPage.css';

export default function BestPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { brands, price } = useSelector((state) => state.filters);
  const selectedCompare = useSelector((state) => state.compare.selected || []);

  const [topPhones, setTopPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('best');
  const sentinelRef = useRef(null);

  const sortedPhones = useMemo(() => {
    const list = [...(topPhones || [])];
    switch (sortBy) {
      case 'priceLow':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'priceHigh':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'latest':
        return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'best':
      default:
        return list;
    }
  }, [topPhones, sortBy]);

  const fetchBestPhones = useCallback(
    async (pageToLoad = 1) => {
      if (pageToLoad === 1) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        minPrice: price[0],
        maxPrice: price[1],
        limit: 20,
        page: pageToLoad,
      });

      brands.forEach((b) => params.append('brand', b));

      try {
        const res = await api.get(`/phones/best?${params.toString()}`);
        const items = Array.isArray(res) ? res : res.results || [];
        setTopPhones((current) => (pageToLoad === 1 ? items : [...current, ...items]));
        const total = typeof res.total === 'number' ? res.total : undefined;
        const nextHasMore =
          typeof total === 'number' ? pageToLoad * 20 < total : items.length === 20;
        setHasMore(nextHasMore);
        setPage(pageToLoad);
      } catch (err) {
        console.error('Failed to fetch best phones', err);
        if (pageToLoad === 1) setTopPhones([]);
        setHasMore(false);
      } finally {
        if (pageToLoad === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [brands, price],
  );

  useEffect(() => {
    setPage(1);
    setTopPhones([]);
    setHasMore(true);
    fetchBestPhones(1);
  }, [fetchBestPhones]);

  const loadMoreBestPhones = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchBestPhones(page + 1);
  }, [fetchBestPhones, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreBestPhones();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreBestPhones, loading, loadingMore, hasMore]);

  return (
    <div className="fp-page">
      <div className="fp-container">
        <FilterSidebar />

        <section className="fp-results">
          <div className="fp-results-header">
            <div className="fp-results-header-left">
              <h2 className="fp-results-title">Top Phones</h2>
              <span className="fp-results-count">
                {loading ? '—' : `${sortedPhones.length} devices found`}
              </span>
            </div>
            <div className="fp-sort-wrap">
              <span className="fp-sort-label">Sort by</span>
              <select
                className="fp-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}>
                <option value="best">Best</option>
                <option value="latest">Latest</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="fp-state">
              <div className="fp-spinner" />
              <p>Finding the best phones for you…</p>
            </div>
          ) : sortedPhones.length === 0 ? (
            <div className="fp-state">
              <div className="fp-state-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <p className="fp-state-title">No phones found</p>
              <p className="fp-state-sub">Try adjusting your filters or price range</p>
            </div>
          ) : (
            <div className="fp-list">
              {sortedPhones.map((phone, rankIndex) => {
                const phoneId = phone.externalId || phone._id;
                const isSelected = selectedCompare.some((p) => p.id === phoneId);

                const specs = phone.specs || {};
                const performance = specs.Performance || {};
                const storage = specs.Storage || {};
                const rearCamera = specs.RearCamera || {};
                const frontCamera = specs.FrontCamera || {};
                const battery = specs.Battery || {};
                const display = specs.Display || {};

                const keySpecs = [
                  { label: 'Processor', value: performance.Chipset },
                  {
                    label: 'RAM & Storage',
                    value:
                      performance.RAM && storage.InternalStorage
                        ? `${performance.RAM} / ${storage.InternalStorage}`
                        : performance.RAM || storage.InternalStorage,
                  },
                  { label: 'Rear Camera', value: rearCamera.Camera?.Primary },
                  { label: 'Front Camera', value: frontCamera.Camera },
                  {
                    label: 'Battery',
                    value: battery.Capacity
                      ? `${battery.Capacity}${battery.QuickCharging ? ` · ${battery.QuickCharging}` : ''}`
                      : null,
                  },
                  {
                    label: 'Display',
                    value: display.Size
                      ? `${display.Size}${display.Type ? ` · ${display.Type}` : ''}`
                      : null,
                  },
                ].filter((s) => s.value);

                return (
                  <div key={phoneId} className="fp-card">
                    {/* {rankIndex < 3 && (
                      <div className={`fp-rank-badge fp-rank-badge--${rankIndex + 1}`}>
                        #{rankIndex + 1}
                      </div>
                    )} */}

                    <button
                      className={`fp-compare-btn ${isSelected ? 'fp-compare-btn--active' : ''}`}
                      onClick={() =>
                        isSelected
                          ? dispatch(removePhone(phoneId))
                          : dispatch(
                              addPhone({
                                id: phoneId,
                                name: phone.name,
                                image: phone.image,
                                price: phone.price,
                              }),
                            )
                      }>
                      {isSelected ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Added
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Compare
                        </>
                      )}
                    </button>

                    <div className="fp-card-img-wrap" style={{ position: 'relative' }}>
                      <Image
                        src={phone.image}
                        alt={phone.name}
                        fill
                        className="fp-card-img"
                        style={{ objectFit: 'contain' }}
                        sizes="120px"
                      />
                    </div>

                    <div className="fp-card-info">
                      <p className="fp-card-brand">
                        {phone.brand ? phone.brand.charAt(0).toUpperCase() + phone.brand.slice(1) : 'Unknown'}
                      </p>
                      <h3 className="fp-card-name">{phone.name}</h3>

                      <div className="fp-spec-grid">
                        {keySpecs.map((spec) => (
                          <div key={spec.label} className="fp-spec-item">
                            <span className="fp-spec-label">{spec.label}</span>
                            <span className="fp-spec-value">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="fp-card-actions">
                      <span className="fp-price">
                        {phone.price ? `₹${Number(phone.price).toLocaleString('en-IN')}` : 'Price TBA'}
                      </span>
                      <Link href={`/phone/${phoneId}`} className="fp-view-btn">
                        View Details
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}

              {hasMore && <div className="fp-sentinel" ref={sentinelRef} />}
            </div>
          )}

          {loadingMore && (
            <div className="fp-load-more-state">
              <div className="fp-spinner fp-spinner--sm" />
              <span>Loading more phones…</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}