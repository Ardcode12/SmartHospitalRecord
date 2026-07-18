import React, { useEffect, useState } from 'react';
import { UserCheck, Users, Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboard } from '../../api/hospitalApi';
import StatusBadge from '../common/StatusBadge';
import Loader from '../common/Loader';

export default function HospitalDashboard() {
  const { hospital } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospital?.id) return;
    getDashboard(hospital.id)
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hospital]);

  if (loading) return <Loader />;

  const STAT_CARDS = [
    { label: 'Approved Doctors', value: stats?.total_doctors ?? 0, icon: UserCheck, color: '#00d4b8', accentVar: 'var(--accent-teal)' },
    { label: 'Pending Approvals', value: stats?.pending_doctors ?? 0, icon: AlertCircle, color: '#fbbf24', accentVar: 'var(--accent-amber)' },
    { label: 'Registered Patients', value: stats?.total_patients ?? 0, icon: Users, color: '#4f8ef7', accentVar: 'var(--accent-blue)' },
    { label: "Today's Appointments", value: stats?.today_appointments ?? 0, icon: Calendar, color: '#a78bfa', accentVar: 'var(--accent-purple)' },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back — here's what's happening at <strong style={{ color: 'var(--accent-teal)' }}>{hospital?.name}</strong>
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--text-muted)', fontSize:'0.8rem' }}>
          <Clock size={14} />
          {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, accentVar }) => (
          <div key={label} className="stat-card" style={{ '--accent-color': accentVar }}>
            <div className="stat-icon" style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Appointments</h2>
          <TrendingUp size={16} color="var(--text-muted)" />
        </div>
        {!stats?.recent_appointments?.length ? (
          <div className="empty-state">
            <Calendar size={40} className="empty-state-icon" />
            <h3>No appointments yet</h3>
            <p>Appointments assigned will appear here</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_appointments.map(appt => (
                  <tr key={appt.id}>
                    <td>{appt.patient_name || appt.patient_id?.slice(0,8)}</td>
                    <td>{appt.doctor_name || appt.doctor_id?.slice(0,8)}</td>
                    <td>{appt.appointment_date}</td>
                    <td style={{ color: 'var(--accent-teal)', fontWeight:500 }}>{appt.start_time?.slice(0,5)}</td>
                    <td><StatusBadge status={appt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
