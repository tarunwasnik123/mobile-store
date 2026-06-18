import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  addPhone as addPhoneAction,
  removePhone as removePhoneAction,
  clear as clearAction,
} from "../store/compareSlice";
import api from "../api/client";
import "./ComparisonPage.css";

function PhoneSlot({
  phone,
  allPhones,
  excludedIds,
  onSelect,
  onRemove,
  slotIndex,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const filteredPhones = allPhones.filter((p) => {
    const phoneId = p.id || p.externalId || p._id;
    if (excludedIds.has(String(phoneId))) return false;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (selectedPhone) => {
    onSelect(selectedPhone);
    setSearchTerm("");
    setDropdownVisible(false);
  };

  const slotLabels = ["First Device", "Second Device", "Third Device"];

  if (phone) {
    return (
      <div className="cp-slot cp-slot--filled">
        <div className="cp-slot-filled-inner">
          <div className="cp-slot-img-wrap">
            <img src={phone.image} alt={phone.name} />
          </div>
          <div className="cp-slot-meta">
            <span className="cp-slot-brand">
              {phone.brand
                ? phone.brand.charAt(0).toUpperCase() + phone.brand.slice(1)
                : "Unknown"}
            </span>
            <span className="cp-slot-name">{phone.name}</span>
            {phone.price && (
              <span className="cp-slot-price">
                ₹{Number(phone.price).toLocaleString()}
              </span>
            )}
          </div>
          <button
            className="cp-slot-remove"
            onClick={onRemove}
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-slot cp-slot--empty">
      <div className="cp-slot-label">{slotLabels[slotIndex]}</div>
      <div className="cp-slot-icon">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>
      <div className="cp-slot-search-wrap">
        <input
          type="text"
          className="cp-slot-input"
          placeholder="Search device..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setDropdownVisible(true)}
          onBlur={() => setTimeout(() => setDropdownVisible(false), 150)}
        />
        {dropdownVisible && filteredPhones.length > 0 && (
          <ul className="cp-dropdown">
            {filteredPhones.map((p) => (
              <li
                key={p.id || p._id}
                className="cp-dropdown-item"
                onMouseDown={() => handleSelect(p)}
              >
                <span className="cp-dropdown-name">{p.name}</span>
                {p.brand && (
                  <span className="cp-dropdown-brand">
                    {p.brand.charAt(0).toUpperCase() + p.brand.slice(1)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const SPEC_CATEGORY_LABELS = {
  General: "General",
  Performance: "Performance",
  Storage: "Storage",
  Display: "Display",
  RearCamera: "Rear Camera",
  FrontCamera: "Front Camera",
  Battery: "Battery",
  SoundAudio: "Audio",
  NetworkConnectivity: "Network",
  Sensors: "Sensors",
};

const specCategories = Object.keys(SPEC_CATEGORY_LABELS);

export default function ComparisonPage() {
  const dispatch = useDispatch();
  const selected = useSelector((state) => state.compare.selected || []);
  const [phones, setPhones] = useState([]);
  const [enrichedSelected, setEnrichedSelected] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [activeCategory, setActiveCategory] = useState("General");
  const tableRef = useRef(null);

  const slots = [...enrichedSelected];
  while (slots.length < 3) slots.push(null);
  const filledSlots = slots.filter(Boolean);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.get("/phones?limit=500"), api.get("/upcoming?limit=500")])
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

  useEffect(() => {
    if (selected.length === 0) {
      setEnrichedSelected([]);
      return;
    }
    const enriched = selected.map((sel) => {
      const full = phones.find(
        (p) =>
          p.id === sel.id ||
          p._id === sel._id ||
          p.externalId === sel.externalId ||
          p.id === sel.externalId,
      );
      return full || sel;
    });
    setEnrichedSelected(enriched);
  }, [selected, phones]);

  useEffect(() => {
    if (filledSlots.length < 2 && showComparison) setShowComparison(false);
  }, [filledSlots.length, showComparison]);

  const handleSelectSlot = (phone, index) => {
    const old = slots[index];
    if (old?.id) dispatch(removePhoneAction(old.id));
    if (phone?.id) dispatch(addPhoneAction(phone));
  };

  const handleRemoveSlot = (index) => {
    const old = slots[index];
    if (old?.id) dispatch(removePhoneAction(old.id));
  };

  const handleCompareNow = () => {
    if (filledSlots.length < 2) return;
    setShowComparison(true);
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const getNestedSpecKeys = (category) => {
    const keys = new Set();
    slots.forEach((phone) => {
      const obj = phone?.specs?.[category];
      if (obj && typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
          const val = obj[key];
          if (val && typeof val === "object" && !Array.isArray(val)) {
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
    if (!phone?.specs) return undefined;
    if (key.includes(".")) {
      const [k, sub] = key.split(".");
      return phone.specs[category]?.[k]?.[sub];
    }
    return phone.specs[category]?.[key];
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d)) return date;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatVal = (val, key) => {
    if (!val) return "—";
    if (key?.endsWith("Date") || key === "ReleaseDate" || key === "LaunchDate")
      return formatDate(val);
    if (Array.isArray(val)) return val.join(", ");
    return val;
  };

  const formatKeyLabel = (key) => {
    const label = key.includes(".") ? key.split(".")[1] : key;
    return label.replace(/([A-Z])/g, " $1").trim();
  };

  const activeKeys = getNestedSpecKeys(activeCategory);

  return (
    <div className="cp-page">
      {/* HEADER */}
      <div className="cp-header">
        <div className="cp-header-left">
          <h1 className="cp-title">Compare Devices</h1>
          <p className="cp-subtitle">
            Select up to 3 devices to compare side by side
          </p>
        </div>
        <button
          className="cp-clear-btn"
          onClick={() => {
            dispatch(clearAction());
            setShowComparison(false);
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
          Clear all
        </button>
      </div>

      {/* SLOT SELECTOR */}
      <div className="cp-slots-section">
        <div className="cp-slots-row">
          {slots.map((s, idx) => (
            <React.Fragment key={idx}>
              <PhoneSlot
                phone={s}
                allPhones={phones}
                slotIndex={idx}
                excludedIds={
                  new Set(
                    slots
                      .map((sp, si) =>
                        si === idx ? null : sp?.id || sp?.externalId || sp?._id,
                      )
                      .filter(Boolean)
                      .map(String),
                  )
                }
                onSelect={(phone) => handleSelectSlot(phone, idx)}
                onRemove={() => handleRemoveSlot(idx)}
              />
              {idx < 2 && (
                <div className="cp-vs">
                  <span>VS</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="cp-action-row">
          <button
            className="cp-compare-btn"
            onClick={handleCompareNow}
            disabled={filledSlots.length < 2}
          >
            {filledSlots.length < 2
              ? `Select ${2 - filledSlots.length} more device${filledSlots.length === 1 ? "" : "s"}`
              : "Compare Now"}
            {filledSlots.length >= 2 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      {showComparison && filledSlots.length >= 2 && (
        <div ref={tableRef} className="cp-compare-section">
          {/* PHONE HEADER CARDS */}
          <div className="cp-phone-headers">
            <div className="cp-spec-col-spacer" />
            {slots.map((phone, idx) =>
              phone ? (
                <div key={idx} className="cp-phone-header-card">
                  <div className="cp-ph-img">
                    <img src={phone.image} alt={phone.name} />
                  </div>
                  <div className="cp-ph-brand">
                    {phone.brand
                      ? phone.brand.charAt(0).toUpperCase() +
                        phone.brand.slice(1)
                      : "Unknown"}
                  </div>
                  <div className="cp-ph-name">{phone.name}</div>
                  {phone.price && (
                    <div className="cp-ph-price">
                      ₹{Number(phone.price).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : null,
            )}
          </div>

          {/* CATEGORY TABS */}
          <div className="cp-cat-tabs">
            {specCategories.map((cat) => (
              <button
                key={cat}
                className={`cp-cat-tab ${activeCategory === cat ? "cp-cat-tab--active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {SPEC_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* SPEC ROWS */}
          <div className="cp-spec-panel">
            {activeKeys.length === 0 ? (
              <div className="cp-empty-cat">
                No data available for this category.
              </div>
            ) : (
              activeKeys.map((key) => {
                const values = slots.map((p) =>
                  getSpecValue(p, activeCategory, key),
                );
                const hasAnyValue = values.some((v) => v);
                if (!hasAnyValue) return null;

                const filledValues = values.filter((v) => v);
                const allSame =
                  filledValues.length > 1 &&
                  filledValues.every((v) => v === filledValues[0]);

                return (
                  <div
                    key={key}
                    className={`cp-spec-row ${allSame ? "cp-spec-row--same" : ""}`}
                  >
                    <div className="cp-spec-key">{formatKeyLabel(key)}</div>
                    {slots.map((phone, idx) =>
                      phone ? (
                        <div
                          key={idx}
                          className={`cp-spec-val ${
                            !allSame && values[idx] && filledValues.length > 1
                              ? "cp-spec-val--highlight"
                              : ""
                          }`}
                        >
                          {formatVal(values[idx], key)}
                        </div>
                      ) : null,
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
