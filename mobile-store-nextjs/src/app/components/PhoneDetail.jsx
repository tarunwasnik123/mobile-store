'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import api from '../api/client';
import './PhoneDetail.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';

export default function PhoneDetail() {
  const { id } = useParams();
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const [activeSpecTab, setActiveSpecTab] = useState('General');

  useEffect(() => {
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
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
    setGalleryImageIndex(0);
    setIsGalleryOpen(false);
    setActiveSpecTab('General');
  }, [phone?._id]);

  useEffect(() => {
    if (!isGalleryOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isGalleryOpen]);

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
    Display: specs.Display || {},
    Camera: specs.RearCamera || {},
    Battery: specs.Battery || {},
    Audio: specs.SoundAudio || {},
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
    Camera: [
      ['Primary', sections.Camera.Camera?.Primary],
      ['Secondary', sections.Camera.Camera?.Secondary],
      ['Tertiary', sections.Camera.Camera?.Tertiary],
      ['Front Camera', (specs.FrontCamera || {}).Camera],
    ],
    Battery: [
      ['Capacity', sections.Battery.Capacity],
      ['Quick Charging', sections.Battery.QuickCharging],
      ['Wireless Charging', sections.Battery.WirelessCharging],
      ['Charging Time', sections.Battery.BatteryChargingTime],
    ],
    Audio: [
      ['Loudspeakers', sections.Audio.Loudspeakers],
      ['Headphone', sections.Audio.HeadphoneConnection],
      ['Technology', sections.Audio.SoundTechnology],
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

  const imageList =
    Array.isArray(phone.images) && phone.images.length > 0
      ? phone.images
      : phone.image
        ? [phone.image]
        : [];
  const activeImage = imageList[activeImageIndex] || phone.image;

  const keySpecs = [
    { label: 'Chipset', value: sections.Performance.Chipset },
    {
      label: 'Display',
      value: `${sections.Display.Size || ''} ${sections.Display.Type || ''}`.trim(),
    },
    {
      label: 'RAM',
      value: `${sections.Performance.RAM || ''} / ${sections.Storage.InternalStorage || ''}`.trim(),
    },
    { label: 'Battery', value: sections.Battery.Capacity },
    { label: 'Camera', value: sections.Camera.Camera?.Primary },
    { label: 'OS', value: sections.General.OperatingSystem },
  ];

  const phoneId = phone.externalId || phone._id;
  const pageUrl = phone.canonicalUrl || `${SITE_URL}/phone/${phoneId}`;

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
    <div className="pd-page">
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

      <section className="pd-hero">
        <div className="pd-hero-image-col">
          <div className="pd-image-stage">
            <Image
              src={activeImage}
              alt={phone.imageAltText || phone.name}
              fill
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 900px) 100vw, 380px"
              priority
            />
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
            <span className="pd-price">
              {phone.price ? `₹${Number(phone.price).toLocaleString('en-IN')}` : 'Price TBA'}
            </span>
          </div>

          <div className="pd-key-specs-grid">
            {keySpecs
              .filter((s) => s.value)
              .map((spec) => (
                <div key={spec.label} className="pd-key-spec-card">
                  <span className="pd-key-spec-label">{spec.label}</span>
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
          {Object.keys(specRows).map((tab) => (
            <button
              key={tab}
              className={`pd-spec-tab ${activeSpecTab === tab ? 'active' : ''}`}
              onClick={() => setActiveSpecTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="pd-spec-table">
          {specRows[activeSpecTab]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label} className="pd-spec-row">
                <span className="pd-spec-label">{label}</span>
                <span className="pd-spec-value">{value}</span>
              </div>
            ))}
        </div>
      </section>

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