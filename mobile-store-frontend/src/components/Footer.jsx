import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import XIcon from '@mui/icons-material/X';
import InstagramIcon from '@mui/icons-material/Instagram';
import api from '../api/client';
import './Footer.css';

const Footer = () => {
  const [topPhones, setTopPhones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPhones = async () => {
      try {
        const res = await api.get('/phones/best?limit=5');
        const phones = Array.isArray(res)
          ? res
          : Array.isArray(res?.results)
            ? res.results
            : [];
        setTopPhones(phones.slice(0, 5));
      } catch (err) {
        console.error('Failed to load top phones for footer', err);
        setTopPhones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPhones();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="container">
          {/* About / Trust */}
          <div className="footer-section">
            <h4>Handset News</h4>
            <p>
              Handset News helps you compare, research and discover the best
              smartphones, prices, and news from trusted sources.
            </p>
            <ul className="trust-points">
              <li>✔ Expert phone comparisons</li>
              <li>✔ Verified pricing information</li>
              <li>✔ Latest smartphone news & alerts</li>
            </ul>
          </div>

          {/* Popular Phones */}
          <div className="footer-section">
            <h4>Top Phones</h4>
            <ul className="links-list">
              {loading ? (
                <li className="footer-loading">Loading…</li>
              ) : (
                topPhones.map((phone) => (
                  <li key={phone._id || phone.externalId}>
                    <Link
                      to={`/phone/${
                        phone.slug || phone.externalId || phone._id
                      }`}>
                      {phone.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Customer Support */}
          <div className="footer-section">
            <h4>Customer Support</h4>
            <ul className="links-list">
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
              <li>
                <Link to="/faq">FAQs</Link>
              </li>
              <li>
                <Link to="/how-we-work">How We Work</Link>
              </li>
              <li>
                <Link to="/disclaimer">Disclaimer</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-section">
            <h4>Company</h4>
            <ul className="links-list">
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-of-service">Terms & Conditions</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-social">
        <div className="social-content">
          <h5>Connect with us on Social media</h5>
          <div className="social-links">
            <a
              href="https://x.com/TheHandsetNews"
              target="_blank"
              rel="noopener noreferrer"
              title="Twitter/X"
              className="social-icon">
              <XIcon />
            </a>
            <a
              href="https://www.instagram.com/THEHANDSETNEWS"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              className="social-icon">
              <InstagramIcon />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Handset News. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
