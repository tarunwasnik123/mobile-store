import AdminDashboard from '../components/AdminDashboard';
import AdminRoute from '../components/AdminRoute';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}