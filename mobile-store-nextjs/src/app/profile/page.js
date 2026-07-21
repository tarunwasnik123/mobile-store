import ProfilePage from '../components/ProfilePage';
import ProtectedRoute from '../components/ProtectedRoute';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ProtectedRoute element={<ProfilePage />} />;
}