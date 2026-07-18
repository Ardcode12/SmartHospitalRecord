import React from 'react';
import { Activity } from 'lucide-react';

// Stub — Doctor portal not in scope for this build
export default function DoctorPortal() {
  return (
    <div className="auth-bg">
      <div className="auth-card animate-slide-up" style={{ textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div className="auth-logo-icon"><Activity size={22} /></div>
        </div>
        <h2 style={{ marginBottom:8 }}>Doctor Portal</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>
          Coming soon. Please use the mobile app or ask your hospital admin.
        </p>
      </div>
    </div>
  );
}
