import React from 'react';
import { Link } from 'react-router-dom';
import './AuthorProfile.css';

export default function AuthorProfile() {
  return (
    <div className="author-profile-page">
      <div className="author-profile-container">
        <Link to="/news" className="back-link">
          Back to News
        </Link>

        <div className="author-header">
          <div className="author-avatar">
            <div className="avatar-placeholder">
              <span>T</span>
            </div>
          </div>
          <div className="author-info">
            <h1>Tarun</h1>
            <p className="author-role">Mobile Technology Expert & Editor</p>
          </div>
        </div>

        <div className="author-content">
          <div className="author-bio">
            <h2>About Tarun</h2>
            <p>
              Tarun Wasnik is a Founder & Editor, tech publisher, and developer
              with extensive experience in mobile technology and digital trends.
              He specializes in smartphone comparisons and technical reviews,
              ensuring every reader gets the most precise information about
              their next gadget.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
