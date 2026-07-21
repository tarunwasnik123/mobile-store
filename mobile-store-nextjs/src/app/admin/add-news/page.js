import { Suspense } from 'react';
import AdminAddNews from '../../components/AdminAddNews';
import AdminRoute from '../../components/AdminRoute';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <AdminRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminAddNews />
      </Suspense>
    </AdminRoute>
  );
}