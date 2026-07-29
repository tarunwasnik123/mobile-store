import Link from 'next/link';
import Image from 'next/image';
import './AuthorProfile.css';

export default function AuthorProfile() {
  return (
    <div className="author-profile-page">
      <div className="author-profile-container">
        <Link href="/news" className="back-link">
          Back to News
        </Link>

        <div className="author-header">
          <div className="author-avatar">
            <Image
              src="/AuthorTarun.jpeg"
              alt="Tarun - Founder & Editor"
              fill
              style={{ objectFit: 'cover' }}
              sizes="120px"
            />
          </div>
          <div className="author-info">
            <h1>Tarun</h1>
            <p className="author-role">Mobile Technology Expert & Editor</p>
          </div>
        </div>

        <div className="author-content">
          <div className="author-bio">
            <h2>About Tarun</h2>
            <p>
              Tarun Wasnik is the Founder & Editor of Handsetnews, a passionate tech journalist and developer with years of hands-on experience in the mobile technology space. He has tested and reviewed hundreds of smartphones, breaking down complex specs into simple, honest insights for everyday readers. Known for his detailed comparisons and unbiased reviews, Tarun's mission is simple — help readers make smarter buying decisions with accurate, up-to-date information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}