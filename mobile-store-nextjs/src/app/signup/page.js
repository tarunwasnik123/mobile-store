import SignupPage from '../components/SignupPage';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <SignupPage />;
}