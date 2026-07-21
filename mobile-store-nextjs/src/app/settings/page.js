import SettingsPage from '../components/SettingsPage';
import ProtectedRoute from '../components/ProtectedRoute';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ProtectedRoute element={<SettingsPage />} />;
}