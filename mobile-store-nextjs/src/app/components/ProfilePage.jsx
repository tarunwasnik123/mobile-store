'use client';

import './ProfilePage.css';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <h1>My Profile</h1>

        <div className="profile-row">
          <span>Name</span>
          <p>{user.name}</p>
        </div>

        <div className="profile-row">
          <span>Email</span>
          <p>{user.email}</p>
        </div>

        <div className="profile-row">
          <span>Role</span>
          <p>{user.role}</p>
        </div>
      </div>
    </div>
  );
}