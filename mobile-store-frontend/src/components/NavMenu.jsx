import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import './NavMenu.css';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { setBrands, setPrice } from '../store/filterSlice';

export default function NavMenu() {
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ---------- CLOSE ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  /* ---------- HANDLER: NAVIGATE AND APPLY FILTER ---------- */
  const handleBrandClick = (brand) => {
    dispatch(setBrands([brand])); // set single brand filter
    navigate(`/find?brand=${encodeURIComponent(brand)}`);
    setOpenMenu(null);
  };

  const handlePriceClick = (min, max) => {
    dispatch(setPrice([min, max]));
    navigate(`/find?minPrice=${min}&maxPrice=${max}`);
    setOpenMenu(null);
  };

  /* ---------- CLOSE ON OPTION CLICK ---------- */
  const closeMenu = () => {
    setOpenMenu(null);
  };

  return (
    <nav className="nav-menu" ref={menuRef}>
      {/* Mobiles */}
      <div className="nav-item">
        <button
          className="menu-btn"
          onClick={() =>
            setOpenMenu(openMenu === 'mobiles' ? null : 'mobiles')
          }>
          Mobiles & Tablets <KeyboardArrowDownIcon fontSize="small" />
        </button>

        {openMenu === 'mobiles' && (
          <div className="nav-dropdown">
            <button
              onClick={() => {
                navigate('/find');
                closeMenu();
              }}>
              All Mobiles
            </button>
            <button
              onClick={() => {
                navigate('/best');
                closeMenu();
              }}>
              Best Mobiles
            </button>
            <button
              onClick={() => {
                navigate('/latest');
                closeMenu();
              }}>
              Latest Mobiles
            </button>
            <button
              onClick={() => {
                navigate('/upcoming');
                closeMenu();
              }}>
              Upcoming Mobiles
            </button>
          </div>
        )}
      </div>

      <button
        className="nav-link"
        onClick={() => {
          closeMenu();
          navigate('/compare');
        }}>
        Compare
      </button>
      <button
        className="nav-link"
        onClick={() => {
          closeMenu();
          navigate('/news');
        }}>
        News & Reviews
      </button>

      {/* Brand */}
      <div className="nav-item">
        <button
          className="menu-btn"
          onClick={() => setOpenMenu(openMenu === 'brand' ? null : 'brand')}>
          By Brand <KeyboardArrowDownIcon fontSize="small" />
        </button>

        {openMenu === 'brand' && (
          <div className="nav-dropdown">
            <button onClick={() => handleBrandClick('Apple')}>Apple</button>
            <button onClick={() => handleBrandClick('Samsung')}>Samsung</button>
            <button onClick={() => handleBrandClick('OnePlus')}>OnePlus</button>
            <button onClick={() => handleBrandClick('Xiaomi')}>Xiaomi</button>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="nav-item">
        <button
          className="menu-btn"
          onClick={() => setOpenMenu(openMenu === 'price' ? null : 'price')}>
          By Price <KeyboardArrowDownIcon fontSize="small" />
        </button>

        {openMenu === 'price' && (
          <div className="nav-dropdown">
            <button onClick={() => handlePriceClick(0, 10000)}>
              Under ₹10,000
            </button>
            <button onClick={() => handlePriceClick(0, 20000)}>
              Under ₹20,000
            </button>
            <button onClick={() => handlePriceClick(0, 30000)}>
              Under ₹30,000
            </button>
            <button onClick={() => handlePriceClick(30001, 200000)}>
              Above ₹30,000
            </button>
          </div>
        )}
      </div>

      {/* Admin */}
      {user?.role === 'admin' && (
        <button
          className="nav-link admin-link"
          onClick={() => {
            closeMenu();
            navigate('/admin');
          }}>
          Admin
        </button>
      )}
    </nav>
  );
}
