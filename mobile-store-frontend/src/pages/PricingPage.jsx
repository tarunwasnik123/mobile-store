import React from 'react';
import './PageStyles.css';

export default function PricingPage() {
  const plans = [
    { name: 'Free', price: '₹0', features: ['Browse phones', 'Compare 2 phones', 'Read news'] },
    { name: 'Pro', price: '₹99/mo', features: ['Compare 5 phones', 'Price alerts', 'Save favorites', 'Priority support'] }
  ];

  return (
    <div className="page">
      <h1>Pricing</h1>
      <div className="pricing-grid">
        {plans.map((p, i) => (
          <div key={i} className="pricing-card">
            <h3>{p.name}</h3>
            <p className="price">{p.price}</p>
            <ul>
              {p.features.map((f, j) => <li key={j}>{f}</li>)}
            </ul>
            <button className="pricing-btn">Choose Plan</button>
          </div>
        ))}
      </div>
    </div>
  );
}
