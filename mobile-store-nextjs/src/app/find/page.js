import { Suspense } from 'react';
import FindPage from '../components/FindPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FindPage />
    </Suspense>
  );
}