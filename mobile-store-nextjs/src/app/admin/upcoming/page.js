import { Suspense } from 'react';
import AdminUpcoming from '../../components/AdminUpcoming';
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
        <AdminUpcoming />
      </Suspense>
    </AdminRoute>
  );
}