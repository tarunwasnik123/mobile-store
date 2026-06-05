import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PhoneCard from '../components/PhoneCard';
import './PageStyles.css';
import api from '../api/client';

const priceRanges = {
  'under-10000': [0, 10000],
  'under-15000': [0, 15000],
  'under-20000': [0, 20000],
  'under-25000': [0, 25000],
  'under-30000': [0, 30000],
};

export default function PricePage() {
  const { range } = useParams();
  const [phones, setPhones] = useState([]);

  useEffect(() => {
    let mounted = true;
    api
      .get('/phones?limit=1000')
      .then((res) => {
        const items = res.results || res;
        const r = priceRanges[range] || [0, 1000000];
        if (mounted)
          setPhones(items.filter((p) => p.price >= r[0] && p.price <= r[1]));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [range]);

  return (
    <div className="page">
      <h2>Phones: {range}</h2>
      <div className="cards-grid">
        {phones.map((p) => (
          <PhoneCard key={p.id} phone={p} />
        ))}
      </div>
    </div>
  );
}
