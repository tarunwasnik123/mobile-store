import LoginPage from '../components/LoginPage';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <LoginPage />;
}