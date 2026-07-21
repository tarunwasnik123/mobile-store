'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import './AdminAddPhone.css';

export default function AdminAddPhone() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const dummyPhone = {
    name: 'Oppo Reno15',
    brand: 'Oppo',
    price: 45999,
    image: '/assets/reno15.jpg',
    pros: ['Excellent battery life', 'High-refresh-rate display', 'Good camera quality'],
    cons: ['Expensive', 'No wireless charging', 'Heavy weight'],
    faqs: [
      { question: 'Does this phone have 5G?', answer: 'Yes, it supports 5G connectivity.' },
      { question: 'Will I get a charger in the box?', answer: 'No, charger is not included in the box.' },
      { question: 'How is the camera quality?', answer: 'The camera quality is excellent with 200MP main sensor.' },
      { question: 'What is the Android version?', answer: 'It runs on Android 16.' },
    ],
    specs: {
      General: {
        OperatingSystem: 'Android 16',
        CustomUI: 'ColorOS',
        LaunchDate: '2024-08-15',
        OSUpdate: 'Up to 3 major versions',
      },
      Performance: {
        Chipset: 'MediaTek Dimensity 8450',
        CPU: 'Octa Core',
        GPU: 'Mali-G720 MC7',
        RAM: '12 GB',
        RAMType: 'LPDDR5X',
        Architecture: '64 bit',
        Fabrication: '4 nm',
        BootupTime: '15 seconds',
        AnTuTuScore: '950000',
      },
      Storage: {
        InternalStorage: '256 GB',
        StorageType: 'UFS 3.1',
      },
      Display: {
        Type: 'AMOLED',
        Size: '6.32 inches',
        Resolution: '1216x2640',
        RefreshRate: '120 Hz',
        ScreenToBodyRatio: '90%',
        BezelLessDisplay: 'Yes',
        PixelDensity: '460 PPI',
        PeakBrightness: '1400 nits',
        HBMBrightness: '1600 nits',
        AspectRatio: '20:9',
      },
      RearCamera: {
        Camera: {
          Primary: '200 MP',
          Secondary: '8 MP',
          Tertiary: '2 MP',
        },
      },
      FrontCamera: {
        Camera: '32 MP',
      },
      Battery: {
        Capacity: '6200 mAh',
        QuickCharging: '80W',
        WirelessCharging: '50W',
        BatteryChargingTime: '30 minutes to 100%',
      },
      SoundAudio: {
        Loudspeakers: 'Stereo',
        HeadphoneConnection: 'USB Type-C',
        SoundTechnology: 'Dolby Atmos',
      },
      NetworkConnectivity: {
        SIMSlot: 'Dual SIM',
        SIMType: 'Nano SIM',
        WiFi: 'Wi-Fi 6',
        NetworkSupport: '5G, 4G LTE',
        VoLTE: 'Yes',
        Bluetooth: 'v5.4',
        GPS: 'GPS, GLONASS, BDS',
        NFC: 'Yes',
      },
      Sensors: {
        Fingerprint: 'In-display',
        FingerprintSensorType: 'Optical',
        FingerprintSensorPosition: 'Under display',
        OtherSensors: ['Accelerometer', 'Gyroscope', 'Compass', 'Proximity'],
      },
    },
  };

  const [phone, setPhone] = useState({
    name: '',
    brand: '',
    price: '',
    image: '',
    images: [],
    metaTitle: '',
    metaName: '',
    metaDescription: '',
    canonicalUrl: '',
    schemaType: 'Product',
    ogImage: '',
    twitterImage: '',
    imageAltText: '',
    pros: [],
    cons: [],
    faqs: [
      { question: 'Does this phone have 5G?', answer: '' },
      { question: 'Will I get a charger in the box?', answer: '' },
      { question: 'How is the camera quality?', answer: '' },
      { question: 'What is the Android version?', answer: '' },
    ],
    specs: {},
  });

  const prosRef = useRef();
  const consRef = useRef();

  const [brands, setBrands] = useState([]);
  const [allPhones, setAllPhones] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [initialImageCount, setInitialImageCount] = useState(0);

  useEffect(() => {
    api.get('/brands').then((res) => setBrands(res?.results || res || []));
    api.get('/phones?limit=1000').then((res) => setAllPhones(res?.results || res || []));
  }, []);

  useEffect(() => {
    if (!editId) return;
    api.get(`/phones/${editId}`).then((data) => {
      if (data?.specs?.General?.ReleaseDate) {
        data.specs.General.ReleaseDate = data.specs.General.ReleaseDate.split('T')[0];
      }
      if (!data.faqs || data.faqs.length === 0) {
        data.faqs = [
          { question: 'Does this phone have 5G?', answer: '' },
          { question: 'Will I get a charger in the box?', answer: '' },
          { question: 'How is the camera quality?', answer: '' },
          { question: 'What is the Android version?', answer: '' },
        ];
      }
      setPhone(data);
      const existing =
        Array.isArray(data?.images) && data.images.length > 0
          ? data.images
          : data?.image
            ? [data.image]
            : [];
      setExistingImages(existing);
      setInitialImageCount(existing.length);
    });
  }, [editId]);

  useEffect(() => {
    if (prosRef.current) prosRef.current.value = phone.pros.join(', ');
  }, [phone.pros]);

  useEffect(() => {
    if (consRef.current) consRef.current.value = phone.cons.join(', ');
  }, [phone.cons]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => {
        if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [newImagePreviews]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImageFiles((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      const toRemove = prev[index];
      if (toRemove && toRemove.startsWith('blob:')) URL.revokeObjectURL(toRemove);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleChange = (e) => setPhone({ ...phone, [e.target.name]: e.target.value });

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map((s) => s.trim()).filter(Boolean);
    setPhone({ ...phone, [field]: array });
  };

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...phone.faqs];
    if (!newFaqs[index]) newFaqs[index] = { question: '', answer: '' };
    newFaqs[index][field] = value;
    setPhone({ ...phone, faqs: newFaqs });
  };

  const addFaq = () => {
    setPhone({ ...phone, faqs: [...phone.faqs, { question: '', answer: '' }] });
  };

  const removeFaq = (index) => {
    setPhone({ ...phone, faqs: phone.faqs.filter((_, i) => i !== index) });
  };

  const handleSpecChange = (path, value) => {
    setPhone((prev) => {
      const newSpecs = { ...prev.specs };
      let current = newSpecs;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return { ...prev, specs: newSpecs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const list = Array.isArray(allPhones) ? allPhones : allPhones?.results || [];
    const duplicate = list.some(
      (p) =>
        p.name.toLowerCase() === phone.name.trim().toLowerCase() &&
        p.brand.toLowerCase() === phone.brand.trim().toLowerCase() &&
        p._id !== editId,
    );
    if (duplicate) {
      setIsSaving(false);
      alert('This phone already exists under the selected brand');
      return;
    }

    const keptImages = existingImages.map((x) => String(x).trim()).filter(Boolean);

    try {
      let dataToSend = {
        ...phone,
        images: keptImages,
        image: keptImages[0] || null,
      };

      if (editId) {
        if (newImageFiles.length > 0) {
          const formData = new FormData();
          newImageFiles.forEach((file) => formData.append('images', file));
          formData.append('images', JSON.stringify(keptImages));
          formData.append('replaceImages', 'true');
          Object.keys(phone).forEach((key) => {
            if (key !== 'image' && key !== 'images') {
              if (typeof phone[key] === 'object') formData.append(key, JSON.stringify(phone[key]));
              else formData.append(key, phone[key]);
            }
          });
          dataToSend = formData;
        } else if (keptImages.length !== initialImageCount) {
          dataToSend = { ...dataToSend, replaceImages: true };
        }
      } else if (newImageFiles.length > 0) {
        const formData = new FormData();
        newImageFiles.forEach((file) => formData.append('images', file));
        Object.keys(phone).forEach((key) => {
          if (key !== 'image' && key !== 'images') {
            if (typeof phone[key] === 'object') formData.append(key, JSON.stringify(phone[key]));
            else formData.append(key, phone[key]);
          }
        });
        dataToSend = formData;
      }

      if (editId) await api.put(`/phones/${editId}`, dataToSend);
      else {
        await api.post('/phones', dataToSend);
        await api.get('/phones?limit=1000');
      }

      alert(editId ? 'Phone updated successfully' : 'Phone added successfully');
      router.push('/admin');
    } catch (err) {
      alert(err.message || 'Failed to save phone');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSpecsInputs = (specObj, path = []) =>
    Object.entries(specObj).map(([key, value]) => {
      const currentPath = [...path, key];
      const isReleaseDate = currentPath.join('.') === 'General.ReleaseDate';

      if (typeof value === 'object' && value !== null) {
        const isExpanded = expandedSections[currentPath.join('-')] ?? true;
        return (
          <fieldset key={currentPath.join('-')} className="spec-category">
            <legend onClick={() => toggleSection(currentPath.join('-'))}>
              {key} {isExpanded ? '▲' : '▼'}
            </legend>
            {isExpanded && renderSpecsInputs(value, currentPath)}
          </fieldset>
        );
      }

      let phoneValue = phone.specs;
      try {
        currentPath.forEach((p) => (phoneValue = phoneValue[p]));
      } catch {
        phoneValue = '';
      }

      return (
        <div key={currentPath.join('-')} className="input-group">
          <label>{key}</label>
          <input
            type={isReleaseDate ? 'date' : 'text'}
            value={phoneValue || ''}
            placeholder={value.toString()}
            onChange={(e) => handleSpecChange(currentPath, e.target.value)}
          />
        </div>
      );
    });

  return (
    <div className="admin-form-wrapper">
      <div className="admin-form">
        <h2>{editId ? 'Edit Phone' : 'Add Phone'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Name</label>
            <input
              name="name"
              value={phone.name}
              placeholder={dummyPhone.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Brand</label>
            <select name="brand" value={phone.brand} onChange={handleChange} required>
              <option value="">Select Brand</option>
              {brands.map((b) => (
                <option key={b._id} value={b.name}>
                  {b.name.charAt(0).toUpperCase() + b.name.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Price</label>
            <input
              name="price"
              type="number"
              value={phone.price}
              placeholder={dummyPhone.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Images</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} />

            {existingImages.length > 0 && (
              <>
                <label>Existing Images (click × to remove)</label>
                <div className="image-preview">
                  {existingImages.map((src, idx) => (
                    <div key={`${src}-${idx}`} className="image-thumb-wrap">
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeExistingImage(idx)}
                        aria-label="Remove image">
                        ×
                      </button>
                      <img src={src} alt={`Existing ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {newImagePreviews.length > 0 && (
              <>
                <label>New Images (click × to remove)</label>
                <div className="image-preview">
                  {newImagePreviews.map((src, idx) => (
                    <div key={`${src}-${idx}`} className="image-thumb-wrap">
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeNewImage(idx)}
                        aria-label="Remove image">
                        ×
                      </button>
                      <img src={src} alt={`New ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {renderSpecsInputs(dummyPhone.specs)}

          <hr style={{ margin: '20px 0' }} />
          <h3>SEO Meta Fields</h3>
          <div className="input-group">
            <label>Meta Title</label>
            <input
              name="metaTitle"
              value={phone.metaTitle}
              onChange={handleChange}
              placeholder="Meta Title (for search results)"
            />
          </div>

          <div className="input-group">
            <label>Meta Keywords</label>
            <input
              name="metaName"
              value={phone.metaName}
              onChange={handleChange}
              placeholder="Meta Keywords (comma-separated)"
            />
          </div>

          <div className="input-group">
            <label>Meta Description</label>
            <textarea
              name="metaDescription"
              value={phone.metaDescription}
              onChange={handleChange}
              placeholder="Meta Description for SEO"
              rows={3}
            />
          </div>

          <div className="input-group">
            <label>Canonical URL</label>
            <input
              name="canonicalUrl"
              value={phone.canonicalUrl}
              onChange={handleChange}
              placeholder="Leave empty to auto-use current page URL"
            />
          </div>

          <div className="input-group">
            <label>Schema Type</label>
            <select name="schemaType" value={phone.schemaType} onChange={handleChange}>
              <option value="Product">Mobile Listing (Product)</option>
              <option value="NewsArticle">Blog (NewsArticle)</option>
              <option value="Review">Review</option>
              <option value="FAQPage">FAQ</option>
            </select>
          </div>

          <div className="input-group">
            <label>Open Graph Image URL</label>
            <input
              name="ogImage"
              value={phone.ogImage}
              onChange={handleChange}
              placeholder="Leave empty to use Featured Image"
            />
          </div>

          <div className="input-group">
            <label>Twitter/X Image URL</label>
            <input
              name="twitterImage"
              value={phone.twitterImage}
              onChange={handleChange}
              placeholder="Leave empty to use Featured Image"
            />
          </div>

          <div className="input-group">
            <label>Image Alt Text</label>
            <input
              name="imageAltText"
              value={phone.imageAltText}
              onChange={handleChange}
              placeholder="Describe the image for accessibility & SEO"
            />
          </div>

          <div className="input-group">
            <label>Pros (comma-separated)</label>
            <textarea
              ref={prosRef}
              defaultValue={phone.pros.join(', ')}
              onBlur={(e) => handleArrayChange('pros', e.target.value)}
              placeholder="Excellent battery life, High-refresh-rate display, Good camera quality"
              rows={3}
            />
          </div>

          <div className="input-group">
            <label>Cons (comma-separated)</label>
            <textarea
              ref={consRef}
              defaultValue={phone.cons.join(', ')}
              onBlur={(e) => handleArrayChange('cons', e.target.value)}
              placeholder="Expensive, No wireless charging, Heavy weight"
              rows={3}
            />
          </div>

          <div className="input-group">
            <label>Frequently Asked Questions</label>
            {phone.faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                />
                <textarea
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                  rows={2}
                />
                <button type="button" onClick={() => removeFaq(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addFaq}>
              Add FAQ
            </button>
          </div>

          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : editId ? 'Update Phone' : 'Add Phone'}
          </button>
        </form>
      </div>
    </div>
  );
}