import React from 'react';
import './PageStyles.css';

export default function PrivacyPolicy() {
  return (
    <div className="page">
      <div className="policy-wrapper">
        <h1>Privacy Policy</h1>

        <p>
          Handset News ("we," "us," or "our") is committed to protecting your
          online privacy. This policy outlines how we handle your data on
          https://handsetnews.com.
        </p>

        <section className="policy-section">
          <h2>1. Information Collection</h2>
          <p>We collect minimal data to optimize your experience:</p>
          <ul>
            <li>
              <strong>Non-Personal Data:</strong> Browser type, device model,
              and pages visited to improve our Comparison Tools.
            </li>
            <li>
              <strong>Personal Data:</strong> Only collected when voluntarily
              submitted via contact forms (e.g., Name and Email).
            </li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>2. Cookies and Advertising</h2>
          <p>
            We use standard cookies to remember your comparison history and
            preferences.
          </p>
          <p>
            <strong>Third-Party Vendors:</strong> We work with partners like
            Google AdSense. These vendors use cookies (like the DART cookie) to
            serve ads based on your visits to our site and other websites.
          </p>
          <p>
            <strong>Control:</strong> You can disable cookies through your
            browser settings at any time.
          </p>
        </section>

        <section className="policy-section">
          <h2>3. Data Security</h2>
          <p>
            We employ industry-standard security protocols to protect user data.
            We never sell, lease, or trade your personal information to
            third-party marketing agencies.
          </p>
        </section>
      </div>
    </div>
  );
}
