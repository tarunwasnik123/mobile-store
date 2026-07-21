'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addPhone, removePhone } from '../store/compareSlice';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '../api/client';
import FilterSidebar from '../components/FilterSidebar';
import './FindPage.css';

function parseReleaseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (!isNaN(date)) return date;

  const parts = value.split(' ');
  if (parts.length === 2) {
    return new Date(`${parts[0]} 1, ${parts[1]}`);
  }

  return null;
}

export default function LatestPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { brands, price } = useSelector((state) => state.filters);
  const selectedCompare = useSelector((state) => state.compare.selected || []);

  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const sentinelRef = useRef(null);

  const fetchLatestPhones = useCallback(
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
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        params.append('minReleaseDate', threeMonthsAgo.toISOString().split('T')[0]);
        params.append('maxReleaseDate', today.toISOString().split('T')[0]);
        params.append('sort', '-specs.General.LaunchDate');

        const res = await api.get(`/phones?${params.toString()}`);
        const items = Array.isArray(res) ? res : Array.isArray(res?.results) ? res.results : [];

        setPhones((current) => (pageToLoad === 1 ? items : [...current, ...items]));

        const total = typeof res.total === 'number' ? res.total : undefined;
        const nextHasMore =
          typeof total === 'number' ? pageToLoad * 20 < total : items.length === 20;
        setHasMore(nextHasMore);
        setPage(pageToLoad);
      } catch (err) {
        console.error('Failed to fetch latest phones', err);
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
    fetchLatestPhones(1);
  }, [fetchLatestPhones]);

  const loadMoreLatestPhones = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchLatestPhones(page + 1);
  }, [fetchLatestPhones, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreLatestPhones();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreLatestPhones, loading, loadingMore, hasMore]);

  const sortedPhones = useMemo(() => {
    const list = [...phones];
    switch (sortBy) {
      case 'priceLow':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'priceHigh':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'latest':
      default:
        return list.sort((a, b) => {
          const aDate =
            parseReleaseDate(a.specs?.General?.ReleaseDate) ||
            parseReleaseDate(a.specs?.General?.LaunchDate) ||
            new Date(0);
          const bDate =
            parseReleaseDate(b.specs?.General?.ReleaseDate) ||
            parseReleaseDate(b.specs?.General?.LaunchDate) ||
            new Date(0);
          return bDate - aDate;
        });
    }
  }, [phones, sortBy]);

  return (
    <div className="finder-page">
      <div className="finder-container">
        <FilterSidebar />

        <section className="finder-results">
          <div className="results-header">
            <h2>Latest Phones</h2>
            <div className="results-meta">
              <span>{sortedPhones.length} Phones Found</span>
              <select
                className="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="loading-text">Loading latest phones…</p>
          ) : sortedPhones.length === 0 ? (
            <p className="loading-text">No latest phones found (released in last 3 months).</p>
          ) : (
            <div className="finder-list">
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

                return (
                  <div key={phoneId} className="finder-card">
                    <button
                      className={`compare-btn ${isSelected ? 'selected' : ''}`}
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
                      {isSelected ? '✓ Added' : '+ Compare'}
                    </button>

                    <div className="finder-img" style={{ position: 'relative' }}>
                      <Image src={phone.image} alt={phone.name} fill style={{ objectFit: 'contain' }} sizes="110px" />
                    </div>

                    <div className="finder-info">
                      <h3>{phone.name}</h3>
                      <p className="brand">
                        {phone.brand.charAt(0).toUpperCase() + phone.brand.slice(1)}
                      </p>

                      <div className="spec-grid">
                        <div className="spec-item">
                          <span className="spec-label">Processor</span>
                          <span className="spec-value">{performance.Chipset || '—'}</span>
                        </div>

                        <div className="spec-item">
                          <span className="spec-label">Memory & Storage</span>
                          <span className="spec-value">
                            {performance.RAM && storage.InternalStorage
                              ? `${performance.RAM} RAM, ${storage.InternalStorage} Storage`
                              : '—'}
                          </span>
                        </div>

                        <div className="spec-item">
                          <span className="spec-label">Rear Camera</span>
                          <span className="spec-value">
                            {rearCamera.Camera?.Primary || '—'}
                          </span>
                        </div>

                        <div className="spec-item">
                          <span className="spec-label">Front Camera</span>
                          <span className="spec-value">{frontCamera.Camera || '—'}</span>
                        </div>

                        <div className="spec-item">
                          <span className="spec-label">Battery</span>
                          <span className="spec-value">
                            {battery.Capacity || '—'}
                            {battery.QuickCharging ? ` | ${battery.QuickCharging} Fast Charging` : ''}
                            {battery.WirelessCharging === 'Yes' ? ' | Wireless Charging' : ''}
                          </span>
                        </div>

                        <div className="spec-item">
                          <span className="spec-label">Display</span>
                          <span className="spec-value">
                            {display.Size || '—'}
                            {display.Type ? ` | ${display.Type}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="finder-actions">
                      <p className="price">₹{phone.price?.toLocaleString('en-IN') || '—'}</p>
                      <button className="buy-btn" onClick={() => router.push(`/phone/${phoneId}`)}>
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
              {hasMore && <div className="scroll-sentinel" ref={sentinelRef} />}
            </div>
          )}
          {loadingMore && <p className="loading-text">Loading more phones…</p>}
        </section>
      </div>
    </div>
  );
}