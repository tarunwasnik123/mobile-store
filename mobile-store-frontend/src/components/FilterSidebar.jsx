import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setBrands, setPrice, resetFilters } from '../store/filterSlice';
import api from '../api/client';
import './FilterSidebar.css';

const MIN_PRICE = 0;
const MAX_PRICE = 200000;

const QUICK_PRICES = [
  { label: 'Under ₹10,000', value: 10000 },
  { label: 'Under ₹20,000', value: 20000 },
  { label: 'Under ₹30,000', value: 30000 },
  { label: 'Under ₹50,000', value: 50000 },
];

const FilterSidebar = () => {
  const dispatch = useDispatch();
  const selectedBrands = useSelector((state) => state.filters.brands);
  const priceRange = useSelector((state) => state.filters.price);

  const [brandSearch, setBrandSearch] = useState('');
  const [brands, setBrandsList] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get('/brands?limit=1000');
        const list = (res?.results || res || [])
          .map((b) => b.name)
          .sort((a, b) => a.localeCompare(b));
        setBrandsList(list);
      } catch {
        setBrandsList([]);
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  // Filter brands and put selected brands at top
  const filteredBrands = useMemo(() => {
    const lowerSearch = brandSearch.toLowerCase();
    const filtered = brands.filter((b) =>
      b.toLowerCase().includes(lowerSearch)
    );
    const selected = filtered.filter((b) => selectedBrands.includes(b));
    const unselected = filtered.filter((b) => !selectedBrands.includes(b));
    return [...selected, ...unselected];
  }, [brands, brandSearch, selectedBrands]);

  // Toggle brand selection
  const toggleBrand = useCallback(
    (brand) => {
      const updated = selectedBrands.includes(brand)
        ? selectedBrands.filter((b) => b !== brand)
        : [...selectedBrands, brand];
      dispatch(setBrands(updated));
    },
    [dispatch, selectedBrands]
  );

  // Price update handlers
  const updateMinPrice = (val) => {
    const min = Math.max(MIN_PRICE, Math.min(Number(val), priceRange[1]));
    dispatch(setPrice([min, priceRange[1]]));
  };

  const updateMaxPrice = (val) => {
    const max = Math.min(MAX_PRICE, Math.max(Number(val), priceRange[0]));
    dispatch(setPrice([priceRange[0], max]));
  };

  // Reset filters
  const handleReset = () => {
    dispatch(resetFilters());
    setBrandSearch('');
  };

  return (
    <aside className="filter-sidebar">
      {/* HEADER */}
      <div className="filter-header">
        <h3>Filters</h3>
        <button className="reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      {/* QUICK PRICE */}
      <div className="filter-section">
        <h4>Quick Price</h4>
        <div className="quick-price-grid">
          {QUICK_PRICES.map((p) => (
            <button
              key={p.value}
              className="quick-filter-btn"
              onClick={() => dispatch(setPrice([0, p.value]))}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRICE RANGE */}
      <div className="filter-section">
        <h4>Price Range</h4>
        <div className="price-inputs">
          <input
            type="number"
            value={priceRange[0]}
            min={MIN_PRICE}
            max={priceRange[1]}
            onChange={(e) => updateMinPrice(e.target.value)}
          />
          <span>–</span>
          <input
            type="number"
            value={priceRange[1]}
            min={priceRange[0]}
            max={MAX_PRICE}
            onChange={(e) => updateMaxPrice(e.target.value)}
          />
        </div>

        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step="1000"
          value={priceRange[1]}
          onChange={(e) => updateMaxPrice(e.target.value)}
          className="price-slider"
        />

        <div className="price-display">
          ₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}
        </div>
      </div>

      {/* BRANDS */}
      <div className="filter-section">
        <h4>
          Brands
          {selectedBrands.length > 0 && (
            <span className="brand-count"> ({selectedBrands.length})</span>
          )}
        </h4>

        <input
          type="text"
          placeholder="Search brands"
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          className="filter-search"
        />

        {selectedBrands.length > 0 && (
          <div className="selected-brands">
            {selectedBrands.map((b) => (
              <span
                key={b}
                className="brand-chip"
                onClick={() => toggleBrand(b)}>
                {b.charAt(0).toUpperCase() + b.slice(1)} ✕
              </span>
            ))}
          </div>
        )}

        <div className="brand-list">
          {loadingBrands && <div className="no-brand">Loading brands…</div>}
          {!loadingBrands && filteredBrands.length === 0 && (
            <div className="no-brand">No brands found</div>
          )}

          {!loadingBrands &&
            filteredBrands.map((b) => (
              <label key={b} className="brand-checkbox">
                <input
                  type="checkbox"
                  checked={selectedBrands
                    .map((sB) => sB.toLowerCase())
                    .includes(b.toLowerCase())}
                  onChange={() => toggleBrand(b)}
                />
                <span>{b.charAt(0).toUpperCase() + b.slice(1)}</span>
              </label>
            ))}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
