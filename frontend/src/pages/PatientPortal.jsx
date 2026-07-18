import React from 'react';
import { Activity } from 'lucide-react';

// Stub — Patient portal not in scope for this build
export default function PatientPortal() {
  return (
    <div className="auth-bg">
      <div className="auth-card animate-slide-up" style={{ textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div className="auth-logo-icon"><Activity size={22} /></div>
        </div>
        <h2 style={{ marginBottom:8 }}>Patient Portal</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>
          Coming soon. Your appointments and records will be accessible here.
        </p>
      </div>
    </div>
  );
}
