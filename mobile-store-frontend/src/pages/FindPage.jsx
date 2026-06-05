import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addPhone, removePhone } from '../store/compareSlice';
import { setPrice, setBrands } from '../store/filterSlice';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import FilterSidebar from '../components/FilterSidebar';
import './FindPage.css';

export default function FindPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { brands, price } = useSelector((state) => state.filters);
  const selectedCompare = useSelector((state) => state.compare.selected || []);

  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const sentinelRef = React.useRef(null);

  // Set filters from URL on mount or URL change
  useEffect(() => {
    const minPrice = parseInt(searchParams.get('minPrice')) || 0;
    const maxPrice = parseInt(searchParams.get('maxPrice')) || 200000;
    const brandParam = searchParams.get('brand');
    const brandsArray = brandParam
      ? brandParam
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : [];

    dispatch(setPrice([minPrice, maxPrice]));
    dispatch(setBrands(brandsArray));
  }, [searchParams, dispatch]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (price[0] > 0) params.set('minPrice', price[0].toString());
    if (price[1] < 200000) params.set('maxPrice', price[1].toString());
    if (brands.length > 0) params.set('brand', brands.join(','));

    const newSearch = params.toString();
    const currentSearch = window.location.search.slice(1);
    if (newSearch !== currentSearch) {
      navigate(`/find?${newSearch}`, { replace: true });
    }
  }, [price, brands, navigate]);

  /* =======================
     Fetch phones
     ======================= */
  const fetchPhones = useCallback(
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
        const res = await api.get(`/phones?${params.toString()}`);
        const items = res.results || res.data || [];
        setPhones((current) =>
          pageToLoad === 1 ? items : [...current, ...items],
        );

        const total = typeof res.total === 'number' ? res.total : undefined;
        const nextHasMore =
          typeof total === 'number'
            ? pageToLoad * 20 < total
            : items.length === 20;
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
        if (entries[0].isIntersecting) {
          loadMorePhones();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMorePhones, loading, loadingMore, hasMore]);

  /* =======================
     Sorting
     ======================= */
  const sortedPhones = useMemo(() => {
    const list = [...phones];

    switch (sortBy) {
      case 'priceLow':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'priceHigh':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'latest':
      default:
        return list.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
    }
  }, [phones, sortBy]);

  return (
    <div className="finder-page">
      <div className="finder-container">
        <FilterSidebar />

        <section className="finder-results">
          {/* HEADER */}
          <div className="results-header">
            <h2>Phone Finder</h2>

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

          {/* RESULTS */}
          {loading ? (
            <p className="loading-text">Loading phones…</p>
          ) : sortedPhones.length === 0 ? (
            <p className="loading-text">No phones found</p>
          ) : (
            <div className="finder-list">
              {sortedPhones.map((phone) => {
                const phoneId = phone.externalId || phone._id;
                const isSelected = selectedCompare.some(
                  (p) => p.id === phoneId,
                );

                const specs = phone.specs || {};
                const performance = specs.Performance || {};
                const storage = specs.Storage || {};
                const rearCamera = specs.RearCamera || {};
                const frontCamera = specs.FrontCamera || {};
                const battery = specs.Battery || {};
                const display = specs.Display || {};

                return (
                  <div key={phoneId} className="finder-card">
                    {/* Compare */}
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

                    {/* Image */}
                    <img
                      src={phone.image}
                      alt={phone.name}
                      className="finder-img"
                    />

                    {/* Info */}
                    <div className="finder-info">
                      <h3>{phone.name}</h3>
                      <p className="brand">
                        {phone.brand.charAt(0).toUpperCase() +
                          phone.brand.slice(1)}
                      </p>

                      <div className="spec-grid">
                        <div className="spec-item">
                          <span className="spec-label">Processor</span>
                          <span className="spec-value">
                            {performance.Chipset || '—'}
                          </span>
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
                          <span className="spec-value">
                            {frontCamera.Camera || '—'}
                          </span>
                        </div>

                        <div className="spec-item">
                          <span className="spec-label">Battery</span>
                          <span className="spec-value">
                            {battery.Capacity || '—'}
                            {battery.QuickCharging
                              ? ` | ${battery.QuickCharging} Fast Charging`
                              : ''}
                            {battery.WirelessCharging === 'Yes'
                              ? ' | Wireless Charging'
                              : ''}
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

                    {/* Actions */}
                    <div className="finder-actions">
                      <p className="price">
                        ₹{phone.price?.toLocaleString() || '—'}
                      </p>
                      <button
                        className="buy-btn"
                        onClick={() => navigate(`/phone/${phoneId}`)}>
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
