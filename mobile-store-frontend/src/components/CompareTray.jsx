import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removePhone, clear } from '../store/compareSlice';
import { useNavigate } from 'react-router-dom';
import './CompareTray.css';

export default function CompareTray() {
  const dispatch = useDispatch();
  const selected = useSelector((state) => state.compare.selected || []);
  const navigate = useNavigate();

  if (!selected || selected.length === 0) return null;

  return (
    <div className="compare-tray">
      <div className="tray-items">
        {selected.map((p) => (
          <div className="tray-item" key={p.id}>
            <img src={p.image} alt={p.name} />
            <div className="tname">{p.name}</div>
            <button
              className="tray-remove-btn"
              onClick={() => dispatch(removePhone(p.id))}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="tray-actions">
        <button
          disabled={selected.length < 2}
          onClick={() => navigate('/compare')}
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
