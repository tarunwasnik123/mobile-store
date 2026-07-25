import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';

import logo from '../assets/HandsetLogo.svg';
import './Header.css';
import NavMenu from './NavMenu';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useDispatch } from 'react-redux';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  /* ---------- CLOSE DROPDOWNS ---------- */
  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setResults([]);
      }
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setResults([]);
      }
    };

    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  /* ---------- SEARCH API (phones + upcoming) ---------- */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const [phonesRes, upcomingRes] = await Promise.all([
          api.get(`/phones?q=${encodeURIComponent(query)}&limit=3`),
          api.get(`/upcoming?q=${encodeURIComponent(query)}&limit=3`),
        ]);

        const phonesData = (phonesRes.results || []).map((p) => ({
          ...p,
          type: 'phone',
        }));

        const upcomingData = (upcomingRes.results || []).map((p) => ({
          ...p,
          type: 'upcoming',
        }));

        setResults([...phonesData, ...upcomingData]);
      } catch (err) {
        console.error('Search error', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  /* ---------- RESET SEARCH & CLOSE ADMIN DROPDOWN ON ROUTE CHANGE ---------- */
  useEffect(() => {
    setIsOpen(false);
    setQuery(''); // clear search input
    setResults([]); // clear search results
  }, [location.pathname, location.search]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <header className="header">
      {/* TOP BAR */}
      <div className="header-top">
        <div className="header-inner">
          {/* LOGO */}
          <Link to="/" className="logo-btn" onClick={handleLogoClick}>
            <img src={logo} alt="Logo" />
          </Link>

          {/* SEARCH */}
          <div className="header-center" ref={searchRef}>
            <div className="search-bar">
              <input
                type="search"
                className="search-input"
                placeholder="Search mobiles, brands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="search-btn">
                <SearchIcon fontSize="small" />
              </button>
            </div>

            {/* SEARCH RESULTS */}
            {results.length > 0 && (
              <div className="search-dropdown">
                {results.map((phone) => (
                  <div
                    key={phone.externalId || phone._id}
                    className="search-item"
                    onClick={() => {
                      if (phone.type === 'phone') {
                        navigate(`/phone/${phone.externalId || phone._id}`);
                      } else if (phone.type === 'upcoming') {
                        navigate(`/upcoming/${phone.externalId || phone._id}`);
                      }
                      setResults([]);
                      setQuery('');
                    }}>
                    <img src={phone.image} alt={phone.name} />
                    <div>
                      <p className="phone-name">{phone.name}</p>
                      {phone.type === 'phone' && (
                        <span className="phone-price">
                          ₹{phone.price?.toLocaleString() || '—'}
                        </span>
                      )}
                      {phone.type === 'upcoming' && (
                        <span className="phone-upcoming">Upcoming</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && <div className="search-loading">Searching…</div>}
          </div>

          {/* USER */}
          <div className="header-right" ref={dropdownRef}>
            <button className="admin-btn" onClick={() => setIsOpen(!isOpen)}>
              <AccountCircleIcon />
              <span>{user?.name || 'Login'}</span>
              <KeyboardArrowDownIcon />
            </button>

            {isOpen && (
              <div className="admin-dropdown">
                {user ? (
                  <>
                    <Link to="/profile">My Profile</Link>
                    <Link to="/settings">Settings</Link>
                    <div className="divider" />
                    <button
                      onClick={async () => {
                        setIsOpen(false);
                        await logout();
                      }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Register</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NAV */}
      <div className="header-bottom">
        <NavMenu />
      </div>
    </header>
  );
};

export default Header;
