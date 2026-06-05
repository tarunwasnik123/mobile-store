import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addPhone as addPhoneAction,
  removePhone as removePhoneAction,
  clear as clearAction,
} from '../store/compareSlice';
import api from '../api/client';
import './ComparisonPage.css';

function PhoneSlot({ phone, allPhones, excludedIds, onSelect, onRemove }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const filteredPhones = allPhones.filter((p) => {
    const phoneId = p.id || p.externalId || p._id;
    if (excludedIds.has(String(phoneId))) return false;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (selectedPhone) => {
    onSelect(selectedPhone);
    setSearchTerm('');
    setDropdownVisible(false);
  };

  if (phone) {
    return (
      <div className="selector-slot filled">
        <div className="slot-content">
          <img src={phone.image} alt={phone.name} />
          <div>
            <div className="slot-name">{phone.name}</div>
            <div className="slot-brand">
              {phone.brand
                ? phone.brand.charAt(0).toUpperCase() + phone.brand.slice(1)
                : 'Unknown'}
            </div>
          </div>
          <button className="remove-slot" onClick={onRemove}>
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="selector-slot">
      <div className="slot-search-dropdown">
        <input
          type="text"
          placeholder="Select a product"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setDropdownVisible(true)}
          onBlur={() => setTimeout(() => setDropdownVisible(false), 150)}
        />
        {dropdownVisible && (
          <ul className="dropdown-list">
            {filteredPhones.map((p) => (
              <li
                key={p.id}
                className="dropdown-item"
                onMouseDown={() => handleSelect(p)}>
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ComparisonPage() {
  const dispatch = useDispatch();
  const selected = useSelector((state) => state.compare.selected || []);
  const [phones, setPhones] = useState([]);
  const [enrichedSelected, setEnrichedSelected] = useState([]);
  const tableRef = useRef(null);

  // Sync slots from Redux (max 3)
  const slots = [...enrichedSelected];
  while (slots.length < 3) slots.push(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.get('/phones?limit=500'), api.get('/upcoming?limit=500')])
      .then(([phonesRes, upcomingRes]) => {
        const allPhones = [
          ...(phonesRes.results || []),
          ...(upcomingRes.results || []),
        ].map((p) => ({ ...p, id: p.externalId || p._id || p.id }));

        if (mounted) setPhones(allPhones);
      })
      .catch(() => {});
    return () => (mounted = false);
  }, []);

  // Enrich selected phones with full details from API
  useEffect(() => {
    if (selected.length === 0) {
      setEnrichedSelected([]);
      return;
    }

    const enriched = selected.map((selectedPhone) => {
      // Try to find full phone data from the API phones list
      const fullPhone = phones.find(
        (p) =>
          p.id === selectedPhone.id ||
          p._id === selectedPhone._id ||
          p.externalId === selectedPhone.externalId ||
          p.id === selectedPhone.externalId,
      );

      // Return the full phone data if found, otherwise return the selected phone
      return fullPhone || selectedPhone;
    });

    setEnrichedSelected(enriched);
  }, [selected, phones]);

  const handleSelectSlot = (phone, index) => {
    const oldPhone = slots[index];
    if (oldPhone && oldPhone.id) {
      dispatch(removePhoneAction(oldPhone.id));
    }
    if (phone && phone.id) {
      dispatch(addPhoneAction(phone));
    }
  };

  const handleRemoveSlot = (index) => {
    const oldPhone = slots[index];
    if (oldPhone && oldPhone.id) {
      dispatch(removePhoneAction(oldPhone.id));
    }
  };

  const [showComparison, setShowComparison] = useState(false);

  const handleCompareNow = () => {
    if (slots.filter(Boolean).length < 2) return;
    setShowComparison(true);
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Hide comparison table automatically if there are fewer than 2 selected phones
  useEffect(() => {
    if (slots.filter(Boolean).length < 2 && showComparison) {
      setShowComparison(false);
    }
  }, [slots, showComparison]);

  const specCategories = [
    'General',
    'Performance',
    'Storage',
    'Display',
    'RearCamera',
    'FrontCamera',
    'Battery',
    'SoundAudio',
    'NetworkConnectivity',
    'Sensors',
  ];

  const getNestedSpecKeys = (category) => {
    const keys = new Set();
    slots.forEach((phone) => {
      const obj = phone?.specs?.[category];
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach((key) => {
          const val = obj[key];
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            // flatten one level: e.g. RearCamera.Camera.Primary -> "Camera.Primary"
            Object.keys(val).forEach((sub) => keys.add(`${key}.${sub}`));
          } else {
            keys.add(key);
          }
        });
      }
    });

    return Array.from(keys);
  };

  const getSpecValue = (phone, category, key) => {
    if (!phone || !phone.specs) return undefined;
    if (key.includes('.')) {
      const [k, sub] = key.split('.');
      return phone.specs[category]?.[k]?.[sub];
    }
    return phone.specs[category]?.[key];
  };

  const formatDate = (date) => {
    if (!date) return '—';

    const d = new Date(date);
    if (isNaN(d)) return date; // fallback if invalid

    return d
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/ (\d{4})$/, ', $1');
  };

  return (
    <div className="comparison-page">
      <header className="compare-header">
        <h1>Compare Mobiles</h1>
        <div>
          <button className="clear-btn" onClick={() => dispatch(clearAction())}>
            Clear
          </button>
        </div>
      </header>

      <div className="compare-layout">
        <main className="compare-main">
          <div className="selector-row">
            {slots.map((s, idx) => (
              <React.Fragment key={idx}>
                {/* Exclude phones already selected in other slots. Keep current slot's own phone(if any) selectable.*/}
                <PhoneSlot
                  phone={s}
                  allPhones={phones}
                  excludedIds={
                    new Set(
                      slots
                        .map((slotPhone, slotIdx) =>
                          slotIdx === idx
                            ? null
                            : slotPhone?.id ||
                              slotPhone?.externalId ||
                              slotPhone?._id,
                        )
                        .filter(Boolean)
                        .map((v) => String(v)),
                    )
                  }
                  onSelect={(phone) => handleSelectSlot(phone, idx)}
                  onRemove={() => handleRemoveSlot(idx)}
                />
                {idx < 2 && <div className="vs-badge">VS</div>}
              </React.Fragment>
            ))}
          </div>

          <div className="compare-action-area">
            <button
              className="compare-now"
              onClick={handleCompareNow}
              disabled={slots.filter(Boolean).length < 2}>
              Compare Now!
            </button>
          </div>

          {showComparison && slots.filter(Boolean).length >= 2 && (
            <div ref={tableRef} className="compare-table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th className="spec-col">Specification</th>
                    {slots.map(
                      (phone, idx) =>
                        phone && (
                          <th key={idx} className="phone-col">
                            <div className="phone-head">
                              <img src={phone.image} alt={phone.name} />
                              <div className="meta">
                                <div className="name">{phone.name}</div>
                                <div className="brand">
                                  {phone.brand
                                    ? phone.brand.charAt(0).toUpperCase() +
                                      phone.brand.slice(1)
                                    : 'Unknown'}
                                </div>
                                <div className="price">₹{phone.price}</div>
                              </div>
                            </div>
                          </th>
                        ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {specCategories.map((cat) => {
                    const isNested = slots.some(
                      (s) =>
                        s?.specs?.[cat] && typeof s.specs[cat] === 'object',
                    );

                    const nestedKeys = isNested ? getNestedSpecKeys(cat) : [];

                    return (
                      <React.Fragment key={cat}>
                        <tr className="category-row">
                          <td colSpan={slots.filter(Boolean).length + 1}>
                            {cat}
                          </td>
                        </tr>

                        {isNested ? (
                          nestedKeys.map((key) => (
                            <tr key={key}>
                              <td className="spec-key nested">{key}</td>
                              {slots.map((phone, idx) => (
                                <td key={idx} className="spec-cell">
                                  {(() => {
                                    const val = getSpecValue(phone, cat, key);
                                    // format known date keys
                                    if (
                                      key.endsWith('Date') ||
                                      key === 'ReleaseDate' ||
                                      key === 'LaunchDate'
                                    ) {
                                      return formatDate(val);
                                    }
                                    return val || '—';
                                  })()}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="spec-key">{cat}</td>
                            {slots.map((phone, idx) => (
                              <td key={idx} className="spec-cell">
                                {phone?.specs?.[cat] || '—'}
                              </td>
                            ))}
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
