const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    let err = text;
    try {
      err = JSON.parse(text);
    } catch {}
    const message = err.message || res.statusText || 'Request failed';
    const error = new Error(message);
    error.status = res.status;
    error.body = err;
    throw error;
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

export default {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => {
    const options = { method: 'POST' };
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
    return request(path, options);
  },
  put: (path, body) => {
    const options = { method: 'PUT' };
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
    return request(path, options);
  },
  delete: (path) => request(path, { method: 'DELETE' }),
};