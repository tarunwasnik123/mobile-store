import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../api/client';
import SEO from '../components/SEO';
import './PhoneDetail.css';

export default function PhoneDetail() {
  const { id } = useParams();
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);

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
  }, [phone?._id, phone?.id, phone?.externalId]);

  useEffect(() => {
    if (!isGalleryOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isGalleryOpen]);

  if (loading) {
    return (
      <div className="page">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!phone) {
    return (
      <div className="page">
        <h2>Phone not found</h2>
        <Link to="/find">Back to Finder</Link>
      </div>
    );
  }

  const previewText =
    phone.description ||
    phone.shortDescription ||
    phone.name ||
    'View phone details and specifications.';

  const phoneMetaTitle = phone.metaTitle || `${phone.name} | Mobile Store`;
  const phoneMetaDescription =
    phone.metaDescription ||
    `Get specifications, images, and details for ${phone.name}. ${previewText}`;

  const specs = phone.specs || {};
  const general = specs.General || {};
  const performance = specs.Performance || {};
  const storage = specs.Storage || {};
  const display = specs.Display || {};
  const rearCamera = specs.RearCamera || {};
  const frontCamera = specs.FrontCamera || {};
  const battery = specs.Battery || {};
  const soundAudio = specs.SoundAudio || {};
  const networkConnectivity = specs.NetworkConnectivity || {};
  const sensors = specs.Sensors || {};
  const imageList =
    Array.isArray(phone.images) && phone.images.length > 0
      ? phone.images
      : phone.image
        ? [phone.image]
        : [];
  const activeImage = imageList[activeImageIndex] || phone.image;

  const showNextImage = () => {
    if (imageList.length < 2 || activeImageIndex >= imageList.length - 1)
      return;
    setActiveImageIndex((prev) => prev + 1);
  };

  const showPreviousImage = () => {
    if (imageList.length < 2 || activeImageIndex <= 0) return;
    setActiveImageIndex((prev) => prev - 1);
  };

  const openGallery = () => {
    setGalleryImageIndex(activeImageIndex);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => setIsGalleryOpen(false);

  const showNextGalleryImage = () => {
    if (galleryImageIndex >= imageList.length - 1) return;
    setGalleryImageIndex((prev) => prev + 1);
  };

  const showPreviousGalleryImage = () => {
    if (galleryImageIndex <= 0) return;
    setGalleryImageIndex((prev) => prev - 1);
  };

  const galleryModal =
    isGalleryOpen && imageList.length > 0 && typeof document !== 'undefined'
      ? createPortal(
          <div className="image-dialog-backdrop" onClick={closeGallery}>
            <div className="image-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="image-dialog-header">
                <h3>{phone.name} Images</h3>
                <button
                  type="button"
                  className="dialog-close-btn"
                  onClick={closeGallery}
                  aria-label="Close">
                  ×
                </button>
              </div>
              <div className="image-dialog-main">
                {galleryImageIndex > 0 && (
                  <button
                    type="button"
                    className="image-arrow image-arrow-left"
                    onClick={showPreviousGalleryImage}
                    aria-label="Previous image">
                    ‹
                  </button>
                )}
                <img src={imageList[galleryImageIndex]} alt={phone.name} />
                {galleryImageIndex < imageList.length - 1 && (
                  <button
                    type="button"
                    className="image-arrow image-arrow-right"
                    onClick={showNextGalleryImage}
                    aria-label="Next image">
                    ›
                  </button>
                )}
              </div>
              <div className="image-dialog-thumbs">
                {imageList.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    className={`image-thumb-btn ${
                      idx === galleryImageIndex ? 'active' : ''
                    }`}
                    onClick={() => setGalleryImageIndex(idx)}>
                    <img src={img} alt={`${phone.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="phone-detail page">
      <SEO
        title={phoneMetaTitle}
        description={phoneMetaDescription}
        keywords={phone.metaName}
      />
      <header className="detail-header">
        <div className="detail-left">
          <div className="detail-image-stage">
            <img src={activeImage} alt={phone.name} />
            {imageList.length > 1 && activeImageIndex > 0 && (
              <button
                type="button"
                className="image-arrow image-arrow-left"
                onClick={showPreviousImage}
                aria-label="Previous image">
                ‹
              </button>
            )}
            {imageList.length > 1 &&
              activeImageIndex < imageList.length - 1 && (
                <button
                  type="button"
                  className="image-arrow image-arrow-right"
                  onClick={showNextImage}
                  aria-label="Next image">
                  ›
                </button>
              )}
          </div>
          {imageList.length > 0 && (
            <div className="image-actions">
              <button
                type="button"
                className="view-all-images-btn"
                onClick={openGallery}>
                View All Photos ({imageList.length})
              </button>
            </div>
          )}
        </div>

        <div className="detail-right">
          <h1>{phone.name}</h1>

          <div className="key-specs">
            <div>
              <strong>RAM & Storage</strong>
              <div>
                {performance.RAM} / {storage.InternalStorage}
              </div>
            </div>

            <div>
              <strong>Processor</strong>
              <div>{performance.Chipset}</div>
            </div>

            <div>
              <strong>Display</strong>
              <div>
                {display.Size} {display.Type}
              </div>
            </div>

            <div>
              <strong>Battery</strong>
              <div>{battery.Capacity}</div>
            </div>

            <div>
              <strong>OS</strong>
              <div>
                {general.OperatingSystem} {general.CustomUI}
              </div>
            </div>

            <div>
              <strong>Network</strong>
              <div>{networkConnectivity.NetworkSupport}</div>
            </div>
          </div>

          <div className="buy-row">
            <div className="price-big">
              <strong>Price:</strong>{' '}
              {phone.price ? `₹${Number(phone.price).toLocaleString()}` : '—'}
            </div>
          </div>
        </div>
      </header>

      <section className="pros-cons-section">
        <h2>Pros & Cons</h2>
        <div className="pros-cons-table">
          <div className="pros">
            <h3>Pros</h3>
            <ul>
              {phone.pros &&
                phone.pros.map((pro, idx) => <li key={idx}>{pro}</li>)}
            </ul>
          </div>
          <div className="cons">
            <h3>Cons</h3>
            <ul>
              {phone.cons &&
                phone.cons.map((con, idx) => <li key={idx}>{con}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="specs-section">
        <h2>Specifications</h2>

        {/* GENERAL */}
        <div className="spec-block">
          <h3>General</h3>
          <dl>
            <dt>Operating System</dt>
            <dd>{general.OperatingSystem || '—'}</dd>

            <dt>Custom UI</dt>
            <dd>{general.CustomUI || '—'}</dd>

            <dt>Launch Date</dt>
            <dd>
              {general.LaunchDate
                ? new Date(general.LaunchDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </dd>

            <dt>OS Update</dt>
            <dd>{general.OSUpdate || '—'}</dd>
          </dl>
        </div>

        {/* PERFORMANCE */}
        <div className="spec-block">
          <h3>Performance</h3>
          <dl>
            <dt>Chipset</dt>
            <dd>{performance.Chipset || '—'}</dd>

            <dt>CPU</dt>
            <dd>{performance.CPU || '—'}</dd>

            <dt>GPU</dt>
            <dd>{performance.GPU || '—'}</dd>

            <dt>RAM</dt>
            <dd>{performance.RAM || '—'}</dd>

            <dt>RAM Type</dt>
            <dd>{performance.RAMType || '—'}</dd>

            <dt>Architecture</dt>
            <dd>{performance.Architecture || '—'}</dd>

            <dt>Fabrication</dt>
            <dd>{performance.Fabrication || '—'}</dd>
          </dl>
        </div>

        {/* PERFORMANCE TEST RESULTS */}
        <div className="spec-block">
          <h3>Performance Test Results</h3>
          <dl>
            <dt>Bootup Time</dt>
            <dd>{performance.BootupTime || '—'}</dd>

            <dt>AnTuTu Score</dt>
            <dd>{performance.AnTuTuScore || '—'}</dd>
          </dl>
        </div>

        {/* STORAGE */}
        <div className="spec-block">
          <h3>Storage</h3>
          <dl>
            <dt>Internal Storage</dt>
            <dd>{storage.InternalStorage || '—'}</dd>

            <dt>Storage Type</dt>
            <dd>{storage.StorageType || '—'}</dd>
          </dl>
        </div>

        {/* DISPLAY */}
        <div className="spec-block">
          <h3>Display</h3>
          <dl>
            <dt>Type</dt>
            <dd>{display.Type || '—'}</dd>

            <dt>Size</dt>
            <dd>{display.Size || '—'}</dd>

            <dt>Resolution</dt>
            <dd>{display.Resolution || '—'}</dd>

            <dt>Refresh Rate</dt>
            <dd>{display.RefreshRate || '—'}</dd>

            <dt>Screen to Body Ratio</dt>
            <dd>{display.ScreenToBodyRatio || '—'}</dd>

            <dt>Bezel-less Display</dt>
            <dd>{display.BezelLessDisplay || '—'}</dd>

            <dt>Pixel Density</dt>
            <dd>{display.PixelDensity || '—'}</dd>

            <dt>Peak Brightness</dt>
            <dd>{display.PeakBrightness || '—'}</dd>

            <dt>HBM Brightness</dt>
            <dd>{display.HBMBrightness || '—'}</dd>

            <dt>Aspect Ratio</dt>
            <dd>{display.AspectRatio || '—'}</dd>
          </dl>
        </div>

        {/* REAR CAMERA */}
        <div className="spec-block">
          <h3>Rear Camera</h3>
          <dl>
            <dt>Primary</dt>
            <dd>{rearCamera.Camera?.Primary || '—'}</dd>

            <dt>Secondary</dt>
            <dd>{rearCamera.Camera?.Secondary || '—'}</dd>

            <dt>Tertiary</dt>
            <dd>{rearCamera.Camera?.Tertiary || '—'}</dd>
          </dl>
        </div>

        {/* FRONT CAMERA */}
        <div className="spec-block">
          <h3>Front Camera</h3>
          <dl>
            <dt>Camera</dt>
            <dd>{frontCamera.Camera || '—'}</dd>
          </dl>
        </div>

        {/* BATTERY */}
        <div className="spec-block">
          <h3>Battery</h3>
          <dl>
            <dt>Capacity</dt>
            <dd>{battery.Capacity || '—'}</dd>

            <dt>Quick Charging</dt>
            <dd>{battery.QuickCharging || '—'}</dd>

            <dt>Wireless Charging</dt>
            <dd>{battery.WirelessCharging || '—'}</dd>

            <dt>Battery Charging Time</dt>
            <dd>{battery.BatteryChargingTime || '—'}</dd>
          </dl>
        </div>

        {/* SOUND & AUDIO */}
        <div className="spec-block">
          <h3>Sound & Audio</h3>
          <dl>
            <dt>Loudspeakers</dt>
            <dd>{soundAudio.Loudspeakers || '—'}</dd>

            <dt>Headphone Connection</dt>
            <dd>{soundAudio.HeadphoneConnection || '—'}</dd>

            <dt>Sound Technology</dt>
            <dd>{soundAudio.SoundTechnology || '—'}</dd>
          </dl>
        </div>

        {/* NETWORK & CONNECTIVITY */}
        <div className="spec-block">
          <h3>Network & Connectivity</h3>
          <dl>
            <dt>SIM Slot</dt>
            <dd>{networkConnectivity.SIMSlot || '—'}</dd>

            <dt>SIM Type</dt>
            <dd>{networkConnectivity.SIMType || '—'}</dd>

            <dt>Wi-Fi</dt>
            <dd>{networkConnectivity.WiFi || '—'}</dd>

            <dt>Network Support</dt>
            <dd>{networkConnectivity.NetworkSupport || '—'}</dd>

            <dt>VoLTE</dt>
            <dd>{networkConnectivity.VoLTE || '—'}</dd>

            <dt>Bluetooth</dt>
            <dd>{networkConnectivity.Bluetooth || '—'}</dd>

            <dt>GPS</dt>
            <dd>{networkConnectivity.GPS || '—'}</dd>

            <dt>NFC</dt>
            <dd>{networkConnectivity.NFC || '—'}</dd>
          </dl>
        </div>

        {/* SENSORS */}
        <div className="spec-block">
          <h3>Sensors</h3>
          <dl>
            <dt>Fingerprint</dt>
            <dd>{sensors.Fingerprint || '—'}</dd>

            <dt>Fingerprint Sensor Type</dt>
            <dd>{sensors.FingerprintSensorType || '—'}</dd>

            <dt>Fingerprint Sensor Position</dt>
            <dd>{sensors.FingerprintSensorPosition || '—'}</dd>

            <dt>Other Sensors</dt>
            <dd>
              {Array.isArray(sensors.OtherSensors)
                ? sensors.OtherSensors.join(', ')
                : sensors.OtherSensors || '—'}
            </dd>
          </dl>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      {phone.faqs && phone.faqs.length > 0 && (
        <section className="faqs-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faqs-list">
            {phone.faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {galleryModal}
    </div>
  );
}
