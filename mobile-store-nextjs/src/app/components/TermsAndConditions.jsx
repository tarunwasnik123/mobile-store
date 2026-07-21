import './PageStyles.css';

export default function TermsAndConditions() {
  return (
    <div className="page">
      <div className="terms-wrapper">
        <h1>Terms and Conditions</h1>

        <section className="terms-section">
          <h2>1. Intellectual Property</h2>
          <p>
            The content, logo, original research metrics, and layout of Handset
            News are our exclusive property. No part of this website may be
            reproduced, redistributed, or "scraped" using automated bots without
            written permission.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Accuracy of Information</h2>
          <p>While we strive for 100% accuracy, the mobile market is volatile.</p>
          <ul>
            <li>
              <strong>Prices:</strong> All prices are indicative estimates and
              may vary by region and retailer.
            </li>
            <li>
              <strong>Specifications:</strong> Brands may change
              hardware/software specs post-launch without notice.
            </li>
            <li>
              <strong>Liability:</strong> We are not liable for any financial
              loss or dissatisfaction resulting from a purchase made based on
              information found on this site.
            </li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. External Links</h2>
          <p>
            We are an information portal, not a retail entity. We are not
            responsible for transactions, warranties, or delivery issues arising
            from third-party platforms linked from our site.
          </p>
        </section>
      </div>
    </div>
  );
}