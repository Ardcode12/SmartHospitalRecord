import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';


import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HospitalPortal from './pages/HospitalPortal';
import DoctorPortal from './pages/DoctorPortal';
import PatientPortal from './pages/PatientPortal';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Hospital Admin */}
          <Route
            path="/hospital/*"
            element={
              <ProtectedRoute allowedRole="hospital_admin">
                <HospitalPortal />
              </ProtectedRoute>
            }
          />

          {/* Doctor (stub) */}
          <Route
            path="/doctor/*"
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorPortal />
              </ProtectedRoute>
            }
          />

          {/* Patient (stub) */}
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientPortal />
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          theme="dark"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
