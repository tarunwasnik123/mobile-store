'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../api/client';
import './AdminBulkUpload.css';

export default function AdminBulkUpload() {
  const [type, setType] = useState('phones');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await api.get('/admin/bulk-history?limit=10');
      if (res.ok) {
        setHistory(res.uploads || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }

  function handleFile(e) {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    if (!f) return setPreview(null);

    setPreview({
      fileName: f.name,
      fileSize: `${(f.size / 1024).toFixed(2)} KB`,
      info: 'Upload and do a dry-run to preview JSON content',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return alert('Select a ZIP file');

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await api.post(`/admin/bulk/${type}?dry=${dryRun}`, form);
      setResult(res);

      fetchHistory();

      if (!dryRun && res && res.ok) {
        setTimeout(() => router.push('/admin'), 1500);
      }
    } catch (err) {
      setResult({ error: err.message || 'Upload failed' });
    }
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-IN');
  }

  return (
    <div className="admin-bulk-upload">
      <h2>Admin Bulk Upload (ZIP)</h2>
      <p>
        Create a ZIP file with a JSON file and an <code>images/</code> folder.
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="phones">Phones</option>
            <option value="brands">Brands</option>
            <option value="news">News</option>
            <option value="upcoming">Upcoming Phones</option>
          </select>
        </label>

        <label>
          ZIP file
          <input type="file" accept=".zip,application/zip" onChange={handleFile} />
        </label>

        <label>
          Dry run (preview without inserting)
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
        </label>

        <button type="submit">Upload</button>
      </form>

      <div className="preview">
        <h3>File Info</h3>
        <pre>{preview ? JSON.stringify(preview, null, 2) : 'No file chosen'}</pre>
      </div>

      <div className="result">
        <h3>Result</h3>
        <pre>{result ? JSON.stringify(result, null, 2) : 'No result yet'}</pre>
      </div>

      <div className="upload-history">
        <h3>Recent Uploads</h3>
        {history.length === 0 ? (
          <p>No uploads yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Inserted</th>
                <th>Validated</th>
                <th>Errors</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((upload, idx) => (
                <tr key={idx} className={upload.success ? 'success' : 'error'}>
                  <td>{formatTime(upload.timestamp)}</td>
                  <td>{upload.type}</td>
                  <td>{upload.inserted}</td>
                  <td>{upload.validated}</td>
                  <td>{upload.totalErrors}</td>
                  <td>{upload.success ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="instructions">
        <h4>ZIP Structure Example:</h4>
        <pre>
          {`my-upload.zip
  ├── phones.json
  └── images/
      ├── iphone15.jpg
      ├── galaxy-s24.jpg
      └── pixel-9.jpg`}
        </pre>

        <h4>JSON Format Example (phones/upcoming):</h4>
        <pre>
          {`[
  {
    "name": "iPhone 15",
    "brand": "Apple",
    "price": 999,
    "images": ["iphone15-front.jpg", "iphone15-back.jpg", "iphone15-side.jpg"],
    "specs": {...}
  },
  {
    "name": "Google Pixel 8",
    "brand": "Google",
    "price": 69999,
    "image": "google_pixel_8",
    "specs": {...}
  }
]`}
        </pre>
        <p>
          <strong>Tip:</strong> for multiple images you can either pass
          <code> images[] </code> explicitly, or use
          <code> image: "google_pixel_8" </code> and keep files as
          <code> google_pixel_8-1.jpg, google_pixel_8-2.jpg </code> inside
          <code> images/ </code>.
        </p>

        <h4>JSON Format Example (news):</h4>
        <pre>
          {`[
  {
    "title": "New Phone Launch",
    "content": "...",
    "image": "launch-event.jpg"
  }
]`}
        </pre>

        <h4>JSON Format Example (brands - no images):</h4>
        <pre>
          {`[
  {
    "name": "Apple"
  },
  {
    "name": "Samsung"
  }
]`}
        </pre>
      </div>
    </div>
  );
}