import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCheck, Users, FileText,
  Calendar, LogOut, Activity, Hospital
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/hospital/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hospital/doctors',   icon: UserCheck,       label: 'Doctors' },
  { to: '/hospital/patients',  icon: Users,           label: 'Patients' },
  { to: '/hospital/records',   icon: FileText,        label: 'Records' },
  { to: '/hospital/appointments', icon: Calendar,     label: 'Appointments' },
];

export default function Sidebar() {
  const { user, hospital, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1rem' }}>
              SmartHospital
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Records Platform</div>
          </div>
        </div>
      </div>

      {/* Hospital info */}
      {hospital && (
        <div style={{
          margin: '16px 12px 4px',
          padding: '12px',
          background: 'rgba(0,212,184,0.06)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(0,212,184,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hospital size={14} color="var(--accent-teal)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
              {hospital.name}
            </span>
          </div>
          {hospital.city && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, paddingLeft: 22 }}>
              {hospital.city}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '10px 8px 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Main Menu
        </div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 2,
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(0,212,184,0.08)' : 'transparent',
              border: isActive ? '1px solid rgba(0,212,184,0.15)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            <Icon size={17} />
            <span style={{ flex: 1 }}>{label}</span>
            {/* active indicator */}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,0.03)',
          marginBottom: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user?.full_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Hospital Admin</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            transition: 'all 0.15s',
            border: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.color='var(--accent-rose)'; e.currentTarget.style.background='rgba(248,113,113,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.background='transparent'; }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
