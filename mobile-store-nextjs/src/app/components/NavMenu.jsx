'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import './NavMenu.css';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { setBrands, setPrice } from '../store/filterSlice';

const PRICE_OPTIONS = [
  { label: 'Under ₹10,000', min: 0, max: 10000 },
  { label: 'Under ₹20,000', min: 0, max: 20000 },
  { label: 'Under ₹30,000', min: 0, max: 30000 },
  { label: 'Above ₹30,000', min: 30001, max: 200000 },
];

const BRAND_OPTIONS = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi'];

const MOBILE_LINKS = [
  { label: 'All Mobiles', href: '/find' },
  { label: 'Best Mobiles', href: '/best' },
  { label: 'Latest Mobiles', href: '/latest' },
  { label: 'Upcoming Mobiles', href: '/upcoming' },
];

export default function NavMenu() {
  const [openMenu, setOpenMenu] = useState(null);
  // null = sirf left list dikhegi, 'price' / 'brand' = right panel bhi khulega
  const [activeSub, setActiveSub] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);
  const buttonRefs = useRef({});
  const { user } = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();

  // Server aur pehli client render me admin button nahi dikhta (hydration mismatch se bachne ke liye)
  useEffect(() => {
    setMounted(true);
  }, []);
  const isAdmin = mounted && user?.role === 'admin';

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
        setActiveSub(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const closeMenu = () => {
    setOpenMenu(null);
    setActiveSub(null);
  };

  const openDropdown = (menuName, buttonKey) => {
    if (openMenu === menuName) {
      closeMenu();
      return;
    }
    const btn = buttonRefs.current[buttonKey];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      // Right panel khulne par dropdown 560px chauda hota hai, isliye utni jagah bachake rakho
      const panelWidth = menuName === 'mobiles' ? 560 : 220;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8));
      setDropdownStyle({
        top: rect.bottom + 6,
        left,
      });
    }
    setActiveSub(null);
    setOpenMenu(menuName);
  };

  const handleBrandClick = (brand) => {
    dispatch(setBrands([brand]));
    router.push(`/find?brand=${encodeURIComponent(brand)}`);
    closeMenu();
  };

  const handlePriceClick = (min, max) => {
    dispatch(setPrice([min, max]));
    router.push(`/find?minPrice=${min}&maxPrice=${max}`);
    closeMenu();
  };

  return (
    <nav className="nav-menu" ref={menuRef}>
      {/* ===== Mobiles & Tablets (click par right panel khulta hai) ===== */}
      <div className="nav-item">
        <button
          className="menu-btn"
          ref={(el) => (buttonRefs.current['mobiles'] = el)}
          onClick={() => openDropdown('mobiles', 'mobiles')}>
          Mobiles & Tablets <KeyboardArrowDownIcon fontSize="small" />
        </button>

        {openMenu === 'mobiles' && (
          <div
            className={`nav-dropdown nav-mega ${activeSub ? 'nav-mega--open' : ''}`}
            style={dropdownStyle}>
            <div className="mega-left">
              <button
                className={`mega-item ${activeSub === 'price' ? 'mega-item--active' : ''}`}
                onClick={() => setActiveSub('price')}>
                <span>Best Phones by Price</span>
                <KeyboardArrowRightIcon fontSize="small" />
              </button>

              <button
                className={`mega-item ${activeSub === 'brand' ? 'mega-item--active' : ''}`}
                onClick={() => setActiveSub('brand')}>
                <span>Popular Brands</span>
                <KeyboardArrowRightIcon fontSize="small" />
              </button>

              {MOBILE_LINKS.map((link) => (
                <button
                  key={link.href}
                  className="mega-item"
                  onClick={() => {
                    router.push(link.href);
                    closeMenu();
                  }}>
                  <span>{link.label}</span>
                </button>
              ))}
            </div>

            {activeSub && (
              <div className="mega-right">
                {activeSub === 'price' &&
                  PRICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      className="mega-sub-item"
                      onClick={() => handlePriceClick(opt.min, opt.max)}>
                      {opt.label}
                    </button>
                  ))}

                {activeSub === 'brand' &&
                  BRAND_OPTIONS.map((brand) => (
                    <button
                      key={brand}
                      className="mega-sub-item"
                      onClick={() => handleBrandClick(brand)}>
                      {brand}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className="nav-link"
        onClick={() => {
          closeMenu();
          router.push('/compare');
        }}>
        Compare
      </button>

      <button
        className="nav-link"
        onClick={() => {
          closeMenu();
          router.push('/news');
        }}>
        News & Reviews
      </button>

      {/* ===== By Brand ===== */}
      <div className="nav-item">
        <button
          className="menu-btn"
          ref={(el) => (buttonRefs.current['brand'] = el)}
          onClick={() => openDropdown('brand', 'brand')}>
          By Brand <KeyboardArrowDownIcon fontSize="small" />
        </button>

        {openMenu === 'brand' && (
          <div className="nav-dropdown nav-simple" style={dropdownStyle}>
            {BRAND_OPTIONS.map((brand) => (
              <button key={brand} onClick={() => handleBrandClick(brand)}>
                {brand}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== By Price ===== */}
      <div className="nav-item">
        <button
          className="menu-btn"
          ref={(el) => (buttonRefs.current['price'] = el)}
          onClick={() => openDropdown('price', 'price')}>
          By Price <KeyboardArrowDownIcon fontSize="small" />
        </button>

        {openMenu === 'price' && (
          <div className="nav-dropdown nav-simple" style={dropdownStyle}>
            {PRICE_OPTIONS.map((opt) => (
              <button key={opt.label} onClick={() => handlePriceClick(opt.min, opt.max)}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <button
          className="nav-link admin-link"
          onClick={() => {
            closeMenu();
            router.push('/admin');
          }}>
          Admin
        </button>
      )}
    </nav>
  );
}