import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    // Redirect to appropriate portal
    const redirectMap = {
      hospital_admin: '/hospital/dashboard',
      doctor: '/doctor/dashboard',
      patient: '/patient/dashboard',
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }
  return children;
}
