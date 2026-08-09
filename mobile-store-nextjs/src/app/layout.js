import { Suspense } from 'react';
import Script from 'next/script';
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
      <body style={{ margin: 0, padding: 0 }} suppressHydrationWarning>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9YM4PH9ML7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9YM4PH9ML7');
          `}
        </Script>

        <Providers>
          <Suspense fallback={null}>
            <ScrollToTop />
            <Header />
          </Suspense>
          {children}
          <Footer />
          <CompareTray />
        </Providers>
      </body>
    </html>
  );
}