import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addPhone, removePhone } from '../store/compareSlice';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import FilterSidebar from '../components/FilterSidebar';
import './FindPage.css';

export default function BestPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { brands, price } = useSelector((state) => state.filters);
  const selectedCompare = useSelector((state) => state.compare.selected || []);

  const [topPhones, setTopPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('best');
  const sentinelRef = useRef(null);

  /* =======================
     Sorting
     ======================= */
  const sortedPhones = useMemo(() => {
    const list = [...(topPhones || [])];

    switch (sortBy) {
      case 'priceLow':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'priceHigh':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'latest':
        return list.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
      case 'best':
      default:
        return list;
    }
  }, [topPhones, sortBy]);

  /* =======================
     Fetch best phones
     ======================= */
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
        setTopPhones((current) =>
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
        if (entries[0].isIntersecting) {
          loadMoreBestPhones();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreBestPhones, loading, loadingMore, hasMore]);

  return (
    <div className="finder-page">
      <div className="finder-container">
        <FilterSidebar />

        <section className="finder-results">
          {/* HEADER */}
          <div className="results-header">
            <h2>Top Phones</h2>

            <div className="results-meta">
              <span>{sortedPhones.length} Phones Found</span>

              <select
                className="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}>
                <option value="best">Best</option>
                <option value="latest">Latest</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* RESULTS */}
          {loading ? (
            <p className="loading-text">Loading best phones…</p>
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
                    {/* COMPARE BUTTON */}
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

                    {/* IMAGE */}
                    <img
                      src={phone.image}
                      alt={phone.name}
                      className="finder-img"
                    />

                    {/* INFO */}
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

                    {/* ACTIONS */}
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
