import React from 'react';
import './PageStyles.css';

export default function DisclaimerPage() {
  return (
    <div className="page">
      <div className="about-wrapper">
        <h1>Disclaimer</h1>

        <div className="about-section">
          <h2>Legal Disclaimer for Handset News</h2>
          <p>
            The information on Handset News is for general informational and
            educational purposes only.
          </p>
        </div>

        <div className="about-section">
          <h2>1. No Professional Advice</h2>
          <p>
            The reviews and "Service Center Experience" metrics are based on
            independent research and community feedback. They should not be
            considered as professional financial or legal advice.
          </p>
        </div>

        <div className="about-section">
          <h2>2. Pricing Disclaimer</h2>
          <p>
            Smartphone prices in India fluctuate daily due to GST revisions and
            retailer discounts. We do not guarantee the final price you may find
            on e-commerce sites or offline stores.
          </p>
        </div>

        <div className="about-section">
          <h2>3. Accuracy Disclaimer</h2>
          <p>
            We verify specs from official brand documents, but we do not warrant
            that all content is free from errors. Users must verify final
            details with the brand before making a purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
