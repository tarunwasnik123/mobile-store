'use client';

import { useState, useEffect } from 'react';
import './AdminAddNews.css';
import api from '../api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCreateBlockNote,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

export default function AdminAddNews() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [news, setNews] = useState({
    externalId: '',
    title: '',
    category: '',
    summary: '',
    rating: '',
    metaTitle: '',
    metaName: '',
    metaDescription: '',
    canonicalUrl: '',
    schemaType: 'NewsArticle',
    ogImage: '',
    twitterImage: '',
    imageAltText: '',
    content: '',
    image: '',
  });

  const [allNews, setAllNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [initialBlocks, setInitialBlocks] = useState(undefined);

  // No custom schema here — using BlockNote's built-in "heading" block
  // (level 1/2/3) so we avoid the BlockNoteSchema.create crash entirely.
  const editor = useCreateBlockNote({
    uploadFile: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/news/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.location || response.url;

      setTimeout(() => {
        const altText = prompt('Enter alt text for this image (for SEO & accessibility):');
        if (altText) {
          setTimeout(() => {
            const imgs = document.querySelectorAll(`.bn-container img[src="${url}"]`);
            imgs.forEach((img) => img.setAttribute('alt', altText));
          }, 300);
        }
      }, 100);

      return url;
    },
  });

  useEffect(() => {
    api.get('/news?limit=200').then((data) => {
      const items = data.results || data;
      setAllNews(items);
      const uniqueCategories = [...new Set(items.map((n) => n.category).filter(Boolean))].sort();
      setCategories(uniqueCategories);
    });
  }, []);

  useEffect(() => {
    if (editId) {
      api.get(`/news/${editId}`).then(async (data) => {
        setNews({ ...data, rating: data.rating ?? '' });
        setEditorContent(data.content || '');
        if (data?.image) {
          setImagePreview(data.image);
        }
        if (data?.content) {
          try {
            const blocks = await editor.tryParseHTMLToBlocks(data.content);
            setInitialBlocks(blocks);
            editor.replaceBlocks(editor.document, blocks);
          } catch (err) {
            console.error('Failed to parse existing content', err);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleEditorChange = async () => {
    const html = await editor.blocksToHTMLLossy(editor.document);
    setEditorContent(html);
  };

  const slugify = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setNews({ ...news, image: '' });
  };

  const handleChange = (e) => {
    setNews({ ...news, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const duplicateTitle =
      allNews.results?.some(
        (n) => n.title.toLowerCase() === news.title.trim().toLowerCase() && n._id !== editId,
      ) || false;
    if (duplicateTitle) {
      alert('News with this title already exists');
      return;
    }

    const duplicateSlug =
      news.externalId?.trim() &&
      (allNews.results?.some(
        (n) => n.externalId?.toLowerCase() === news.externalId.trim().toLowerCase() && n._id !== editId,
      ) || false);
    if (duplicateSlug) {
      alert('News with this slug already exists');
      return;
    }

    if (news.rating !== '' && news.rating !== null && news.rating !== undefined) {
      const ratingNum = Number(news.rating);
      if (Number.isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
        alert('Rating must be a number between 0 and 10');
        return;
      }
    }

    try {
      const finalHTML = await editor.blocksToHTMLLossy(editor.document);
      let dataToSend = { ...news, content: finalHTML };

      if (dataToSend.externalId) {
        dataToSend.externalId = slugify(dataToSend.externalId);
      }

      if (dataToSend.rating === '') {
        delete dataToSend.rating;
      } else {
        dataToSend.rating = Number(dataToSend.rating);
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        Object.keys(dataToSend).forEach((key) => {
          if (key !== 'image') {
            formData.append(key, dataToSend[key]);
          }
        });

        dataToSend = formData;
      }

      if (editId) {
        await api.put(`/news/${editId}`, dataToSend);
        alert('News updated successfully');
      } else {
        await api.post('/news', dataToSend);
        await api.get('/news?limit=200');
        alert('News added successfully');
      }
      router.push('/admin');
    } catch (err) {
      alert(err.message || 'Failed to save news');
    }
  };

  return (
    <div className="admin-form">
      <h2>{editId ? 'Edit News' : 'Add News'}</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" value={news.title} onChange={handleChange} placeholder="Title" required />
        <input
          name="externalId"
          value={news.externalId || ''}
          onChange={handleChange}
          placeholder="Custom slug (optional, spaces auto-convert to -)"
        />
        <input
          name="category"
          list="categoriesList"
          value={news.category}
          onChange={handleChange}
          placeholder="Type category name (news, leaks, reviews, gadgets, etc.)"
          required
        />
        <datalist id="categoriesList">
          {categories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
        <input name="summary" value={news.summary} onChange={handleChange} placeholder="Summary" />

        <label style={{ fontWeight: 600, fontSize: 14, marginTop: 8, display: 'block' }}>
          HandsetNews Rating (0 to 10)
        </label>
        <input
          name="rating"
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={news.rating}
          onChange={handleChange}
          placeholder="e.g. 8.7"
        />

        <hr />
        <h3 style={{ marginTop: '16px' }}>SEO Meta Fields</h3>
        <input
          name="metaTitle"
          value={news.metaTitle}
          onChange={handleChange}
          placeholder="Meta Title (for search results)"
        />
        <input
          name="metaName"
          value={news.metaName}
          onChange={handleChange}
          placeholder="Meta Keywords (comma-separated)"
        />
        <textarea
          name="metaDescription"
          value={news.metaDescription}
          onChange={handleChange}
          placeholder="Meta Description for SEO"
          rows="3"
        />
        <input
          name="canonicalUrl"
          value={news.canonicalUrl}
          onChange={handleChange}
          placeholder="Canonical URL (leave empty to auto-use current page URL)"
        />
        <label style={{ fontWeight: 600, fontSize: 14, marginTop: 8, display: 'block' }}>
          Schema Type
        </label>
        <select name="schemaType" value={news.schemaType} onChange={handleChange}>
          <option value="NewsArticle">Blog (NewsArticle)</option>
          <option value="Product">Mobile Listing (Product)</option>
          <option value="Review">Review</option>
          <option value="FAQPage">FAQ</option>
        </select>
        <input
          name="ogImage"
          value={news.ogImage}
          onChange={handleChange}
          placeholder="Open Graph Image URL (leave empty to use Featured Image)"
        />
        <input
          name="twitterImage"
          value={news.twitterImage}
          onChange={handleChange}
          placeholder="Twitter/X Image URL (leave empty to use Featured Image)"
        />
        <input
          name="imageAltText"
          value={news.imageAltText}
          onChange={handleChange}
          placeholder="Image Alt Text (accessibility & SEO)"
        />
        <input name="image" type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && (
          <div className="image-preview" style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove image"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 5,
              }}>
              ×
            </button>
            <img src={imagePreview} alt="Preview" />
          </div>
        )}
        <div className="editor-container">
          <label>Content</label>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', minHeight: '400px' }}>
            <BlockNoteView editor={editor} onChange={handleEditorChange} theme="light" slashMenu={false}>
              <SuggestionMenuController
                triggerCharacter="/"
                getItems={async (query) => {
                  const defaultItems = getDefaultReactSlashMenuItems(editor);

                  // These insert BlockNote's normal "heading" block at the
                  // requested level — no custom block type, no schema change.
                  // Font size is controlled purely via CSS (see AdminAddNews.css).
                  const customItems = [
                    {
                      title: 'Custom Heading 2',
                      onItemClick: () => {
                        editor.insertBlocks(
                          [{ type: 'heading', props: { level: 2 }, content: [] }],
                          editor.getTextCursorPosition().block,
                          'after',
                        );
                      },
                      aliases: ['h2', 'heading2'],
                      group: 'Headings',
                    },
                    {
                      title: 'Custom Heading 3',
                      onItemClick: () => {
                        editor.insertBlocks(
                          [{ type: 'heading', props: { level: 3 }, content: [] }],
                          editor.getTextCursorPosition().block,
                          'after',
                        );
                      },
                      aliases: ['h3', 'heading3'],
                      group: 'Headings',
                    },
                  ];

                  return [...defaultItems, ...customItems].filter((item) =>
                    item.title.toLowerCase().includes(query.toLowerCase()),
                  );
                }}
              />
            </BlockNoteView>
          </div>
        </div>
        <button type="submit">{editId ? 'Update' : 'Add'}</button>
      </form>
    </div>
  );
}