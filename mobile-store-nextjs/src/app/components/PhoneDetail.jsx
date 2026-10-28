'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CameraFrontIcon from '@mui/icons-material/CameraFront';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BoltIcon from '@mui/icons-material/Bolt';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import StraightenIcon from '@mui/icons-material/Straighten';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SensorsIcon from '@mui/icons-material/Sensors';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ShareIcon from '@mui/icons-material/Share';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import ChecklistIcon from '@mui/icons-material/Checklist';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import api from '../api/client';
import { setBrands, setPrice } from '../store/filterSlice';
import './PhoneDetailPage.css';
import './PhoneDetailCompare.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.handsetnews.com';
const CAMERA_NAMES = ['Primary', 'Secondary', 'Tertiary', 'Quaternary'];
// Launch date itne din ke andar ho to "New Launch" badge dikhta hai
const NEW_LAUNCH_DAYS = 90;
// "Similar Price Phones" me itne rupaye ka upar/neeche ka farq chalega
const PRICE_RANGE = 2000;
// "Phones from Other Brands" me max itne phones
const OTHER_BRANDS_LIMIT = 6;
// "Upcoming Phones" me max itne phones
const UPCOMING_LIMIT = 4;

// Compare page ka URL format sirf yahin se banta hai, badalna ho to bas yahan badlo
const compareHref = (a, b) => `/compare/${a}-vs-${b}`;

// Colour ke naam ke aakhri word se swatch ka rang (sirf dikhane ke liye)
const COLOR_HEX = {
  black: '#1f2937',
  white: '#f8fafc',
  silver: '#cbd5e1',
  grey: '#9ca3af',
  gray: '#9ca3af',
  blue: '#3b82f6',
  navy: '#1e3a8a',
  red: '#ef4444',
  green: '#22c55e',
  olive: '#6b7a3a',
  purple: '#a855f7',
  violet: '#8b5cf6',
  lilac: '#c4a7e7',
  pink: '#f472b6',
  gold: '#d4af37',
  orange: '#f97316',
  yellow: '#facc15',
  titanium: '#a8a29e',
  graphite: '#4b5563',
  bronze: '#b08d57',
  cream: '#f5f0e1',
  teal: '#14b8a6',
  mint: '#a7f3d0',
  brown: '#92400e',
  midnight: '#0f172a',
};

const swatchColor = (name) => {
  const words = String(name).toLowerCase().split(/[\s-]+/).reverse();
  for (const w of words) {
    if (COLOR_HEX[w]) return COLOR_HEX[w];
  }
  return '#cbd5e1';
};

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const capitalize = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

const toId = (p) => p.externalId || p._id;

