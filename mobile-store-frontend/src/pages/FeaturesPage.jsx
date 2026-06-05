import React from 'react';
import './PageStyles.css';

export default function FeaturesPage() {
  const features = [
    { title: 'Compare Phones', desc: 'Compare specs of up to 3 phones side-by-side' },
    { title: 'Phone Finder', desc: 'Advanced filtering by brand, price, and specs' },
    { title: 'Latest News', desc: 'Read reviews and tech news about new phones' },
    { title: 'Best Phones Lists', desc: 'Curated lists for different use cases' },
    { title: 'Price Alerts', desc: 'Get notified when prices drop' },
    { title: 'Upcoming Launches', desc: 'Stay updated on upcoming phone releases' }
  ];

  return (
    <div className="page">
      <h1>Features</h1>
      <div className="features-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
