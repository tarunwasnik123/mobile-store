import { useEffect } from 'react';

function setMetaTag(name, content, attr = 'name') {
  if (typeof document === 'undefined') return;

  const selector = `${attr}="${name}"`;
  const existing = Array.from(document.head.querySelectorAll('meta')).find(
    (tag) => tag.getAttribute(attr) === name,
  );

  if (existing) {
    if (content) {
      existing.setAttribute('content', content);
    }
  } else if (content) {
    const meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}

export default function SEO({ title, description, keywords }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (title) {
      document.title = title;
      setMetaTag('title', title);
      setMetaTag('og:title', title, 'property');
      setMetaTag('twitter:title', title, 'name');
    }
    if (description) {
      setMetaTag('description', description);
      setMetaTag('og:description', description, 'property');
      setMetaTag('twitter:description', description, 'name');
      setMetaTag('twitter:card', 'summary_large_image', 'name');
    }
    if (keywords) {
      setMetaTag('keywords', keywords);
    }
  }, [title, description, keywords]);

  return null;
}
