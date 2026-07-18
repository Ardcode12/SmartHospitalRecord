import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import HospitalDashboard from '../components/hospital/HospitalDashboard';
import DoctorApprovalScreen from '../components/hospital/DoctorApprovalScreen';
import PatientList from '../components/hospital/PatientList';
import PatientRecordUpload from '../components/hospital/PatientRecordUpload';
import AppointmentManager from '../components/hospital/AppointmentManager';

export default function HospitalPortal() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="dashboard"              element={<HospitalDashboard />} />
          <Route path="doctors"                element={<DoctorApprovalScreen />} />
          <Route path="patients"               element={<PatientList />} />
          <Route path="patients/:patientId/records" element={<PatientRecordUpload />} />
          <Route path="records"                element={<PatientList />} />
          <Route path="appointments"           element={<AppointmentManager />} />
          <Route path="*"                      element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
