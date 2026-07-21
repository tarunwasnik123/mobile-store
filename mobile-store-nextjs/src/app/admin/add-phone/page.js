import { Suspense } from 'react';
import AdminAddPhone from '../../components/AdminAddPhone';
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
        <AdminAddPhone />
      </Suspense>
    </AdminRoute>
  );
}