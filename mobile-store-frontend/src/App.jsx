import React, { Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import './App.css';
import { useAuth } from './context/AuthContext';

import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import CompareTray from './components/CompareTray';
import ProtectedRoute from './components/ProtectedRoute';
import SEO from './components/SEO';
import AdminRoute from './components/AdminRoute';

const HomePage = React.lazy(() => import('./components/HomePage'));
const UpcomingPhones = React.lazy(() => import('./components/UpcomingPhones'));
const LatestPage = React.lazy(() => import('./pages/LatestPage'));
const BestPage = React.lazy(() => import('./pages/BestPage'));
const FindPage = React.lazy(() => import('./pages/FindPage'));
const PhoneDetail = React.lazy(() => import('./pages/PhoneDetail'));
const UpcomingPhoneDetail = React.lazy(
  () => import('./pages/UpcomingPhoneDetail'),
);
const ComparisonPage = React.lazy(() => import('./components/ComparisonPage'));
const NewsList = React.lazy(() => import('./pages/NewsList'));
const NewsDetail = React.lazy(() => import('./pages/NewsDetail'));
const AuthorProfile = React.lazy(() => import('./pages/AuthorProfile'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsAndConditions'));
const Contact = React.lazy(() => import('./pages/ContactUs'));
const FAQsPage = React.lazy(() => import('./pages/FAQsPage'));
const HowWeWorkPage = React.lazy(() => import('./pages/HowWeWorkPage'));
const DisclaimerPage = React.lazy(() => import('./pages/Disclaimer'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminAddPhone = React.lazy(() => import('./pages/AdminAddPhone'));
const AdminAddNews = React.lazy(() => import('./pages/AdminAddNews'));
const AdminUpcoming = React.lazy(() => import('./pages/AdminUpcoming'));
const AdminBulkUpload = React.lazy(() => import('./pages/AdminBulkUpload'));

const categoryLabels = {
  news: 'News',
  leaks: 'Leaks',
  reviews: 'Reviews',
};

const pageMetaMap = {
  '/': {
    title: 'Latest Mobile News, Phone Reviews & Specs | Handset News',
    description:
      'Get real-time updates on mobile phone launches, specs & price comparisons. Read expert tech reviews and mobile compare blogs in easy Hinglish on Handset News!',
  },
  '/find': {
    title: 'Find Phones | Handsetnews',
    description:
      'Search smartphones by price, brand, specs, and compare top models before you buy.',
  },
  '/latest': {
    title: 'Latest Phones | Handsetnews',
    description:
      'Explore the latest smartphone launches and newest mobile releases.',
  },
  '/best': {
    title: 'Best Phones | Handsetnews',
    description:
      'See the best-rated phones by price, performance, and features in one place.',
  },
  '/upcoming': {
    title: 'Upcoming Phones | Handsetnews',
    description: 'Browse the most anticipated upcoming smartphone launches.',
  },
  '/compare': {
    title: 'Compare Phones | Handsetnews',
    description:
      'Compare smartphones side-by-side with specs, prices, and reviews.',
  },
  '/author/tarun': {
    title: 'Author — Tarun | Handsetnews',
    description:
      'Read articles and insights from Tarun on smartphones and technology.',
  },
  '/about': {
    title: 'About Us | Handsetnews',
    description:
      'Learn about Handsetnews and how we help you choose the right phone.',
  },
  '/privacy': {
    title: 'Privacy Policy | Handsetnews',
    description:
      'Review Handsetnews privacy policies and data handling practices.',
  },
  '/terms-of-service': {
    title: 'Terms of Service | Handsetnews',
    description:
      'Read the terms of use for Handsetnews services and website usage.',
  },
  '/contact': {
    title: 'Contact Us | Handsetnews',
    description:
      'Get in touch with the Handsetnews team for questions and support.',
  },
  '/faq': {
    title: 'FAQ | Handsetnews',
    description:
      'Find answers to common questions about Handsetnews and smartphone guidance.',
  },
  '/how-we-work': {
    title: 'How We Work | Handsetnews',
    description:
      'Understand how Handsetnews curates phones, reviews, and comparison data.',
  },
  '/disclaimer': {
    title: 'Disclaimer | Handsetnews',
    description:
      'Read the disclaimer and legal information for Handsetnews content.',
  },
  '/login': {
    title: 'Login | Handsetnews',
    description:
      'Access your Handsetnews account to customize your phone search experience.',
  },
  '/signup': {
    title: 'Signup | Handsetnews',
    description:
      'Create a Handsetnews account to save favorites and compare phones.',
  },
  '/profile': {
    title: 'Profile | Handsetnews',
    description:
      'Manage your Handsetnews profile, preferences, and saved comparisons.',
  },
  '/settings': {
    title: 'Settings | Handsetnews',
    description:
      'Update your Handsetnews account settings and notification preferences.',
  },
  '/admin': {
    title: 'Admin Dashboard | Handsetnews',
    description:
      'Manage news, phones, upcoming launches, and bulk uploads from the admin panel.',
  },
};

function getCategoryTitle(category) {
  return (
    categoryLabels[category] ||
    category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
  );
}

function getDefaultMeta(pathname) {
  if (pageMetaMap[pathname]) {
    return pageMetaMap[pathname];
  }

  const segments = pathname.split('/').filter(Boolean);
  const baseDescription =
    'Explore smartphones, reviews, news, and detailed comparisons on Handsetnews.';

  if (segments.length === 0) {
    return pageMetaMap['/'];
  }

  const [first, second] = segments;

  if (first === 'phone' && second) {
    return {
      title: 'Phone Details | Handsetnews',
      description:
        'View full phone specifications, pricing, and related smartphone reviews.',
    };
  }

  if (first === 'upcoming' && second) {
    return {
      title: 'Upcoming Phone Details | Handsetnews',
      description:
        'Learn more about upcoming smartphone launches, specs, and expected release dates.',
    };
  }

  if (first === 'author') {
    return {
      title: 'Author Profile | Handsetnews',
      description: 'Read author profiles and their latest smartphone insights.',
    };
  }

  if (['news', 'leaks', 'reviews'].includes(first) && !second) {
    return {
      title: `${getCategoryTitle(first)} | Handsetnews`,
      description: `Read the latest ${getCategoryTitle(first)} and smartphone news on Handsetnews.`,
    };
  }

  if (['news', 'leaks', 'reviews'].includes(first) && second) {
    return {
      title: 'Article | Handsetnews',
      description: baseDescription,
    };
  }

  return {
    title: `Handsetnews | ${first.charAt(0).toUpperCase() + first.slice(1)}`,
    description: baseDescription,
  };
}

function DefaultPageMeta() {
  const location = useLocation();
  const meta = getDefaultMeta(location.pathname);

  return <SEO title={meta.title} description={meta.description} />;
}

function App() {
  const { isAuthLoading } = useAuth();

  // Don't block the whole app render on auth load — render header/footer immediately
  // and show a small non-blocking loading banner while the session is restoring.

  return (
    <Router>
      <ScrollToTop />
      <Header />
      <DefaultPageMeta />

      {isAuthLoading && (
        <div className="auth-loading-banner">Restoring session…</div>
      )}

      <Suspense fallback={<div className="route-loading">Loading...</div>}>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Phones */}
          <Route path="/find" element={<FindPage />} />
          <Route path="/latest" element={<LatestPage />} />
          <Route path="/best" element={<BestPage />} />
          <Route path="/upcoming" element={<UpcomingPhones />} />

          {/* Phone Detail */}
          <Route path="/phone/:id" element={<PhoneDetail />} />
          <Route path="/upcoming/:id" element={<UpcomingPhoneDetail />} />

          {/* Compare */}
          <Route path="/compare" element={<ComparisonPage />} />

          {/* Footer Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQsPage />} />
          <Route path="/how-we-work" element={<HowWeWorkPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />

          {/* News & Reviews - Dynamic Categories */}
          <Route path="/:category" element={<NewsList />} />
          <Route path="/:category/:id" element={<NewsDetail />} />
          <Route path="/author/tarun" element={<AuthorProfile />} />

          {/* User */}
          <Route
            path="/profile"
            element={<ProtectedRoute element={<ProfilePage />} />}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute element={<SettingsPage />} />}
          />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/add-phone"
            element={
              <AdminRoute>
                <AdminAddPhone />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/add-news"
            element={
              <AdminRoute>
                <AdminAddNews />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/upcoming"
            element={
              <AdminRoute>
                <AdminUpcoming />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bulk-upload"
            element={
              <AdminRoute>
                <AdminBulkUpload />
              </AdminRoute>
            }
          />
        </Routes>
      </Suspense>

      <Footer />
      <CompareTray />
    </Router>
  );
}

export default App;
