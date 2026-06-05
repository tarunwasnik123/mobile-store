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
            Accuracy and transparency are important to us. Handset News gathers
            smartphone data from multiple reliable and publicly available
            sources.
          </p>
        </div>

        <div className="about-section">
          <h2>Official Brand Websites</h2>
          <p>
            We reference specifications and launch details directly from
            official smartphone brand websites whenever possible.
          </p>
        </div>

        <div className="about-section">
          <h2>Authorized Online Retailers</h2>
          <p>
            Pricing information is collected from well-known and authorized
            online retailers. Prices may vary over time and across platforms.
          </p>
        </div>

        <div className="about-section">
          <h2>Public Product Listings & APIs</h2>
          <p>
            We use structured product feeds, APIs, and public listings to keep
            our database updated with the latest phone releases and
            specifications.
          </p>
        </div>

        <div className="about-section">
          <h2>Manual Review & Verification</h2>
          <p>
            Our team periodically reviews and verifies data to reduce
            inaccuracies and outdated information.
          </p>
        </div>

        <div className="about-section">
          <h2>Legal Disclaimer for Handset News</h2>
          <p>
            The information on Handset News is for general informational and
            educational purposes only.
          </p>
          <h3>1. No Professional Advice</h3>
          <p>
            The reviews and "Service Center Experience" metrics are based on
            independent research and community feedback. They should not be
            considered as professional financial or legal advice.
          </p>
          <h3>2. Pricing Disclaimer</h3>
          <p>
            Smartphone prices in India fluctuate daily due to GST revisions and
            retailer discounts. We do not guarantee the final price you may find
            on e-commerce sites or offline stores.
          </p>
          <h3>3. Accuracy Disclaimer</h3>
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
