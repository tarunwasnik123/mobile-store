import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { addPhone, removePhone } from "../store/compareSlice";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import FilterSidebar from "../components/FilterSidebar";
import "./UpcomingPhones.css";

export default function UpcomingPhones() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { brands, price } = useSelector((state) => state.filters);
  const selectedCompare = useSelector((state) => state.compare.selected || []);

  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("nearest");
  const sentinelRef = useRef(null);

  function parseReleaseDate(value) {
    if (!value) return null;
    const d = new Date(value);
    if (!isNaN(d)) return d;
    const parts = value.split(" ");
    if (parts.length === 2) return new Date(`${parts[0]} 1, ${parts[1]}`);
    return null;
  }

  /* =======================
     Sorting
     ======================= */
  const sortedPhones = useMemo(() => {
    const list = [...phones];
    switch (sortBy) {
      case "priceLow":
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "priceHigh":
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "nearest":
      default:
        return list.sort((a, b) => {
          const da = parseReleaseDate(a.specs?.General?.ReleaseDate);
          const db = parseReleaseDate(b.specs?.General?.ReleaseDate);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return da - db;
        });
    }
  }, [phones, sortBy]);

  /* =======================
     Fetch upcoming phones
     ======================= */
  const fetchUpcomingPhones = useCallback(
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
      brands.forEach((b) => params.append("brand", b));

      try {
        const res = await api.get(`/upcoming?${params.toString()}`);
        const items = res?.results || res || [];
        setPhones((current) =>
          pageToLoad === 1 ? items : [...current, ...items],
        );

        const total = typeof res.total === "number" ? res.total : undefined;
        const nextHasMore =
          typeof total === "number"
            ? pageToLoad * 20 < total
            : items.length === 20;
        setHasMore(nextHasMore);
        setPage(pageToLoad);
      } catch (err) {
        console.error("Failed to fetch upcoming phones", err);
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
    fetchUpcomingPhones(1);
  }, [fetchUpcomingPhones]);

  const loadMoreUpcomingPhones = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchUpcomingPhones(page + 1);
  }, [fetchUpcomingPhones, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreUpcomingPhones();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreUpcomingPhones, loading, loadingMore, hasMore]);

  /* =======================
     Render
     ======================= */
  return (
    <div className="finder-page">
      <div className="finder-container">
        <FilterSidebar />

        <section className="finder-results">
          {/* HEADER */}
          <div className="results-header">
            <h2>Upcoming Phones</h2>
            <div className="results-meta">
              <span>{sortedPhones.length} Phones Found</span>
              <select
                className="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="nearest">Nearest Release</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* RESULTS */}
          {loading ? (
            <p className="loading-text">Loading upcoming phones…</p>
          ) : sortedPhones.length === 0 ? (
            <p className="loading-text">
              No upcoming phones found matching your criteria.
            </p>
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
                    <button
                      className={`compare-btn ${isSelected ? "selected" : ""}`}
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
                      }
                    >
                      {isSelected ? "✓ Added" : "+ Compare"}
                    </button>

                    {/* IMAGE */}
                    <div className="finder-img-col">
                      <img
                        src={phone.image}
                        alt={phone.name}
                        className="finder-img"
                      />
                    </div>

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
                            {performance.Chipset || "—"}
                          </span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">RAM & Storage</span>
                          <span className="spec-value">
                            {performance.RAM && storage.InternalStorage
                              ? `${performance.RAM} / ${storage.InternalStorage}`
                              : "—"}
                          </span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Rear Camera</span>
                          <span className="spec-value">
                            {rearCamera.Camera?.Primary || "—"}
                          </span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Front Camera</span>
                          <span className="spec-value">
                            {frontCamera.Camera || "—"}
                          </span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Battery</span>
                          <span className="spec-value">
                            {battery.Capacity || "—"}
                          </span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Display</span>
                          <span className="spec-value">
                            {display.Size || "—"}
                            {display.Type ? ` ${display.Type}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="finder-actions">
                      <p className="price">
                        {phone.price
                          ? `₹${phone.price.toLocaleString()}`
                          : "TBA"}
                      </p>
                      <button
                        className="buy-btn"
                        onClick={() => navigate(`/upcoming/${phoneId}`)}
                      >
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
