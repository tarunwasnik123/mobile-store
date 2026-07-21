'use client';

import { useState, useEffect, useRef } from 'react';
import './AdminAddNews.css';
import api from '../api/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminAddNews() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [news, setNews] = useState({
    externalId: '',
    title: '',
    category: '',
    summary: '',
    metaTitle: '',
    metaName: '',
    metaDescription: '',
    content: '',
    image: '',
  });

  const [allNews, setAllNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [tableRows, setTableRows] = useState('3');
  const [tableColumns, setTableColumns] = useState('3');
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const fileInputRef = useRef(null);

  function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await api.post('/news/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const quill = quillInstance.current;
          if (quill) {
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            quill.insertEmbed(index, 'image', response.location || response.url);
          }
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('Image upload failed');
        }
      }
    };
  }

  function linkHandler() {
    const range = quillInstance.current.getSelection();
    if (range == null || range.length === 0) return;

    const url = prompt('Enter the URL:');
    if (url) {
      let formattedUrl = url.trim();

      if (!formattedUrl.match(/^https?:\/\//i)) {
        if (formattedUrl.includes('.')) {
          formattedUrl = 'https://' + formattedUrl;
        } else {
          formattedUrl = url;
        }
      }

      quillInstance.current.format('link', formattedUrl);
    }
  }

  function insertTable() {
    const quill = quillInstance.current;
    if (!quill) return;

    const rows = parseInt(tableRows, 10);
    const columns = parseInt(tableColumns, 10);

    if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(columns) || columns < 1) {
      alert('Please enter valid row and column counts of at least 1.');
      return;
    }

    if (rows > 20 || columns > 20) {
      alert('Please use a maximum of 20 rows and 20 columns.');
      return;
    }

    const tableModule = quill.getModule('better-table');
    if (tableModule) {
      tableModule.insertTable(rows, columns);
    }
  }

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
      api.get(`/news/${editId}`).then((data) => {
        setNews(data);
        setEditorContent(data.content || '');
        if (data?.image) {
          setImagePreview(data.image);
        }
      });
    }
  }, [editId]);

  // Initialize Quill editor — dynamic import keeps this client-only, avoids SSR crash
  useEffect(() => {
    let mounted = true;

    async function initQuill() {
      const { default: Quill } = await import('quill');
      const { default: QuillBetterTable } = await import('quill-better-table');
      await import('quill/dist/quill.snow.css');

      if (!mounted || !editorRef.current || quillInstance.current) return;

      window.Quill = Quill;
      Quill.register({ 'modules/better-table': QuillBetterTable }, true);

      const toolbarOptions = [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link', 'image'],
        [{ align: [] }],
        ['clean'],
        ['code-block'],
      ];

      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: {
            container: toolbarOptions,
            handlers: {
              link: linkHandler,
              image: imageHandler,
            },
          },
          clipboard: { matchVisual: false },
          history: { delay: 1000, maxStack: 50, userOnly: false },
          keyboard: { bindings: QuillBetterTable.keyboardBindings },
          table: false,
          'better-table': {
            operationMenu: {
              items: {
                unmergeCells: { text: 'Unmerge cells' },
              },
              color: {
                colors: ['#ffffff', '#f7f7f7', '#d0ebff'],
                text: 'Cell colors',
              },
            },
          },
        },
        placeholder: 'Write your news content here...',
      });

      quillInstance.current.on('text-change', () => {
        const html = quillInstance.current.root.innerHTML;
        setEditorContent(html);
      });
    }

    initQuill();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (quillInstance.current && editorContent) {
      const currentContent = quillInstance.current.root.innerHTML;
      if (currentContent !== editorContent && editorContent.trim() !== '<p><br></p>') {
        quillInstance.current.clipboard.dangerouslyPasteHTML(editorContent);
      }
    }
  }, [editorContent]);

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
    if (fileInputRef && fileInputRef.current) {
      try {
        fileInputRef.current.value = '';
      } catch (e) {}
    }
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

    try {
      let dataToSend = { ...news, content: editorContent };

      if (dataToSend.externalId) {
        dataToSend.externalId = slugify(dataToSend.externalId);
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
        <input ref={fileInputRef} name="image" type="file" accept="image/*" onChange={handleImageChange} />
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
          <div className="editor-table-controls">
            <label>
              Rows
              <input
                type="number"
                min="1"
                max="20"
                value={tableRows}
                onChange={(e) => setTableRows(e.target.value)}
              />
            </label>
            <label>
              Columns
              <input
                type="number"
                min="1"
                max="20"
                value={tableColumns}
                onChange={(e) => setTableColumns(e.target.value)}
              />
            </label>
            <button type="button" className="table-button" onClick={insertTable}>
              Insert table
            </button>
          </div>
          <div ref={editorRef} style={{ height: '500px' }}></div>
        </div>
        <button type="submit">{editId ? 'Update' : 'Add'}</button>
      </form>
    </div>
  );
}