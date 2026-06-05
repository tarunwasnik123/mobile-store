import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addPhone, removePhone } from '../store/compareSlice';
import './PhoneCard.css';

export default function PhoneCard({ phone }) {
  const dispatch = useDispatch();
  const selected = useSelector((state) => state.compare.selected || []);

  // stable id
  const isPlaceholderExternalId = (id) =>
    typeof id === 'string' && id.match(/^p\d+$/);
  const phoneId =
    phone.externalId && !isPlaceholderExternalId(phone.externalId)
      ? phone.externalId
      : phone._id;
  const isSelected = selected.some((p) => p.id === phoneId);

  // ✅ FIXED: correct specs paths
  const performance = phone.specs?.Performance || {};
  const storage = phone.specs?.Storage || {};
  const rearCamera = phone.specs?.RearCamera || {};
  const general = phone.specs?.General || {};

  const previewSpecs = [];

  if (performance.RAM && storage.InternalStorage) {
    previewSpecs.push(
      `${performance.RAM} RAM, ${storage.InternalStorage} Storage`,
    );
  }
  if (performance.Chipset) previewSpecs.push(performance.Chipset);
  if (rearCamera.Camera?.Primary)
    previewSpecs.push(`${rearCamera.Camera.Primary} Rear Camera`);

  return (
    <article className="phone-list-item">
      <div className="list-left">
        <img src={phone.image} alt={phone.name} className="list-img" />
      </div>

      <div className="list-center">
        <h3 className="list-title">{phone.name}</h3>

        <div className="list-subtitle">
          {phone.brand.charAt(0).toUpperCase() + phone.brand.slice(1)}
          <span className="dot">•</span>
          Release Date:{' '}
          <strong>
            {general?.ReleaseDate
              ? new Date(general.ReleaseDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </strong>
        </div>

        <ul className="list-specs">
          {previewSpecs.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>

        <div className="list-links">
          <Link to={`/phone/${phoneId}`} className="spec-link">
            View All Specs
          </Link>
        </div>
      </div>

      <div className="list-right">
        <div className="price-row">
          <div className="price">
            {phone.price ? `₹${Number(phone.price).toLocaleString()}` : '—'}
          </div>
          <div className="store">Available</div>
        </div>

        <div className="actions">
          <button
            className={isSelected ? 'btn remove' : 'btn add'}
            onClick={() =>
              isSelected
                ? dispatch(removePhone(phoneId))
                : dispatch(addPhone({ ...phone, id: phoneId }))
            }>
            {isSelected ? 'Remove' : '+ Compare'}
          </button>
        </div>
      </div>
    </article>
  );
}
