import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // 🔒 Not logged in → go home
  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // 🚫 Logged in but not admin → go home
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
