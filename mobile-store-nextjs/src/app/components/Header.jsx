'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';

import './Header.css';
import NavMenu from './NavMenu';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

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

  useEffect(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, [pathname, searchParams]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    router.push('/');
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-inner">
          <Link href="/" className="logo-btn" onClick={handleLogoClick}>
            <Image src="/HandsetLogo.svg" alt="Logo" width={160} height={85} priority />
          </Link>

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

            {results.length > 0 && (
              <div className="search-dropdown">
                {results.map((phone) => (
                  <div
                    key={phone.externalId || phone._id}
                    className="search-item"
                    onClick={() => {
                      if (phone.type === 'phone') {
                        router.push(`/phone/${phone.externalId || phone._id}`);
                      } else if (phone.type === 'upcoming') {
                        router.push(`/upcoming/${phone.externalId || phone._id}`);
                      }
                      setResults([]);
                      setQuery('');
                    }}>
                    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                      <Image src={phone.image} alt={phone.name} fill style={{ objectFit: 'contain' }} sizes="44px" />
                    </div>
                    <div>
                      <p className="phone-name">{phone.name}</p>
                      {phone.type === 'phone' && (
                        <span className="phone-price">
                          ₹{phone.price?.toLocaleString('en-IN') || '—'}
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
                    <Link href="/profile">My Profile</Link>
                    <Link href="/settings">Settings</Link>
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
                    <Link href="/login">Login</Link>
                    <Link href="/signup">Register</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="header-bottom">
        <NavMenu />
      </div>
    </header>
  );
};

export default Header;