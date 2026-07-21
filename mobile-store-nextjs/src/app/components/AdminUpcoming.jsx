'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useRouter, useSearchParams } from 'next/navigation';
import './AdminUpcoming.css';

export default function AdminUpcoming() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const dummyUpcoming = {
    name: 'Samsung Galaxy S25',
    brand: 'Samsung',
    price: 89999,
    image: '/assets/galaxy-s25.jpg',
    pros: ['Excellent camera system', 'High-refresh-rate display', 'Long software support'],
    cons: ['Expensive', 'Large size', 'Heavy weight'],
    faqs: [
      {
        question: 'When will the Samsung Galaxy S25 be released?',
        answer: 'The Samsung Galaxy S25 is expected to be released in March 2025.',
      },
      { question: 'Will it have 5G support?', answer: 'Yes, it supports 5G connectivity.' },
      {
        question: 'What is the camera setup?',
        answer: 'It features a triple camera setup with 200MP main, 50MP ultra-wide, and 12MP telephoto lenses.',
      },
      {
        question: 'How long will it receive software updates?',
        answer: 'It will receive up to 4 major Android version updates.',
      },
    ],
    specs: {
      General: {
        OperatingSystem: 'Android 15',
        CustomUI: 'One UI 7.0',
        LaunchDate: '2025-03-15',
        OSUpdate: 'Up to 4 major versions',
      },
      Performance: {
        Chipset: 'Snapdragon 8 Gen 4',
        CPU: 'Octa Core',
        GPU: 'Adreno 750',
        RAM: '12 GB',
        RAMType: 'LPDDR5X',
        Architecture: '64 bit',
        Fabrication: '3 nm',
        BootupTime: '12 seconds',
        AnTuTuScore: '1800000',
      },
      Storage: {
        InternalStorage: '256 GB',
        StorageType: 'UFS 4.0',
      },
      Display: {
        Type: 'Dynamic AMOLED 2X',
        Size: '6.8 inches',
        Resolution: '1440x3200',
        RefreshRate: '120 Hz',
        ScreenToBodyRatio: '89.9%',
        BezelLessDisplay: 'Yes',
        PixelDensity: '500 PPI',
        PeakBrightness: '2600 nits',
        HBMBrightness: '1750 nits',
        AspectRatio: '20:9',
      },
      RearCamera: {
        Camera: {
          Primary: '200 MP',
          Secondary: '50 MP',
          Tertiary: '12 MP',
        },
      },
      FrontCamera: {
        Camera: '32 MP',
      },
      Battery: {
        Capacity: '5200 mAh',
        QuickCharging: '65W',
        WirelessCharging: '25W',
        BatteryChargingTime: '35 minutes to 100%',
      },
      SoundAudio: {
        Loudspeakers: 'Stereo',
        HeadphoneConnection: 'USB Type-C',
        SoundTechnology: 'Dolby Atmos',
      },
      NetworkConnectivity: {
        SIMSlot: 'Dual SIM',
        SIMType: 'Nano SIM',
        WiFi: 'Wi-Fi 7',
        NetworkSupport: '5G, 4G LTE',
        VoLTE: 'Yes',
        Bluetooth: 'v5.4',
        GPS: 'GPS, GLONASS, BDS, Galileo',
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
    pros: [],
    cons: [],
    faqs: [
      { question: 'When will this phone be released?', answer: '' },
      { question: 'Will it have 5G support?', answer: '' },
      { question: 'What is the camera setup?', answer: '' },
      { question: 'How long will it receive updates?', answer: '' },
    ],
    specs: {},
  });

  const prosRef = useRef();
  const consRef = useRef();

  const [brands, setBrands] = useState([]);
  const [allUpcoming, setAllUpcoming] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [initialImageCount, setInitialImageCount] = useState(0);

  useEffect(() => {
    api.get('/brands').then((res) => setBrands(res?.results || res || []));
    api.get('/upcoming?limit=1000').then((res) => setAllUpcoming(res?.results || res || []));
  }, []);

  useEffect(() => {
    if (!editId) return;
    api.get(`/upcoming/${editId}`).then((data) => {
      if (data?.specs?.General?.ReleaseDate) {
        data.specs.General.ReleaseDate = data.specs.General.ReleaseDate.split('T')[0];
      }
      if (!data.faqs || data.faqs.length === 0) {
        data.faqs = [
          { question: 'When will this phone be released?', answer: '' },
          { question: 'Will it have 5G support?', answer: '' },
          { question: 'What is the camera setup?', answer: '' },
          { question: 'How long will it receive updates?', answer: '' },
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

  const handleChange = (e) => setPhone((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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

    const releaseDate = phone?.specs?.General?.ReleaseDate;
    if (releaseDate && new Date(releaseDate) < new Date()) {
      setIsSaving(false);
      alert('Release date must be in the future');
      return;
    }

    const list = Array.isArray(allUpcoming) ? allUpcoming : allUpcoming?.results || [];
    const duplicate = list.some(
      (p) =>
        p.name.toLowerCase() === phone.name.trim().toLowerCase() &&
        p.brand.toLowerCase() === phone.brand.trim().toLowerCase() &&
        p._id !== editId,
    );
    if (duplicate) {
      setIsSaving(false);
      alert('This upcoming phone already exists under the selected brand');
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

      if (editId) await api.put(`/upcoming/${editId}`, dataToSend);
      else {
        await api.post('/upcoming', dataToSend);
        await api.get('/upcoming?limit=1000');
      }

      alert(editId ? 'Upcoming phone updated successfully' : 'Upcoming phone added successfully');
      router.push('/admin/upcoming');
    } catch (err) {
      alert(err.message || 'Failed to save upcoming phone');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSpecsInputs = (specObj, path = []) =>
    Object.entries(specObj).map(([key, value]) => {
      const currentPath = [...path, key];
      const isReleaseDate = currentPath.join('.') === 'General.ReleaseDate';

      if (typeof value === 'object' && value !== null) {
        return (
          <fieldset key={currentPath.join('-')} className="spec-category">
            <legend>{key}</legend>
            {renderSpecsInputs(value, currentPath)}
          </fieldset>
        );
      }

      let currentValue = phone.specs;
      try {
        currentPath.forEach((p) => (currentValue = currentValue[p]));
      } catch {
        currentValue = '';
      }

      return (
        <div key={currentPath.join('-')} className="input-group">
          <label>{key}</label>
          <input
            type={isReleaseDate ? 'date' : 'text'}
            value={currentValue || ''}
            placeholder={value.toString()}
            onChange={(e) => handleSpecChange(currentPath, e.target.value)}
            required={isReleaseDate}
          />
        </div>
      );
    });

  return (
    <div className="admin-upcoming">
      <h2>{editId ? 'Edit Upcoming Phone' : 'Add Upcoming Phone'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Name</label>
          <input
            name="name"
            value={phone.name}
            placeholder={dummyUpcoming.name}
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
          <label>Expected Price</label>
          <input
            name="price"
            type="number"
            value={phone.price}
            placeholder={dummyUpcoming.price}
            onChange={handleChange}
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

        {renderSpecsInputs(dummyUpcoming.specs)}

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
          <label>Pros (comma-separated)</label>
          <textarea
            ref={prosRef}
            defaultValue={phone.pros.join(', ')}
            onBlur={(e) => handleArrayChange('pros', e.target.value)}
            placeholder="Excellent camera system, High-refresh-rate display, Long software support"
            rows={3}
          />
        </div>

        <div className="input-group">
          <label>Cons (comma-separated)</label>
          <textarea
            ref={consRef}
            defaultValue={phone.cons.join(', ')}
            onBlur={(e) => handleArrayChange('cons', e.target.value)}
            placeholder="Expensive, Large size, Heavy weight"
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
          {isSaving ? 'Saving...' : editId ? 'Update' : 'Add'}
        </button>
      </form>
    </div>
  );
}