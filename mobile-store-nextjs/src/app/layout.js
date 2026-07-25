import { Suspense } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import Providers from './components/Providers';
import Header from './components/Header';
import Footer from './components/Footer';
import CompareTray from './components/CompareTray';
import ScrollToTop from './components/ScrollToTop';

export const metadata = {
  title: 'Latest Mobile News, Phone Reviews & Specs | Handset News',
  description:
    'Get real-time updates on mobile phone launches, specs & price comparisons. Read expert tech reviews and mobile compare blogs in easy Hinglish on Handset News!',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <Header />
          {children}
          <Footer />
          <CompareTray />
        </Providers>
      </body>
    </html>
  );
}