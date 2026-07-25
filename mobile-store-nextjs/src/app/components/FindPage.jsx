'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addPhone, removePhone } from '../store/compareSlice';
import { setPrice, setBrands } from '../store/filterSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import api from '../api/client';
import FilterSidebar from '../components/FilterSidebar';
import './FindPage.css';

export default function FindPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { brands, price } = useSelector((state) => state.filters);
  const selectedCompare = useSelector((state) => state.compare.selected || []);

  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const sentinelRef = useRef(null);

  useEffect(() => {
    const minPrice = parseInt(searchParams.get('minPrice')) || 0;
    const maxPrice = parseInt(searchParams.get('maxPrice')) || 200000;
    const brandParam = searchParams.get('brand');
    const brandsArray = brandParam
      ? brandParam.split(',').map((b) => b.trim()).filter(Boolean)
      : [];
    dispatch(setPrice([minPrice, maxPrice]));
    dispatch(setBrands(brandsArray));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (price[0] > 0) params.set('minPrice', price[0].toString());
    if (price[1] < 200000) params.set('maxPrice', price[1].toString());
    if (brands.length > 0) params.set('brand', brands.join(','));
    const newSearch = params.toString();
    const currentSearch = window.location.search.slice(1);
    if (newSearch !== currentSearch) {
      router.replace(`/find?${newSearch}`);
    }
  }, [price, brands, router]);

  const fetchPhones = useCallback(
    async (pageToLoad = 1) => {
      if (pageToLoad === 1) {
        setLoading(true);
        setHasMore(true);
      } else setLoadingMore(true);

      const params = new URLSearchParams({
        minPrice: price[0],
        maxPrice: price[1],
        limit: 20,
        page: pageToLoad,
      });
      brands.forEach((b) => params.append('brand', b));

      try {
        const res = await api.get(`/phones?${params.toString()}`);
        const items = res.results || res.data || [];
        setPhones((current) => (pageToLoad === 1 ? items : [...current, ...items]));
        const total = typeof res.total === 'number' ? res.total : undefined;
        const nextHasMore =
          typeof total === 'number' ? pageToLoad * 20 < total : items.length === 20;
        setHasMore(nextHasMore);
        setPage(pageToLoad);
      } catch (err) {
        console.error('Failed to fetch phones', err);
        if (pageToLoad === 1) setPhones([]);
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
    setPhones([]);
    setHasMore(true);
    fetchPhones(1);
  }, [fetchPhones]);

  const loadMorePhones = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPhones(page + 1);
  }, [fetchPhones, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMorePhones();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMorePhones, loading, loadingMore, hasMore]);

  const sortedPhones = useMemo(() => {
    const list = [...phones];
    switch (sortBy) {
      case 'priceLow':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'priceHigh':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      default:
        return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }, [phones, sortBy]);

  return (
    <div className="fp-page">
      <div className="fp-container">
        <FilterSidebar />

        <section className="fp-results">
          <div className="fp-results-header">
            <div className="fp-results-header-left">
              <h2 className="fp-results-title">Phone Finder</h2>
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
              {sortedPhones.map((phone) => {
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

                    <div className="fp-card-img-wrap" onClick={() => router.push(`/phone/${phoneId}`)} style={{ position: 'relative', cursor: 'pointer' }}>
                      <Image
                        src={phone.image}
                        alt={phone.name}
                        fill
                        className="fp-card-img"
                        style={{ objectFit: 'contain' }}
                        sizes="120px"
                      />
                    </div>

                    <div className="fp-card-info" onClick={() => router.push(`/phone/${phoneId}`)} style={{ cursor: 'pointer' }}>
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
                      <button className="fp-view-btn" onClick={() => router.push(`/phone/${phoneId}`)}>
                        View Details
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
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