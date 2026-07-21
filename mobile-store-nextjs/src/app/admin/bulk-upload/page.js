import AdminBulkUpload from '../../components/AdminBulkUpload';
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
      <AdminBulkUpload />
    </AdminRoute>
  );
}