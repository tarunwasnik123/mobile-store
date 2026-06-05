import React from 'react';
import './PageStyles.css';

export default function FAQsPage() {
  return (
    <div className="page">
      <div className="about-wrapper">
        <h1>Frequently Asked Questions</h1>

        <div className="about-section">
          <h2>Q1: Does HandsetNews sell phones?</h2>
          <p>
            Ans: No. We are a research and discovery platform. We provide links
            to authorized sellers, but the final transaction happens on their
            platform.
          </p>
        </div>

        <div className="about-section">
          <h2>Q2: How is your "Service Center" data collected?</h2>
          <p>
            Ans: We aggregate data from verified user reports and local repair
            market trends to estimate the long-term cost of ownership.
          </p>
        </div>

        <div className="about-section">
          <h2>Q3: Can I trust your upcoming leaks?</h2>
          <p>
            Ans: We only source leaks from high-credibility industry insiders,
            though they remain "highly probable" until the official launch.
          </p>
        </div>
      </div>
    </div>
  );
}
