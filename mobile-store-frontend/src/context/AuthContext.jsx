import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('ms:user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  /* =======================
     Sync user to storage
     ======================= */
  useEffect(() => {
    try {
      if (user) localStorage.setItem('ms:user', JSON.stringify(user));
      else localStorage.removeItem('ms:user');
    } catch {}
  }, [user]);

  /* =======================
     Keep role in sync
     ======================= */
  useEffect(() => {
    try {
      const role = user?.role || 'user';
      localStorage.setItem('ms:role', role);
    } catch {}
  }, [user]);

  /* =======================
     Restore session on reload (using HttpOnly cookie)
     ======================= */
  const fetchUser = async () => {
    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (error) {
      // 401 means not authenticated — expected on anonymous visits, don't spam console
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

  /* =======================
     SIGNUP (AUTO LOGIN)
     ======================= */
  const signup = async ({ name, email, password }) => {
    const res = await api.post('/auth/signup', {
      name,
      email,
      password,
    });

    // server sets HttpOnly cookie; set user from response
    setUser(res.user);
    setIsAuthLoading(false);

    return res;
  };

  /* =======================
     LOGIN
     ======================= */
  const login = async ({ email, password }) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    });

    // server sets HttpOnly cookie; set user from response
    setUser(res.user);
    setIsAuthLoading(false);

    return res;
  };

  /* =======================
     LOGOUT
     ======================= */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore errors on logout
    }

    localStorage.removeItem('ms:user');
    setUser(null);
    setIsAuthLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        signup,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
