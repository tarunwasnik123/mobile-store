'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('ms:user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('ms:user', JSON.stringify(user));
      else localStorage.removeItem('ms:user');
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      const role = user?.role || 'user';
      localStorage.setItem('ms:role', role);
    } catch {}
  }, [user]);

  const fetchUser = async () => {
    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (error) {
      if (error && error.status === 401) {
        localStorage.removeItem('ms:user');
        setUser(null);
      } else {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('ms:user');
        setUser(null);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signup = async ({ name, email, password }) => {
    const res = await api.post('/auth/signup', { name, email, password });
    setUser(res.user);
    setIsAuthLoading(false);
    return res;
  };

  const login = async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.user);
    setIsAuthLoading(false);
    return res;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {}
    localStorage.removeItem('ms:user');
    setUser(null);
    setIsAuthLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;