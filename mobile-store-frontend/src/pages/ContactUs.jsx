import React from 'react';
import './PageStyles.css';

export default function ContactUs() {
  return (
    <div className="page">
      <div className="contact-wrapper">
        <h1>Contact Us</h1>
        <p>
          Whether you have a query or a business proposal, we are open to
          communication.
        </p>

        <div className="contact-info">
          <h2>General Support</h2>
          <p>
            <strong>Email:</strong>{' '}
            <a href="mailto:teamhandsetnews@gmail.com">
              teamhandsetnews@gmail.com
            </a>
          </p>

          <h2>Brand & Media Collaborations</h2>
          <p>
            We are open to strategic partnerships, sponsored content, and
            product previews. Contact our collaboration desk at:{' '}
            <a href="mailto:teamhandsetnews@gmail.com">
              teamhandsetnews@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
