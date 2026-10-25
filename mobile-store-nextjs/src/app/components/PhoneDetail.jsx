'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import MemoryIcon from '@mui/icons-material/Memory';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import StorageIcon from '@mui/icons-material/Storage';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../api/client';
import './PhoneDetail.css';
import './PhoneDetailExtras.css';
import './PhoneColors.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

const CAMERA_NAMES = ['Primary', 'Secondary', 'Tertiary', 'Quaternary'];

export default function PhoneDetail({ initialPhone = null }) {
  const { id } = useParams();
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(!initialPhone);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const [activeSpecTab, setActiveSpecTab] = useState('General');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef(null);

  useEffect(() => {
    if (initialPhone) return; // server se already mil chuka, dobara fetch mat kar
    let mounted = true;
    api
      .get(`/phones/${id}`)
      .then((res) => {
        if (mounted) setPhone(res.data || res);
      })
      .catch(() => {
        if (mounted) setError('Failed to load phone details');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, initialPhone]);

  useEffect(() => {
    setActiveImageIndex(0);
    setGalleryImageIndex(0);
    setIsGalleryOpen(false);
    setActiveSpecTab('General');
    setSummaryOpen(false);
    setSelectedColor(0);
    setColorOpen(false);
  }, [phone?._id]);

  useEffect(() => {
    if (!isGalleryOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isGalleryOpen]);

  // Colors dropdown: bahar click ya Escape dabane par band ho jaye
  useEffect(() => {
    if (!colorOpen) return;
    const onDown = (e) => {
      if (colorRef.current && !colorRef.current.contains(e.target)) setColorOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setColorOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [colorOpen]);

  if (loading)
    return (
      <div className="pd-state">
        <div className="pd-state-spinner" />
        <p>Loading device details...</p>
      </div>
    );

  if (error)
    return (
      <div className="pd-state pd-state--error">
        <p>{error}</p>
        <Link href="/find" className="pd-back-link">
          ← Back to finder
        </Link>
      </div>
    );

  if (!phone)
    return (
      <div className="pd-state">
        <p>Phone not found.</p>
        <Link href="/find" className="pd-back-link">
          ← Back to finder
        </Link>
      </div>
    );

  const specs = phone.specs || {};
  const sections = {
    General: specs.General || {},
    Performance: specs.Performance || {},
    Storage: specs.Storage || {},
    Design: specs.Design || {},
    Display: specs.Display || {},
    Camera: specs.RearCamera || {},
    Battery: specs.Battery || {},
    Multimedia: specs.SoundAudio || {},
    Network: specs.NetworkConnectivity || {},
    Sensors: specs.Sensors || {},
  };

  const specRows = {
    General: [
      ['Operating System', sections.General.OperatingSystem],
      ['Custom UI', sections.General.CustomUI],
      [
        'Launch Date',
        sections.General.LaunchDate
          ? new Date(sections.General.LaunchDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : null,
      ],
      ['OS Update', sections.General.OSUpdate],
      ['Security Updates', sections.General.SecurityUpdates],
    ],
    Performance: [
      ['Chipset', sections.Performance.Chipset],
      ['CPU', sections.Performance.CPU],
      ['GPU', sections.Performance.GPU],
      ['RAM', sections.Performance.RAM],
      ['RAM Type', sections.Performance.RAMType],
      ['Architecture', sections.Performance.Architecture],
      ['Fabrication', sections.Performance.Fabrication],
      ['AnTuTu Score', sections.Performance.AnTuTuScore],
      ['Bootup Time', sections.Performance.BootupTime],
    ],
    Storage: [
      ['Internal Storage', sections.Storage.InternalStorage],
      ['Storage Type', sections.Storage.StorageType],
    ],
    Display: [
      ['Type', sections.Display.Type],
      ['Size', sections.Display.Size],
      ['Resolution', sections.Display.Resolution],
      ['Refresh Rate', sections.Display.RefreshRate],
      ['Screen-to-Body Ratio', sections.Display.ScreenToBodyRatio],
      ['Pixel Density', sections.Display.PixelDensity],
      ['Peak Brightness', sections.Display.PeakBrightness],
      ['Aspect Ratio', sections.Display.AspectRatio],
    ],
    Design: [
      ['Height', sections.Design.Height],
      ['Width', sections.Design.Width],
      ['Thickness', sections.Design.Thickness],
      ['Weight', sections.Design.Weight],
      ['Build Material', sections.Design.BuildMaterial],
      ['Water Resistance', sections.Design.WaterResistance],
      ['Ruggedness', sections.Design.Ruggedness],
    ],
    Camera: [
      ['Primary', sections.Camera.Camera?.Primary],
      ['Secondary', sections.Camera.Camera?.Secondary],
      ['Tertiary', sections.Camera.Camera?.Tertiary],
      ['Quaternary', sections.Camera.Camera?.Quaternary],
      ['Front Camera', (specs.FrontCamera || {}).Camera],
    ],
    Battery: [
      ['Capacity', sections.Battery.Capacity],
      ['Battery Type', sections.Battery.BatteryType],
      ['Quick Charging', sections.Battery.QuickCharging],
      ['Wireless Charging', sections.Battery.WirelessCharging],
      ['Reverse Charging', sections.Battery.ReverseCharging],
      ['Charging Time', sections.Battery.BatteryChargingTime],
    ],
    Multimedia: [
      ['Loudspeakers', sections.Multimedia.Loudspeakers],
      ['Headphone', sections.Multimedia.HeadphoneConnection],
      ['Technology', sections.Multimedia.SoundTechnology],
    ],
    Network: [
      ['SIM Slot', sections.Network.SIMSlot],
      ['SIM Type', sections.Network.SIMType],
      ['Wi-Fi', sections.Network.WiFi],
      ['Network Support', sections.Network.NetworkSupport],
      ['VoLTE', sections.Network.VoLTE],
      ['Bluetooth', sections.Network.Bluetooth],
      ['GPS', sections.Network.GPS],
      ['NFC', sections.Network.NFC],
    ],
    Sensors: [
      ['Fingerprint', sections.Sensors.Fingerprint],
      ['Sensor Type', sections.Sensors.FingerprintSensorType],
      ['Position', sections.Sensors.FingerprintSensorPosition],
      [
        'Other Sensors',
        Array.isArray(sections.Sensors.OtherSensors)
          ? sections.Sensors.OtherSensors.join(', ')
          : sections.Sensors.OtherSensors,
      ],
    ],
  };

  // Design tab tabhi dikhega jab uska koi data ho
  const tabNames = Object.keys(specRows).filter(
    (tab) => tab !== 'Design' || specRows.Design.some(([, v]) => v),
  );
  const currentTab = tabNames.includes(activeSpecTab) ? activeSpecTab : tabNames[0];

  // ===== Rear camera table (sirf wahi rows jinme data hai) =====
  const cameraRows = CAMERA_NAMES.map((name) => {
    const d = sections.Camera.Details?.[name] || {};
    return {
      name,
      mp: sections.Camera.Camera?.[name],
      lens: d.LensFeatures,
      aperture: d.Aperture,
      zoom: d.Zoom,
      focal: d.FocalLength,
    };
  }).filter((r) => r.mp || r.lens || r.aperture || r.zoom || r.focal);

  // Jis column me kisi bhi row ka data nahi, wo column nahi dikhega
  const cameraColumns = [
    { key: 'mp', label: 'MP' },
    { key: 'lens', label: 'Lens Features' },
    { key: 'aperture', label: 'Aperture' },
    { key: 'zoom', label: 'Zoom' },
    { key: 'focal', label: 'Focal Length' },
  ].filter((c) => cameraRows.some((r) => r[c.key]));

  const hasCameraDetails = cameraRows.some((r) => r.lens || r.aperture || r.zoom || r.focal);
  const showCameraTable = currentTab === 'Camera' && hasCameraDetails;

  // Camera table dikh rahi ho to uske neeche sirf Front Camera ki row
  const rowsForTab = showCameraTable
    ? specRows.Camera.filter(([label]) => label === 'Front Camera')
    : specRows[currentTab];
  const visibleRows = rowsForTab.filter(([, v]) => v);

  // ===== Key Highlights =====
  const keyHighlights = [
    ['Processor', sections.Performance.Chipset],
    ['Display', sections.Display.Size],
    ['Battery', sections.Battery.Capacity],
    ['Rear Camera', sections.Camera.Camera?.Primary],
    ['Front Camera', (specs.FrontCamera || {}).Camera],
    [
      'RAM/Storage',
      [sections.Performance.RAM, sections.Storage.InternalStorage].filter(Boolean).join(' / '),
    ],
  ].filter(([, v]) => v);

  // ===== Images =====
  const imageList = (
    Array.isArray(phone.images) && phone.images.length > 0
      ? phone.images
      : phone.image
        ? [phone.image]
        : []
  ).filter(Boolean);
  const activeImage = imageList[activeImageIndex] || phone.image || null;

  // ===== Rating =====
  const ratingNumber =
    phone.rating === null || phone.rating === undefined || phone.rating === ''
      ? null
      : Number(phone.rating);
  const hasRating = ratingNumber !== null && !Number.isNaN(ratingNumber) && ratingNumber > 0;
  const ratingValue = hasRating ? Math.min(5, ratingNumber) : 0;

  // ===== Colors =====
  const colorList = Array.isArray(phone.colors)
    ? phone.colors.map((c) => String(c).trim()).filter(Boolean)
    : [];
  const activeColorName = colorList[selectedColor] || colorList[0];

  const keySpecs = [
    { label: 'Chipset', Icon: MemoryIcon, value: sections.Performance.Chipset },
    {
      label: 'Display',
      Icon: SmartphoneIcon,
      value: `${sections.Display.Size || ''} ${sections.Display.Type || ''}`.trim(),
    },
    {
      label: 'RAM',
      Icon: StorageIcon,
      value: `${sections.Performance.RAM || ''} / ${sections.Storage.InternalStorage || ''}`.trim(),
    },
    { label: 'Battery', Icon: BatteryChargingFullIcon, value: sections.Battery.Capacity },
    { label: 'Camera', Icon: CameraAltIcon, value: sections.Camera.Camera?.Primary },
    { label: 'OS', Icon: SettingsIcon, value: sections.General.OperatingSystem },
  ];

  const phoneId = phone.externalId || phone._id;
  const pageUrl = phone.canonicalUrl || `${SITE_URL}/phone/${phoneId}`;

  // ===== Summary =====
  // Agar phone me `summary` ya `description` field aaye to wahi dikhega,
  // warna existing specs se apne aap ban jayegi.
  const buildSummary = () => {
    if (phone.summary) return String(phone.summary);
    if (phone.description) return String(phone.description);

    const perf = sections.Performance;
    const stor = sections.Storage;
    const disp = sections.Display;
    const batt = sections.Battery;
    const gen = sections.General;
    const frontCam = (specs.FrontCamera || {}).Camera;
    const parts = [];

    if (phone.price) {
      parts.push(`${phone.name} is priced at ₹${Number(phone.price).toLocaleString('en-IN')} in India.`);
    }

    const mem = [
      perf.RAM && `${perf.RAM} RAM`,
      stor.InternalStorage && `${stor.InternalStorage} storage`,
    ].filter(Boolean);
    if (perf.Chipset) {
      let s = `It is powered by the ${perf.Chipset}`;
      if (mem.length) s += ` with ${mem.join(' and ')}`;
      parts.push(`${s}.`);
    } else if (mem.length) {
      parts.push(`It comes with ${mem.join(' and ')}.`);
    }

    const dispBits = [disp.Size, disp.Type].filter(Boolean).join(' ');
    if (dispBits) {
      let s = `The phone features a ${dispBits} display`;
      if (disp.RefreshRate) s += ` with ${disp.RefreshRate} refresh rate`;
      parts.push(`${s}.`);
    }

    const rear = CAMERA_NAMES.map((n) => sections.Camera.Camera?.[n]).filter(Boolean);
    const camBits = [];
    if (rear.length) camBits.push(`a ${rear.join(' + ')} rear camera setup`);
    if (frontCam) camBits.push(`a ${frontCam} front camera`);
    if (camBits.length) parts.push(`For photography, it offers ${camBits.join(' and ')}.`);

    if (batt.Capacity) {
      let s = `It packs a ${batt.Capacity} battery`;
      if (batt.QuickCharging) s += ` with ${batt.QuickCharging} fast charging`;
      parts.push(`${s}.`);
    }

    if (gen.OperatingSystem) {
      let s = `It runs on ${gen.OperatingSystem}`;
      if (gen.CustomUI) s += ` with ${gen.CustomUI}`;
      parts.push(`${s}.`);
    }

    return parts.join(' ');
  };

  const summaryText = buildSummary();
  const summaryIsLong = summaryText.length > 110;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': phone.schemaType || 'Product',
    name: phone.name,
    image: imageList.length > 0 ? imageList : undefined,
    brand: {
      '@type': 'Brand',
      name: phone.brand,
    },
    description: phone.metaDescription || undefined,
    offers: phone.price
      ? {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: phone.price,
          availability: 'https://schema.org/InStock',
          url: pageUrl,
        }
      : undefined,
  };

  const faqSchema =
    phone.faqs?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: phone.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  const galleryModal =
    isGalleryOpen && imageList.length > 0 && typeof document !== 'undefined'
      ? createPortal(
          <div className="pd-gallery-backdrop" onClick={() => setIsGalleryOpen(false)}>
            <div className="pd-gallery-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pd-gallery-header">
                <span>{phone.name}</span>
                <button className="pd-gallery-close" onClick={() => setIsGalleryOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="pd-gallery-main">
                {galleryImageIndex > 0 && (
                  <button
                    className="pd-gallery-arrow pd-gallery-arrow--left"
                    onClick={() => setGalleryImageIndex((i) => i - 1)}>
                    ‹
                  </button>
                )}
                <Image
                  src={imageList[galleryImageIndex]}
                  alt={phone.imageAltText || phone.name}
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="780px"
                />
                {galleryImageIndex < imageList.length - 1 && (
                  <button
                    className="pd-gallery-arrow pd-gallery-arrow--right"
                    onClick={() => setGalleryImageIndex((i) => i + 1)}>
                    ›
                  </button>
                )}
              </div>
              <div className="pd-gallery-thumbs">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    className={`pd-gallery-thumb ${idx === galleryImageIndex ? 'active' : ''}`}
                    onClick={() => setGalleryImageIndex(idx)}
                    style={{ position: 'relative' }}>
                    <Image src={img} alt={`${phone.name} ${idx + 1}`} fill style={{ objectFit: 'contain' }} sizes="64px" />
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="pd-page pd-page--phone">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* ===== Summary: menu ke neeche, hero se pehle ===== */}
      {summaryText && (
        <section className="pd-section pd-summary">
          <div className="pd-summary-head">
            <h2 className="pd-summary-title">{phone.name}</h2>
          </div>

          <div className={`pd-summary-body ${summaryOpen ? 'open' : ''}`}>
            <p className="pd-summary-text">{summaryText}</p>
            {summaryIsLong && (
              <button
                type="button"
                className="pd-summary-toggle"
                onClick={() => setSummaryOpen((o) => !o)}>
                {summaryOpen ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="pd-hero">
        <div className="pd-hero-image-col">
          <div className="pd-image-stage">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={phone.imageAltText || phone.name}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 900px) 100vw, 380px"
                priority
              />
            ) : (
              <div className="pd-image-placeholder">No image available</div>
            )}
            {imageList.length > 1 && activeImageIndex > 0 && (
              <button
                className="pd-img-arrow pd-img-arrow--left"
                onClick={() => setActiveImageIndex((i) => i - 1)}>
                ‹
              </button>
            )}
            {imageList.length > 1 && activeImageIndex < imageList.length - 1 && (
              <button
                className="pd-img-arrow pd-img-arrow--right"
                onClick={() => setActiveImageIndex((i) => i + 1)}>
                ›
              </button>
            )}
          </div>

          {imageList.length > 1 && (
            <div className="pd-thumbstrip">
              {imageList.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  className={`pd-thumbstrip-btn ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{ position: 'relative' }}>
                  <Image src={img} alt="" fill style={{ objectFit: 'contain' }} sizes="56px" />
                </button>
              ))}
            </div>
          )}

          {imageList.length > 0 && (
            <button
              className="pd-gallery-trigger"
              onClick={() => {
                setGalleryImageIndex(activeImageIndex);
                setIsGalleryOpen(true);
              }}>
              View all {imageList.length} photos →
            </button>
          )}
        </div>

        <div className="pd-hero-info-col">
          <p className="pd-brand-label">{phone.brand || 'Smartphone'}</p>
          <h1 className="pd-title">{phone.name}</h1>

          <div className="pd-price-row">
            <div className="pd-price-block">
              {phone.price && <span className="pd-price-label">Expected Price</span>}
              <span className="pd-price">
                {phone.price ? `₹${Number(phone.price).toLocaleString('en-IN')}` : 'Price TBA'}
              </span>
            </div>

            {hasRating && (
              <div className="pd-rating" aria-label={`Rating ${ratingValue.toFixed(1)} out of 5`}>
                <span className="pd-rating-value">
                  {ratingValue.toFixed(1)}
                  <small>/5</small>
                </span>
                <span className="pd-stars" aria-hidden="true">
                  <span className="pd-stars-base">★★★★★</span>
                  <span className="pd-stars-fill" style={{ width: `${(ratingValue / 5) * 100}%` }}>
                    ★★★★★
                  </span>
                </span>
              </div>
            )}
          </div>

          {colorList.length > 0 && (
            <div className="pd-colors" ref={colorRef}>
              <span className="pd-colors-label">Colors</span>
              <button
                type="button"
                className={`pd-colors-select ${colorOpen ? 'open' : ''}`}
                onClick={() => setColorOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={colorOpen}>
                <span>{activeColorName}</span>
                <span className="pd-colors-chevron" aria-hidden="true" />
              </button>

              {colorOpen && (
                <ul className="pd-colors-menu" role="listbox">
                  {colorList.map((color, i) => (
                    <li key={`${color}-${i}`} role="option" aria-selected={i === selectedColor}>
                      <button
                        type="button"
                        className={`pd-colors-option ${i === selectedColor ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedColor(i);
                          setColorOpen(false);
                        }}>
                        {color}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="pd-key-specs-grid">
            {keySpecs
              .filter((s) => s.value)
              .map((spec) => (
                <div key={spec.label} className="pd-key-spec-card">
                  <span className="pd-key-spec-label">
                    <span className="pd-key-spec-icon">
                      <spec.Icon fontSize="inherit" />
                    </span>
                    {spec.label}
                  </span>
                  <span className="pd-key-spec-value">{spec.value}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {(phone.pros?.length > 0 || phone.cons?.length > 0) && (
        <section className="pd-section pd-pros-cons">
          <h2 className="pd-section-title">Pros & Cons</h2>
          <div className="pd-pros-cons-grid">
            {phone.pros?.length > 0 && (
              <div className="pd-pros-card">
                <div className="pd-pc-header pd-pc-header--pros">
                  <span className="pd-pc-dot pd-pc-dot--pros" />
                  Pros
                </div>
                <ul className="pd-pc-list">
                  {phone.pros.map((pro, i) => (
                    <li key={i} className="pd-pc-item pd-pc-item--pro">
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {phone.cons?.length > 0 && (
              <div className="pd-cons-card">
                <div className="pd-pc-header pd-pc-header--cons">
                  <span className="pd-pc-dot pd-pc-dot--cons" />
                  Cons
                </div>
                <ul className="pd-pc-list">
                  {phone.cons.map((con, i) => (
                    <li key={i} className="pd-pc-item pd-pc-item--con">
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="pd-section pd-specs">
        <h2 className="pd-section-title">Specifications</h2>

        <div className="pd-spec-tabs">
          {tabNames.map((tab) => (
            <button
              key={tab}
              className={`pd-spec-tab ${currentTab === tab ? 'active' : ''}`}
              onClick={() => setActiveSpecTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {showCameraTable && (
          <div className="pd-cam-table-wrap">
            <table className="pd-cam-table">
              <thead>
                <tr>
                  <th>Camera</th>
                  {cameraColumns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cameraRows.map((r) => (
                  <tr key={r.name}>
                    <th scope="row">{r.name}</th>
                    {cameraColumns.map((c) => (
                      <td key={c.key} className={c.key === 'zoom' ? 'pd-cam-zoom' : undefined}>
                        {r[c.key] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {visibleRows.length > 0 && (
          <div className="pd-spec-table">
            {visibleRows.map(([label, value]) => (
              <div key={label} className="pd-spec-row">
                <span className="pd-spec-label">{label}</span>
                <span className="pd-spec-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {keyHighlights.length > 0 && (
        <section className="pd-section pd-key-highlights">
          <h2 className="pd-kh-title">
            {phone.name} <span className="pd-kh-gradient">Key Highlights</span>
          </h2>
          <div className="pd-kh-table">
            {keyHighlights.map(([label, value]) => (
              <div key={label} className="pd-kh-row">
                <span className="pd-kh-label">{label}</span>
                <span className="pd-kh-value">{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {phone.faqs?.length > 0 && (
        <section className="pd-section pd-faqs">
          <h2 className="pd-section-title">Frequently Asked Questions</h2>
          <div className="pd-faq-list">
            {phone.faqs.map((faq, i) => (
              <details key={i} className="pd-faq-item">
                <summary className="pd-faq-question">{faq.question}</summary>
                <p className="pd-faq-answer">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {galleryModal}
    </div>
  );
}