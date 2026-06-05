import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import PhoneCard from '../components/PhoneCard';
import './PageStyles.css';

export default function BrandPage() {
  const { brandName } = useParams();
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get(`/phones?brand=${encodeURIComponent(brandName)}&limit=200`)
      .then((res) => {
        const items = res.results || res;
        if (mounted) setPhones(items);
      })
      .catch((err) => setError(err.message || 'Failed to load brand phones'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [brandName]);

  return (
    <div className="page">
      <h2>Phones by {brandName}</h2>
      <div className="cards-grid">
        {phones.map((p) => (
          <PhoneCard key={p.id} phone={p} />
        ))}
      </div>
    </div>
  );
}