const scrollToId = (elId) => {
  const el = document.getElementById(elId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function PhoneDetail({ initialPhone = null }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(!initialPhone);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const [activeSpec, setActiveSpec] = useState('General');
  const [activeTab, setActiveTab] = useState('ph-specs');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [latestNews, setLatestNews] = useState([]);
  const [relatedPhones, setRelatedPhones] = useState([]);
  const [phonePool, setPhonePool] = useState([]);
  const [upcomingPhones, setUpcomingPhones] = useState([]);

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
    setActiveSpec('General');
    setActiveTab('ph-specs');
    setSummaryOpen(false);
  }, [phone?._id]);

  useEffect(() => {
    if (!isGalleryOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isGalleryOpen]);

  // Sidebar: Latest News (existing /news API)
  useEffect(() => {
    let on = true;
    api
      .get('/news?limit=4&sort=-createdAt')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        if (on) setLatestNews(list);
      })
      .catch((err) => console.error('Latest news fetch failed', err));
    return () => {
      on = false;
    };
  }, []);

  // Sidebar: Related Phones (same brand)
  useEffect(() => {
    if (!phone?.brand) return;
    let on = true;
    api
      .get(`/phones?brand=${encodeURIComponent(phone.brand)}&limit=8`)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        if (on) setRelatedPhones(list.filter((p) => p._id !== phone._id).slice(0, 4));
      })
      .catch((err) => console.error('Related phones fetch failed', err));
    return () => {
      on = false;
    };
  }, [phone?._id, phone?.brand]);

  // Sidebar: Compare / Similar Price / Other Brands ke liye phones ka pool (max 100)
  useEffect(() => {
    let on = true;
    api
      .get('/phones?limit=100&sort=-createdAt')
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        if (on) setPhonePool(list);
      })
      .catch((err) => console.error('Phone pool fetch failed', err));
    return () => {
      on = false;
    };
  }, []);

  // Sidebar: Upcoming Phones (existing /upcoming API)
  useEffect(() => {
    let on = true;
    api
      .get(`/upcoming?limit=${UPCOMING_LIMIT}`)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        if (on) setUpcomingPhones(list.slice(0, UPCOMING_LIMIT));
      })
      .catch((err) => console.error('Upcoming phones fetch failed', err));
    return () => {
      on = false;
    };
  }, []);

  if (loading)
    return (
      <div className="ph-state">
        <div className="ph-state-spinner" />
        <p>Loading device details...</p>
      </div>
    );

  if (error)
    return (
      <div className="ph-state ph-state--error">
        <p>{error}</p>
        <Link href="/find" className="ph-back-link">
          ← Back to finder
        </Link>
      </div>
    );

  if (!phone)
    return (
      <div className="ph-state">
        <p>Phone not found.</p>
        <Link href="/find" className="ph-back-link">
          ← Back to finder
        </Link>
      </div>
    );

  const specs = phone.specs || {};
  const G = specs.General || {};
  const P = specs.Performance || {};
  const S = specs.Storage || {};
  const D = specs.Display || {};
  const DS = specs.Design || {};
  const B = specs.Battery || {};
  const M = specs.SoundAudio || {};
  const N = specs.NetworkConnectivity || {};
  const SN = specs.Sensors || {};
  const RC = specs.RearCamera || {};
  const frontCameraValue = (specs.FrontCamera || {}).Camera;

  const pros = phone.pros || [];
  const cons = phone.cons || [];
  const faqs = phone.faqs || [];

  // ===== Images =====
  const imageList = (
    Array.isArray(phone.images) && phone.images.length > 0
      ? phone.images
      : phone.image
        ? [phone.image]
        : []
  ).filter(Boolean);
  const activeImage = imageList[activeImageIndex] || phone.image || null;
  const thumbs = imageList.slice(0, 5);

  // ===== Rating =====
  const ratingNumber =
    phone.rating === null || phone.rating === undefined || phone.rating === ''
      ? null
      : Number(phone.rating);
  const hasRating = ratingNumber !== null && !Number.isNaN(ratingNumber) && ratingNumber > 0;
  const ratingValue = hasRating ? Math.min(5, ratingNumber) : 0;

  // ===== Colours =====
  const colorList = Array.isArray(phone.colors)
    ? phone.colors.map((c) => String(c).trim()).filter(Boolean)
    : [];

  // ===== New Launch badge (launch date par based) =====
  const launchTime = G.LaunchDate ? new Date(G.LaunchDate).getTime() : NaN;
  const nowTime = Date.now();
  const isNewLaunch =
    !Number.isNaN(launchTime) &&
    launchTime <= nowTime &&
    nowTime - launchTime <= NEW_LAUNCH_DAYS * 86400000;

  const updatedLabel = formatDate(phone.updatedAt);

  const phoneId = toId(phone);
  const pageUrl = phone.canonicalUrl || `${SITE_URL}/phone/${phoneId}`;

  // ===== Hero: Key Highlights (sirf jo data hai) =====
  const joinBits = (arr, sep = ' ') => arr.filter(Boolean).join(sep);
  const rearMps = CAMERA_NAMES.map((n) => RC.Camera?.[n]).filter(Boolean);
  const displayText = joinBits([D.Size, D.Type, D.RefreshRate]);

  const heroHighlights = [
    { Icon: SmartphoneIcon, text: displayText && `${displayText} Display` },
    { Icon: MemoryIcon, text: P.Chipset && `${P.Chipset} Processor` },
    { Icon: CameraAltIcon, text: rearMps.length > 0 && `${rearMps.join(' + ')} Rear Camera` },
    {
      Icon: StorageIcon,
      text: joinBits(
        [P.RAM && `${P.RAM} RAM`, S.InternalStorage && `${S.InternalStorage} Storage`],
        ' + ',
      ),
    },
    { Icon: CameraFrontIcon, text: frontCameraValue && `${frontCameraValue} Front Camera` },
    { Icon: BatteryChargingFullIcon, text: B.Capacity && `${B.Capacity} Battery` },
    {
      Icon: BoltIcon,
      text: joinBits(
        [B.QuickCharging && `${B.QuickCharging} Wired`, B.WirelessCharging && `${B.WirelessCharging} Wireless`],
        ' + ',
      ),
    },
    { Icon: FingerprintIcon, text: SN.Fingerprint && `${SN.Fingerprint} Fingerprint` },
  ].filter((h) => h.text);

  // ===== Rear camera table =====
  const cameraRows = CAMERA_NAMES.map((name) => {
    const d = RC.Details?.[name] || {};
    return {
      name,
      mp: RC.Camera?.[name],
      lens: d.LensFeatures,
      aperture: d.Aperture,
      zoom: d.Zoom,
      focal: d.FocalLength,
    };
  }).filter((r) => r.mp || r.lens || r.aperture || r.zoom || r.focal);

  const cameraColumns = [
    { key: 'mp', label: 'MP' },
    { key: 'lens', label: 'Lens Features' },
    { key: 'aperture', label: 'Aperture' },
    { key: 'zoom', label: 'Zoom' },
    { key: 'focal', label: 'Focal Length' },
  ].filter((c) => cameraRows.some((r) => r[c.key]));

  const hasCameraDetails = cameraRows.some((r) => r.lens || r.aperture || r.zoom || r.focal);
  const rearRows = CAMERA_NAMES.map((n) => [n, RC.Camera?.[n]]);

  // ===== Full Specifications cards =====
  const specCards = [
    {
      id: 'General',
      title: 'General',
      Icon: InfoOutlinedIcon,
      rows: [
        ['Brand', capitalize(phone.brand)],
        ['Model', phone.name],
        ['Launch Date', formatDate(G.LaunchDate)],
        ['Operating System', G.OperatingSystem],
        ['Custom UI', G.CustomUI],
        ['OS Update', G.OSUpdate],
        ['Security Updates', G.SecurityUpdates],
      ],
    },
    {
      id: 'Display',
      title: 'Display',
      Icon: SmartphoneIcon,
      rows: [
        ['Size', D.Size],
        ['Type', D.Type],
        ['Resolution', D.Resolution],
        ['Refresh Rate', D.RefreshRate],
        ['Screen-to-Body Ratio', D.ScreenToBodyRatio],
        ['Pixel Density', D.PixelDensity],
        ['Peak Brightness', D.PeakBrightness],
        ['Aspect Ratio', D.AspectRatio],
      ],
    },
    {
      id: 'Performance',
      title: 'Performance',
      Icon: MemoryIcon,
      rows: [
        ['Chipset', P.Chipset],
        ['CPU', P.CPU],
        ['GPU', P.GPU],
        ['RAM', P.RAM],
        ['RAM Type', P.RAMType],
        ['Architecture', P.Architecture],
        ['Fabrication', P.Fabrication],
        ['AnTuTu Score', P.AnTuTuScore],
        ['Bootup Time', P.BootupTime],
      ],
    },
    {
      id: 'Storage',
      title: 'Storage',
      Icon: StorageIcon,
      rows: [
        ['Internal Storage', S.InternalStorage],
        ['Storage Type', S.StorageType],
      ],
    },
    {
      id: 'Camera',
      title: 'Rear Camera',
      navLabel: 'Camera',
      Icon: CameraAltIcon,
      rows: rearRows,
      table: hasCameraDetails,
    },
    {
      id: 'FrontCamera',
      title: 'Front Camera',
      Icon: CameraFrontIcon,
      rows: [['Camera', frontCameraValue]],
    },
    {
      id: 'Battery',
      title: 'Battery',
      Icon: BatteryChargingFullIcon,
      rows: [
        ['Capacity', B.Capacity],
        ['Battery Type', B.BatteryType],
        ['Quick Charging', B.QuickCharging],
        ['Wireless Charging', B.WirelessCharging],
        ['Reverse Charging', B.ReverseCharging],
        ['Charging Time', B.BatteryChargingTime],
      ],
    },
    {
      id: 'Design',
      title: 'Design',
      Icon: StraightenIcon,
      rows: [
        ['Height', DS.Height],
        ['Width', DS.Width],
        ['Thickness', DS.Thickness],
        ['Weight', DS.Weight],
        ['Build Material', DS.BuildMaterial],
        ['Water Resistance', DS.WaterResistance],
        ['Ruggedness', DS.Ruggedness],
      ],
    },
    {
      id: 'Multimedia',
      title: 'Multimedia',
      Icon: VolumeUpIcon,
      rows: [
        ['Loudspeakers', M.Loudspeakers],
        ['Headphone', M.HeadphoneConnection],
        ['Technology', M.SoundTechnology],
      ],
    },
    {
      id: 'Network',
      title: 'Network & Connectivity',
      navLabel: 'Network',
      Icon: SignalCellularAltIcon,
      rows: [
        ['SIM Slot', N.SIMSlot],
        ['SIM Type', N.SIMType],
        ['Wi-Fi', N.WiFi],
        ['Network Support', N.NetworkSupport],
        ['VoLTE', N.VoLTE],
        ['Bluetooth', N.Bluetooth],
        ['GPS', N.GPS],
        ['NFC', N.NFC],
      ],
    },
    {
      id: 'Sensors',
      title: 'Sensors',
      Icon: SensorsIcon,
      rows: [
        ['Fingerprint', SN.Fingerprint],
        ['Sensor Type', SN.FingerprintSensorType],
        ['Position', SN.FingerprintSensorPosition],
        ['Other Sensors', Array.isArray(SN.OtherSensors) ? SN.OtherSensors.join(', ') : SN.OtherSensors],
      ],
    },
  ]
    .map((c) => ({ ...c, rows: c.rows.filter(([, v]) => v) }))
    .filter((c) => c.rows.length > 0 || c.table);

  const specNav = specCards.filter((c) => c.id !== 'FrontCamera');

  // ===== Main column: similar phones + related comparisons (same brand) =====
  const similar = relatedPhones.slice(0, 3);
  const comparisons = similar.map((rp) => ({
    key: toId(rp),
    label: `${phone.name} vs ${rp.name}`,
    href: compareHref(phoneId, toId(rp)),
  }));

  // ===== Sidebar: Compare Phones (dusre brands ke phones) =====
  const brandKey = String(phone.brand || '').toLowerCase();
  const otherPhones = phonePool.filter((p) => p._id !== phone._id);
  const compareCandidates = otherPhones
    .filter((p) => String(p.brand || '').toLowerCase() !== brandKey)
    .slice(0, 5);

  // ===== Sidebar: Similar Price Phones (±PRICE_RANGE) =====
  const priceNum = Number(phone.price);
  const hasPrice = Number.isFinite(priceNum) && priceNum > 0;
  const similarPrice = hasPrice
    ? otherPhones
        .filter((p) => p.price && Math.abs(Number(p.price) - priceNum) <= PRICE_RANGE)
        .sort((a, b) => Math.abs(Number(a.price) - priceNum) - Math.abs(Number(b.price) - priceNum))
        .slice(0, 4)
    : [];
  const priceMin = hasPrice ? Math.max(0, priceNum - PRICE_RANGE) : 0;
  const priceMax = hasPrice ? priceNum + PRICE_RANGE : 0;

  // ===== Sidebar: Phones from Other Brands (har dusri company ka latest phone) =====
  const otherBrandPhones = (() => {
    const seen = new Set();
    const out = [];
    for (const p of otherPhones) {
      const b = String(p.brand || '').toLowerCase();
      if (!b || b === brandKey || seen.has(b)) continue;
      seen.add(b);
      out.push(p);
      if (out.length >= OTHER_BRANDS_LIMIT) break;
    }
    return out;
  })();

  // ===== Tab bar (sirf wahi tabs jinka section page par hai) =====
  const navTabs = [
    { id: 'ph-specs', label: 'Specifications', Icon: ListAltIcon },
    colorList.length > 0 && { id: 'ph-colours', label: 'Colours', Icon: PaletteOutlinedIcon },
    (pros.length > 0 || cons.length > 0) && { id: 'ph-features', label: 'Key Features', Icon: ChecklistIcon },
    similar.length > 0 && { id: 'ph-compare', label: 'Compare', Icon: CompareArrowsIcon },
    faqs.length > 0 && { id: 'ph-faqs', label: 'FAQs', Icon: HelpOutlinedIcon },
  ].filter(Boolean);

  const bottomBoxCount = [colorList.length > 0, pros.length > 0, cons.length > 0, similar.length > 0].filter(
    Boolean,
  ).length;

  // View All links: pehle filter Redux me set hota hai (NavMenu jaisa), phir Link navigate karta hai
  const applyBrandFilter = () => dispatch(setBrands([capitalize(phone.brand)]));
  const applyPriceFilter = () => dispatch(setPrice([priceMin, priceMax]));

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: phone.name, url: pageUrl });
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      setShareMsg('Link copied');
    } catch {
      setShareMsg('');
    }
    setTimeout(() => setShareMsg(''), 2000);
  };

  // ===== Summary: admin ne likhi ho to wahi, warna specs se auto =====
  const buildSummary = () => {
    if (phone.summary) return String(phone.summary);
    if (phone.description) return String(phone.description);

    const parts = [];

    if (phone.price) {
      parts.push(`${phone.name} is priced at ₹${Number(phone.price).toLocaleString('en-IN')} in India.`);
    }

    const mem = [P.RAM && `${P.RAM} RAM`, S.InternalStorage && `${S.InternalStorage} storage`].filter(Boolean);
    if (P.Chipset) {
      let s = `It is powered by the ${P.Chipset}`;
      if (mem.length) s += ` with ${mem.join(' and ')}`;
      parts.push(`${s}.`);
    } else if (mem.length) {
      parts.push(`It comes with ${mem.join(' and ')}.`);
    }

    const dispBits = [D.Size, D.Type].filter(Boolean).join(' ');
    if (dispBits) {
      let s = `The phone features a ${dispBits} display`;
      if (D.RefreshRate) s += ` with ${D.RefreshRate} refresh rate`;
      parts.push(`${s}.`);
    }

    const camBits = [];
    if (rearMps.length) camBits.push(`a ${rearMps.join(' + ')} rear camera setup`);
    if (frontCameraValue) camBits.push(`a ${frontCameraValue} front camera`);
    if (camBits.length) parts.push(`For photography, it offers ${camBits.join(' and ')}.`);

    if (B.Capacity) {
      let s = `It packs a ${B.Capacity} battery`;
      if (B.QuickCharging) s += ` with ${B.QuickCharging} fast charging`;
      parts.push(`${s}.`);
    }

    if (G.OperatingSystem) {
      let s = `It runs on ${G.OperatingSystem}`;
      if (G.CustomUI) s += ` with ${G.CustomUI}`;
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
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
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
          <div className="ph-gm-backdrop" onClick={() => setIsGalleryOpen(false)}>
            <div className="ph-gm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ph-gm-header">
                <span>{phone.name}</span>
                <button className="ph-gm-close" onClick={() => setIsGalleryOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="ph-gm-main">
                {galleryImageIndex > 0 && (
                  <button
                    className="ph-gm-arrow ph-gm-arrow--left"
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
                    className="ph-gm-arrow ph-gm-arrow--right"
                    onClick={() => setGalleryImageIndex((i) => i + 1)}>
                    ›
                  </button>
                )}
              </div>
              <div className="ph-gm-thumbs">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    className={`ph-gm-thumb ${idx === galleryImageIndex ? 'active' : ''}`}
                    onClick={() => setGalleryImageIndex(idx)}>
                    <Image src={img} alt={`${phone.name} ${idx + 1}`} fill style={{ objectFit: 'contain' }} sizes="60px" />
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="ph-page">
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

      <div className="ph-container">
        {/* ===== Breadcrumb ===== */}
        <nav className="ph-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/find">Phones</Link>
          <span>›</span>
          {phone.brand && (
            <>
              <Link href={`/find?brand=${encodeURIComponent(phone.brand)}`} onClick={applyBrandFilter}>
                {capitalize(phone.brand)}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="ph-bc-current">{phone.name}</span>
        </nav>

        <div className="ph-layout">
          {/* ================= MAIN COLUMN ================= */}
          <div className="ph-main">
            {/* ===== Hero: 3 cards ===== */}
            <section className="ph-hero">
              {/* gallery */}
              <div className="ph-card ph-gallery">
                {thumbs.length > 1 && (
                  <div className="ph-thumbs">
                    {thumbs.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`ph-thumb ${idx === activeImageIndex ? 'active' : ''}`}
                        onClick={() => {
                          if (idx === 4 && imageList.length > 5) {
                            setGalleryImageIndex(4);
                            setIsGalleryOpen(true);
                          } else {
                            setActiveImageIndex(idx);
                          }
                        }}>
                        <Image src={img} alt="" fill style={{ objectFit: 'contain' }} sizes="38px" />
                        {idx === 4 && imageList.length > 5 && (
                          <span className="ph-thumb-more">+{imageList.length - 4}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="ph-stage">
                  {activeImage ? (
                    <Image
                      src={activeImage}
                      alt={phone.imageAltText || phone.name}
                      fill
                      style={{ objectFit: 'contain', padding: 10 }}
                      sizes="(max-width: 900px) 100vw, 260px"
                      priority
                    />
                  ) : (
                    <div className="ph-placeholder">No image available</div>
                  )}
                  {imageList.length > 1 && activeImageIndex > 0 && (
                    <button
                      type="button"
                      className="ph-stage-arrow ph-stage-arrow--left"
                      onClick={() => setActiveImageIndex((i) => i - 1)}>
                      ‹
                    </button>
                  )}
                  {imageList.length > 1 && activeImageIndex < imageList.length - 1 && (
                    <button
                      type="button"
                      className="ph-stage-arrow ph-stage-arrow--right"
                      onClick={() => setActiveImageIndex((i) => i + 1)}>
                      ›
                    </button>
                  )}
                  {imageList.length > 0 && (
                    <button
                      type="button"
                      className="ph-view-gallery"
                      onClick={() => {
                        setGalleryImageIndex(activeImageIndex);
                        setIsGalleryOpen(true);
                      }}>
                      View Gallery
                    </button>
                  )}
                </div>
              </div>

              {/* info */}
              <div className="ph-card ph-info">
                <div className="ph-info-top">
                  <div>{isNewLaunch && <span className="ph-badge-new">New Launch</span>}</div>
                  <div className="ph-actions">
                    <Link href={`/compare/${phoneId}`} className="ph-action-btn">
                      <CompareArrowsIcon fontSize="inherit" />
                      Compare
                    </Link>
                    <button type="button" className="ph-action-btn" onClick={handleShare}>
                      <ShareIcon fontSize="inherit" />
                      {shareMsg || 'Share'}
                    </button>
                  </div>
                </div>

                <h1 className="ph-title">{phone.name}</h1>

                {summaryText && (
                  <div className={`ph-summary ${summaryOpen ? 'open' : ''}`}>
                    <p>{summaryText}</p>
                    {summaryIsLong && (
                      <button
                        type="button"
                        className="ph-summary-toggle"
                        onClick={() => setSummaryOpen((o) => !o)}>
                        {summaryOpen ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}

                {hasRating && (
                  <div className="ph-rating" aria-label={`Rating ${ratingValue.toFixed(1)} out of 5`}>
                    <span className="ph-stars" aria-hidden="true">
                      <span className="ph-stars-base">★★★★★</span>
                      <span className="ph-stars-fill" style={{ width: `${(ratingValue / 5) * 100}%` }}>
                        ★★★★★
                      </span>
                    </span>
                    <span className="ph-rating-value">
                      {ratingValue.toFixed(1)}
                      <small>/5</small>
                    </span>
                  </div>
                )}

                <div className="ph-price-row">
                  <span className="ph-price">
                    {phone.price ? `₹${Number(phone.price).toLocaleString('en-IN')}` : 'Price TBA'}
                  </span>
                </div>

                {updatedLabel && <p className="ph-updated">Last updated: {updatedLabel}</p>}
              </div>

              {/* colours + key highlights */}
              <div className="ph-card ph-side">
                {colorList.length > 0 && (
                  <div>
                    <h3 className="ph-side-title">Colours</h3>
                    <div className="ph-swatches">
                      {colorList.map((color, i) => (
                        <span key={`${color}-${i}`} className="ph-swatch">
                          <i style={{ background: swatchColor(color) }} />
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {heroHighlights.length > 0 && (
                  <div>
                    <h3 className="ph-side-title">Key Highlights</h3>
                    <ul
                      className="ph-highlights"
                      style={{ gridTemplateRows: `repeat(${Math.ceil(heroHighlights.length / 2)}, auto)` }}>
                      {heroHighlights.map((h) => (
                        <li key={h.text}>
                          <span className="ph-hl-icon">
                            <h.Icon fontSize="inherit" />
                          </span>
                          <span>{h.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* ===== Tab bar ===== */}
            <nav className="ph-card ph-tabs" aria-label="Page sections">
              {navTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`ph-tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(t.id);
                    scrollToId(t.id);
                  }}>
                  <t.Icon fontSize="inherit" />
                  {t.label}
                </button>
              ))}
            </nav>

            {/* ===== Full Specifications ===== */}
            <section className="ph-card ph-specs" id="ph-specs">
              <h2 className="ph-section-title">Full Specifications</h2>
              <div className="ph-specs-layout">
                <ul className="ph-spec-nav">
                  {specNav.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`ph-spec-nav-btn ${activeSpec === c.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveSpec(c.id);
                          scrollToId(`ph-spec-${c.id}`);
                        }}>
                        <c.Icon fontSize="inherit" />
                        {c.navLabel || c.title}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="ph-spec-grid">
                  {specCards.map((card) => (
                    <div
                      key={card.id}
                      id={`ph-spec-${card.id}`}
                      className={`ph-spec-card ${card.table ? 'ph-spec-card--wide' : ''}`}>
                      <h3 className="ph-spec-card-title">
                        <card.Icon fontSize="inherit" />
                        {card.title}
                      </h3>

                      {card.table ? (
                        <div className="ph-cam-table-wrap">
                          <table className="ph-cam-table">
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
                                    <td key={c.key} className={c.key === 'zoom' ? 'ph-cam-zoom' : undefined}>
                                      {r[c.key] || '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <dl className="ph-spec-rows">
                          {card.rows.map(([label, value]) => (
                            <div key={label} className="ph-spec-row">
                              <dt>{label}</dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ===== Colours | Key Features | Cons | Compare with Similar Phones ===== */}
            {bottomBoxCount > 0 && (
              <section className="ph-bottom" style={{ '--ph-cols': Math.min(bottomBoxCount, 4) }}>
                {colorList.length > 0 && (
                  <div className="ph-card ph-box" id="ph-colours">
                    <div className="ph-box-head">
                      <h3 className="ph-box-title">Colours</h3>
                    </div>
                    <div className="ph-colour-grid">
                      {colorList.map((color, i) => (
                        <div key={`${color}-${i}`} className="ph-colour-item">
                          <span className="ph-colour-dot" style={{ background: swatchColor(color) }} />
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pros.length > 0 && (
                  <div className="ph-card ph-box" id="ph-features">
                    <div className="ph-box-head">
                      <h3 className="ph-box-title">Key Features</h3>
                    </div>
                    <ul className="ph-check-list ph-check-list--pro">
                      {pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {cons.length > 0 && (
                  <div className="ph-card ph-box" id={pros.length > 0 ? undefined : 'ph-features'}>
                    <div className="ph-box-head">
                      <h3 className="ph-box-title">Cons</h3>
                    </div>
                    <ul className="ph-check-list ph-check-list--con">
                      {cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {similar.length > 0 && (
                  <div className="ph-card ph-box" id="ph-compare">
                    <div className="ph-box-head">
                      <h3 className="ph-box-title">Compare with Similar Phones</h3>
                      <Link href="/compare" className="ph-box-link">
                        View All →
                      </Link>
                    </div>
                    <div className="ph-similar-grid">
                      {similar.map((rp) => (
                        <div key={rp._id} className="ph-similar-item">
                          {rp.image && (
                            <span className="ph-similar-thumb">
                              <Image src={rp.image} alt={rp.name} fill style={{ objectFit: 'contain' }} sizes="44px" />
                            </span>
                          )}
                          <span className="ph-similar-name">{rp.name}</span>
                          {rp.price ? (
                            <span className="ph-similar-price">₹{Number(rp.price).toLocaleString('en-IN')}</span>
                          ) : null}
                          <Link href={compareHref(phoneId, toId(rp))} className="ph-btn-outline">
                            Compare
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ===== FAQs | Related Comparisons ===== */}
            {(faqs.length > 0 || comparisons.length > 0) && (
              <section
                className={`ph-bottom ${faqs.length > 0 && comparisons.length > 0 ? 'ph-bottom--two' : ''}`}
                style={{ '--ph-cols': 1 }}>
                {faqs.length > 0 && (
                  <div className="ph-card ph-box" id="ph-faqs">
                    <div className="ph-box-head">
                      <h3 className="ph-box-title">User Questions / FAQs</h3>
                    </div>
                    <div className="ph-faq-list">
                      {faqs.map((faq, i) => (
                        <details key={i} className="ph-faq-item">
                          <summary className="ph-faq-q">{faq.question}</summary>
                          <p className="ph-faq-a">{faq.answer}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {comparisons.length > 0 && (
                  <div className="ph-card ph-box">
                    <div className="ph-box-head">
                      <h3 className="ph-box-title">Related Comparisons</h3>
                    </div>
                    <ul className="ph-compare-list">
                      {comparisons.map((c) => (
                        <li key={c.key}>
                          <Link href={c.href} className="ph-compare-link">
                            <span>{c.label}</span>
                            <span aria-hidden="true">›</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* ================= SIDEBAR ================= */}
          <aside className="ph-aside">
            {/* Section 1: Latest News */}
            {latestNews.length > 0 && (
              <section className="ph-card ph-side-card">
                <div className="ph-side-head">
                  <h3>
                    <ArticleOutlinedIcon fontSize="inherit" />
                    Latest News
                  </h3>
                  <Link href="/news" className="ph-side-all">
                    View All →
                  </Link>
                </div>
                <ul className="ph-news-list">
                  {latestNews.map((n) => {
                    const articleId = n.externalId || n.id || n._id;
                    const cat = String(n.category || 'news').toLowerCase();
                    const date = formatDate(n.createdAt);
                    return (
                      <li key={articleId}>
                        <Link href={`/${cat}/${articleId}`} className="ph-news-item">
                          {n.image && (
                            <span className="ph-news-thumb">
                              <Image
                                src={n.image}
                                alt={n.imageAltText || n.title || ''}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="72px"
                              />
                            </span>
                          )}
                          <span className="ph-news-text">
                            <span className="ph-news-title">{n.title}</span>
                            {date && <span className="ph-news-date">{date}</span>}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Section 2: Related Phones (same brand) */}
            {relatedPhones.length > 0 && (
              <section className="ph-card ph-side-card">
                <div className="ph-side-head">
                  <h3>
                    <SmartphoneIcon fontSize="inherit" />
                    Related {capitalize(phone.brand)} Phones
                  </h3>
                  <Link
                    href={`/find?brand=${encodeURIComponent(phone.brand)}`}
                    className="ph-side-all"
                    onClick={applyBrandFilter}>
                    View All →
                  </Link>
                </div>
                <ul className="ph-related-list">
                  {relatedPhones.map((rp) => (
                    <li key={rp._id}>
                      <Link href={`/phone/${toId(rp)}`} className="ph-related-item">
                        {rp.image && (
                          <span className="ph-related-thumb">
                            <Image src={rp.image} alt={rp.name} fill style={{ objectFit: 'contain' }} sizes="38px" />
                          </span>
                        )}
                        <span className="ph-related-text">
                          <span className="ph-related-name">{rp.name}</span>
                          {rp.price ? (
                            <span className="ph-related-price">₹{Number(rp.price).toLocaleString('en-IN')}</span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Section 3: Compare Phones (is phone vs dusre brands ke phones, images ke saath) */}
            {compareCandidates.length > 0 && (
              <section className="ph-card ph-side-card">
                <div className="ph-side-head">
                  <h3>
                    <CompareArrowsIcon fontSize="inherit" />
                    Compare Phones
                  </h3>
                  <Link href="/compare" className="ph-side-all">
                    View All →
                  </Link>
                </div>
                <ul className="ph-vs-list">
                  {compareCandidates.map((p) => (
                    <li key={p._id}>
                      <Link href={compareHref(phoneId, toId(p))} className="ph-vs-item">
                        <span className="ph-vs-images">
                          <span className="ph-vs-thumb">
                            {imageList[0] && (
                              <Image
                                src={imageList[0]}
                                alt={phone.name}
                                fill
                                style={{ objectFit: 'contain' }}
                                sizes="48px"
                              />
                            )}
                          </span>
                          <span className="ph-vs-badge">VS</span>
                          <span className="ph-vs-thumb">
                            {p.image && (
                              <Image src={p.image} alt={p.name} fill style={{ objectFit: 'contain' }} sizes="48px" />
                            )}
                          </span>
                        </span>
                        <span className="ph-vs-text">
                          {phone.name} vs {p.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Section 4: Similar Price Phones */}
            {similarPrice.length > 0 && (
              <section className="ph-card ph-side-card">
                <div className="ph-side-head">
                  <h3>
                    <ListAltIcon fontSize="inherit" />
                    Similar Price Phones
                  </h3>
                  <Link
                    href={`/find?minPrice=${priceMin}&maxPrice=${priceMax}`}
                    className="ph-side-all"
                    onClick={applyPriceFilter}>
                    View All →
                  </Link>
                </div>
                <ul className="ph-related-list">
                  {similarPrice.map((rp) => (
                    <li key={rp._id}>
                      <Link href={`/phone/${toId(rp)}`} className="ph-related-item">
                        {rp.image && (
                          <span className="ph-related-thumb">
                            <Image src={rp.image} alt={rp.name} fill style={{ objectFit: 'contain' }} sizes="38px" />
                          </span>
                        )}
                        <span className="ph-related-text">
                          <span className="ph-related-name">{rp.name}</span>
                          <span className="ph-related-price">₹{Number(rp.price).toLocaleString('en-IN')}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Section 5: Phones from Other Brands */}
            {otherBrandPhones.length > 0 && (
              <section className="ph-card ph-side-card">
                <div className="ph-side-head">
                  <h3>
                    <SmartphoneIcon fontSize="inherit" />
                    Phones from Other Brands
                  </h3>
                  <Link href="/find" className="ph-side-all">
                    View All →
                  </Link>
                </div>
                <ul className="ph-related-list">
                  {otherBrandPhones.map((rp) => (
                    <li key={rp._id}>
                      <Link href={`/phone/${toId(rp)}`} className="ph-related-item">
                        {rp.image && (
                          <span className="ph-related-thumb">
                            <Image src={rp.image} alt={rp.name} fill style={{ objectFit: 'contain' }} sizes="38px" />
                          </span>
                        )}
                        <span className="ph-related-text">
                          <span className="ph-related-name">{rp.name}</span>
                          <span className="ph-related-price">
                            {capitalize(rp.brand)}
                            {rp.price ? ` · ₹${Number(rp.price).toLocaleString('en-IN')}` : ''}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Section 6: Upcoming Phones */}
            {upcomingPhones.length > 0 && (
              <section className="ph-card ph-side-card">
                <div className="ph-side-head">
                  <h3>
                    <BoltIcon fontSize="inherit" />
                    Upcoming Phones
                  </h3>
                  <Link href="/upcoming" className="ph-side-all">
                    View All →
                  </Link>
                </div>
                <ul className="ph-related-list">
                  {upcomingPhones.map((up) => (
                    <li key={up._id || toId(up)}>
                      <Link href={`/upcoming/${toId(up)}`} className="ph-related-item">
                        {up.image && (
                          <span className="ph-related-thumb">
                            <Image src={up.image} alt={up.name} fill style={{ objectFit: 'contain' }} sizes="38px" />
                          </span>
                        )}
                        <span className="ph-related-text">
                          <span className="ph-related-name">{up.name}</span>
                          <span className="ph-related-price">
                            {up.brand ? `${capitalize(up.brand)} · Upcoming` : 'Upcoming'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>

      {galleryModal}
    </div>
  );
}