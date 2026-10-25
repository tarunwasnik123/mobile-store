'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removePhone, clear } from '../store/compareSlice';
import { useRouter } from 'next/navigation';
import './CompareTray.css';

export default function CompareTray() {
  const dispatch = useDispatch();
  const selected = useSelector((state) => state.compare.selected || []);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !selected || selected.length === 0) return null;

  const handleCompare = () => {
    if (selected.length < 2) return;
    const slugs = selected.map((p) => encodeURIComponent(p.id)).join('-vs-');
    router.push(`/compare/${slugs}`);
  };

  return (
    <div className="compare-tray">
      <div className="tray-items">
        {selected.map((p) => (
          <div className="tray-item" key={p.id}>
            <img src={p.image} alt={p.name} />
            <div className="tname">{p.name}</div>
            <button className="tray-remove-btn" onClick={() => dispatch(removePhone(p.id))}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="tray-actions">
        <button
          disabled={selected.length < 2}
          onClick={handleCompare}
          className="tray-compare-btn">
          Compare ({selected.length})
        </button>

        <button className="tray-clear-btn" onClick={() => dispatch(clear())}>
          Clear
        </button>
      </div>
    </div>
  );
}