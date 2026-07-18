import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '../api/authApi';
import { getMyHospital } from '../api/hospitalApi';
import { getMe } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: tokenData } = await login(form);
      localStorage.setItem('access_token', tokenData.access_token);

      const { data: profile } = await getMe();
      let hospital = null;
      if (profile.role === 'hospital_admin') {
        try { const h = await getMyHospital(); hospital = h.data; } catch {}
      }
      signIn(tokenData.access_token, profile, hospital);

      const redirectMap = {
        hospital_admin: '/hospital/dashboard',
        doctor: '/doctor/dashboard',
        patient: '/patient/dashboard',
      };
      navigate(redirectMap[profile.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Activity size={22} />
          </div>
          <span className="auth-logo-text">SmartHospital<span style={{ color:'var(--accent-teal)' }}>Records</span></span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="search-bar">
              <Mail size={15} color="var(--text-muted)" />
              <input
                type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="search-bar">
              <Lock size={15} color="var(--text-muted)" />
              <input
                type={showPw ? 'text' : 'password'} placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <button type="button" style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}
                onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" style={{ marginTop:8 }} disabled={loading}>
            {loading ? <Loader2 size={18} /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
