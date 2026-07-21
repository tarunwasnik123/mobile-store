'use client';

import { useEffect, useState } from 'react';
import api from '../api/client';
import './AdminDashboard.css';
import Link from 'next/link';

export default function AdminDashboard() {
  const [phones, setPhones] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [news, setNews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [brandName, setBrandName] = useState('');
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [phoneTotal, setPhoneTotal] = useState(0);
  const [upcomingTotal, setUpcomingTotal] = useState(0);
  const [newsTotal, setNewsTotal] = useState(0);
  const [brandTotal, setBrandTotal] = useState(0);

  const [phoneSearch, setPhoneSearch] = useState('');
  const [upcomingSearch, setUpcomingSearch] = useState('');
  const [newsSearch, setNewsSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  const [phonePage, setPhonePage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [brandPage, setBrandPage] = useState(1);

  const itemsPerPage = 10;

  const fetchPhones = async () => {
    try {
      const res = await api.get(
        `/phones?page=${phonePage}&limit=${itemsPerPage}${
          phoneSearch ? `&q=${encodeURIComponent(phoneSearch)}` : ''
        }`,
      );
      setPhones(res?.results || res || []);
      setPhoneTotal(res?.total || (Array.isArray(res) ? res.length : 0));
      return res;
    } catch (err) {
      console.error('Failed to fetch phones:', err);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const res = await api.get(
        `/upcoming?page=${upcomingPage}&limit=${itemsPerPage}${
          upcomingSearch ? `&q=${encodeURIComponent(upcomingSearch)}` : ''
        }`,
      );
      setUpcoming(res?.results || res || []);
      setUpcomingTotal(res?.total || (Array.isArray(res) ? res.length : 0));
      return res;
    } catch (err) {
      console.error('Failed to fetch upcoming phones:', err);
    }
  };

  const fetchNews = async () => {
    try {
      const res = await api.get(
        `/news?page=${newsPage}&limit=${itemsPerPage}${
          newsSearch ? `&q=${encodeURIComponent(newsSearch)}` : ''
        }`,
      );
      setNews(res?.results || res || []);
      setNewsTotal(res?.total || (Array.isArray(res) ? res.length : 0));
      return res;
    } catch (err) {
      console.error('Failed to fetch news:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get(
        `/brands?page=${brandPage}&limit=${itemsPerPage}${
          brandSearch ? `&q=${encodeURIComponent(brandSearch)}` : ''
        }`,
      );
      setBrands(res?.results || res || []);
      setBrandTotal(res?.total || (Array.isArray(res) ? res.length : 0));
      return res;
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      await Promise.all([fetchPhones(), fetchUpcoming(), fetchNews(), fetchBrands()]);
      if (mounted) setLoading(false);
    };
    loadAll();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPhones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phonePage, phoneSearch]);

  useEffect(() => {
    fetchUpcoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingPage, upcomingSearch]);

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsPage, newsSearch]);

  useEffect(() => {
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandPage, brandSearch]);

  const getKeySpecs = (specs) => {
    const performance = specs?.Performance || {};
    const storage = specs?.Storage || {};
    const rearCamera = specs?.RearCamera || {};
    const frontCamera = specs?.FrontCamera || {};
    const battery = specs?.Battery || {};

    return [
      performance.RAM &&
        storage.InternalStorage &&
        `RAM: ${performance.RAM}, Storage: ${storage.InternalStorage}`,
      performance.Chipset && `Processor: ${performance.Chipset}`,
      rearCamera.Camera?.Primary && `Rear: ${rearCamera.Camera.Primary}`,
      frontCamera.Camera && `Front: ${frontCamera.Camera}`,
      battery.Capacity && `Battery: ${battery.Capacity}`,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const handleDeletePhone = async (id) => {
    if (!window.confirm('Delete this phone?')) return;
    try {
      await api.delete(`/phones/${id}`);
      const res = await fetchPhones();
      if (res && res.results && res.results.length === 0 && phonePage > 1) {
        setPhonePage((p) => Math.max(1, p - 1));
        await fetchPhones();
      }
    } catch (err) {
      console.error('Failed to delete phone:', err);
    }
  };

  const handleDeleteUpcoming = async (id) => {
    if (!window.confirm('Delete this upcoming phone?')) return;
    try {
      await api.delete(`/upcoming/${id}`);
      const res = await fetchUpcoming();
      if (res && res.results && res.results.length === 0 && upcomingPage > 1) {
        setUpcomingPage((p) => Math.max(1, p - 1));
        await fetchUpcoming();
      }
    } catch (err) {
      console.error('Failed to delete upcoming phone:', err);
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('Delete this news?')) return;
    try {
      await api.delete(`/news/${id}`);
      const nextCount = news.filter((item) => item._id !== id);

      setNews(nextCount);
      setNewsTotal((total) => Math.max(total - 1, 0));

      if (nextCount.length === 0 && newsPage > 1) {
        setNewsPage((page) => Math.max(page - 1, 1));
        return;
      }

      await fetchNews();
    } catch (err) {
      console.error('Failed to delete news:', err);
      alert(err.message || 'Failed to delete news');
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Delete this brand?')) return;
    try {
      await api.delete(`/brands/${id}`);
      const res = await fetchBrands();
      if (res && res.results && res.results.length === 0 && brandPage > 1) {
        setBrandPage((p) => Math.max(1, p - 1));
        await fetchBrands();
      }
    } catch (err) {
      console.error('Failed to delete brand:', err);
    }
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = brandName.trim();
    if (!trimmedName) return;

    const exists = brands.some(
      (b) => b.name.toLowerCase() === trimmedName.toLowerCase() && b._id !== editingBrandId,
    );
    if (exists) {
      alert('Brand already exists');
      return;
    }

    if (editingBrandId) {
      await api.put(`/brands/${editingBrandId}`, { name: trimmedName });
      await fetchBrands();
    } else {
      await api.post('/brands', { name: trimmedName });
      await fetchBrands();
    }

    setBrandName('');
    setEditingBrandId(null);
  };

  if (loading) return <div>Loading...</div>;

  const phoneTotalPages = Math.max(Math.ceil(phoneTotal / itemsPerPage), 1);
  const phonePageItems = phones;

  const upcomingTotalPages = Math.max(Math.ceil(upcomingTotal / itemsPerPage), 1);
  const upcomingPageItems = upcoming;

  const newsTotalPages = Math.max(Math.ceil(newsTotal / itemsPerPage), 1);
  const newsPageItems = news;

  const brandTotalPages = Math.max(Math.ceil(brandTotal / itemsPerPage), 1);
  const brandPageItems = brands;

  const Pagination = ({ current, total, onPrev, onNext }) => {
    if (total <= 1) return null;
    return (
      <div
        className="pagination"
        style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button disabled={current === 1} onClick={onPrev}>
          Previous
        </button>
        <span>
          Page {current} of {total}
        </span>
        <button disabled={current === total} onClick={onNext}>
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div style={{ marginBottom: 12 }}>
        <Link href="/admin/bulk-upload" className="btn-add" style={{ marginRight: 8 }}>
          Bulk Upload (JSON)
        </Link>
      </div>

      <section className="admin-section">
        <h3>Phones</h3>
        <Link href="/admin/add-phone" className="btn-add">
          Add Phone
        </Link>

        <input
          type="text"
          placeholder="Search phones..."
          value={phoneSearch}
          onChange={(e) => {
            setPhoneSearch(e.target.value);
            setPhonePage(1);
          }}
          style={{
            margin: '12px 0',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            width: '100%',
          }}
        />

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Key Specs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {phonePageItems.length ? (
              phonePageItems.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.brand.charAt(0).toUpperCase() + p.brand.slice(1)}</td>
                  <td>₹{p.price?.toLocaleString('en-IN')}</td>
                  <td>{getKeySpecs(p.specs)}</td>
                  <td>
                    <Link href={`/admin/add-phone?id=${p._id}`} className="btn-edit">
                      Edit
                    </Link>
                    <button onClick={() => handleDeletePhone(p._id)} className="btn-delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No phones found</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          current={phonePage}
          total={phoneTotalPages}
          onPrev={() => setPhonePage((p) => p - 1)}
          onNext={() => setPhonePage((p) => p + 1)}
        />
      </section>

      <section className="admin-section">
        <h3>Upcoming Phones</h3>
        <Link href="/admin/upcoming" className="btn-add">
          Add Upcoming Phone
        </Link>

        <input
          type="text"
          placeholder="Search upcoming phones..."
          value={upcomingSearch}
          onChange={(e) => {
            setUpcomingSearch(e.target.value);
            setUpcomingPage(1);
          }}
          style={{
            margin: '12px 0',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            width: '100%',
          }}
        />

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Brand</th>
              <th>Expected Price</th>
              <th>Release Date</th>
              <th>Key Specs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {upcomingPageItems.length ? (
              upcomingPageItems.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.brand.charAt(0).toUpperCase() + p.brand.slice(1)}</td>
                  <td>₹{p.price?.toLocaleString('en-IN') || '-'}</td>
                  <td>
                    {p.specs?.General?.ReleaseDate
                      ? new Date(p.specs.General.ReleaseDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td>{getKeySpecs(p.specs)}</td>
                  <td>
                    <Link href={`/admin/upcoming?id=${p._id}`} className="btn-edit">
                      Edit
                    </Link>
                    <button onClick={() => handleDeleteUpcoming(p._id)} className="btn-delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No upcoming phones found</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          current={upcomingPage}
          total={upcomingTotalPages}
          onPrev={() => setUpcomingPage((p) => p - 1)}
          onNext={() => setUpcomingPage((p) => p + 1)}
        />
      </section>

      <section className="admin-section">
        <h3>News</h3>
        <Link href="/admin/add-news" className="btn-add">
          Add News
        </Link>

        <input
          type="text"
          placeholder="Search news..."
          value={newsSearch}
          onChange={(e) => {
            setNewsSearch(e.target.value);
            setNewsPage(1);
          }}
          style={{
            margin: '12px 0',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            width: '100%',
          }}
        />

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {newsPageItems.length ? (
              newsPageItems.map((n) => (
                <tr key={n._id}>
                  <td>{n.title}</td>
                  <td>{new Date(n.date || n.createdAt).toLocaleDateString()}</td>
                  <td>{n.category}</td>
                  <td>
                    <Link href={`/admin/add-news?id=${n._id}`} className="btn-edit">
                      Edit
                    </Link>
                    <button onClick={() => handleDeleteNews(n._id)} className="btn-delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No news found</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          current={newsPage}
          total={newsTotalPages}
          onPrev={() => setNewsPage((p) => p - 1)}
          onNext={() => setNewsPage((p) => p + 1)}
        />
      </section>

      <section className="admin-section">
        <h3>Brands</h3>

        <input
          type="text"
          placeholder="Search brands..."
          value={brandSearch}
          onChange={(e) => {
            setBrandSearch(e.target.value);
            setBrandPage(1);
          }}
          style={{
            margin: '12px 0',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            width: '100%',
          }}
        />

        <form onSubmit={handleBrandSubmit} className="brand-form" style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Enter brand name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
          <button className="btn-add">{editingBrandId ? 'Update' : 'Add'}</button>
        </form>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brandPageItems.length ? (
              brandPageItems.map((b) => (
                <tr key={b._id}>
                  <td>{b.name.charAt(0).toUpperCase() + b.name.slice(1)}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setBrandName(b.name);
                        setEditingBrandId(b._id);
                      }}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteBrand(b._id)} className="btn-delete">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No brands found</td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          current={brandPage}
          total={brandTotalPages}
          onPrev={() => setBrandPage((p) => p - 1)}
          onNext={() => setBrandPage((p) => p + 1)}
        />
      </section>
    </div>
  );
}