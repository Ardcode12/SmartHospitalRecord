import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/authApi';
import { getMyHospital } from '../api/hospitalApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // profile from /auth/me
  const [hospital, setHospital] = useState(null); // hospital for admin users
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data: profile } = await getMe();
      setUser(profile);
      if (profile.role === 'hospital_admin') {
        try {
          const { data: hosp } = await getMyHospital();
          setHospital(hosp);
        } catch { /* hospital may not exist yet */ }
      }
    } catch {
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const signIn = (token, userData, hospitalData) => {
    localStorage.setItem('access_token', token);
    setUser(userData);
    if (hospitalData) setHospital(hospitalData);
  };

  const signOut = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setHospital(null);
  };

  return (
    <AuthContext.Provider value={{ user, hospital, loading, signIn, signOut, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
