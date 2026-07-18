import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, User, Mail, Lock, Eye, EyeOff, Loader2, Hospital, Stethoscope, Users } from 'lucide-react';
import { register } from '../api/authApi';
import { getMe } from '../api/authApi';
import { getMyHospital } from '../api/hospitalApi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ROLES = [
  { value:'hospital_admin', label:'Hospital Admin', icon: Hospital, desc: 'Register & manage a hospital' },
  { value:'doctor',         label:'Doctor',         icon: Stethoscope, desc: 'Join hospitals, manage availability' },
  { value:'patient',        label:'Patient',        icon: Users, desc: 'View records & appointments' },
];

export default function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('hospital_admin');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email:'', password:'', full_name:'', phone:'',
    specialization:'', qualification:'', years_experience:'', license_number:'',
    date_of_birth:'', gender:'', blood_group:'', emergency_contact:'',
    hospital_name:'', hospital_address:'', hospital_city:'',
    hospital_contact_email:'', hospital_contact_phone:'',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        email: form.email, password: form.password,
        role, full_name: form.full_name, phone: form.phone || undefined,
      };
      if (role === 'hospital_admin') {
        Object.assign(payload, {
          hospital_name: form.hospital_name,
          hospital_address: form.hospital_address || undefined,
          hospital_city: form.hospital_city || undefined,
          hospital_contact_email: form.hospital_contact_email || undefined,
          hospital_contact_phone: form.hospital_contact_phone || undefined,
        });
      } else if (role === 'doctor') {
        Object.assign(payload, {
          specialization: form.specialization,
          qualification: form.qualification || undefined,
          years_experience: form.years_experience ? Number(form.years_experience) : undefined,
          license_number: form.license_number || undefined,
        });
      } else {
        Object.assign(payload, {
          date_of_birth: form.date_of_birth || undefined,
          gender: form.gender || undefined,
          blood_group: form.blood_group || undefined,
          emergency_contact: form.emergency_contact || undefined,
        });
      }

      const { data: tokenData } = await register(payload);
      localStorage.setItem('access_token', tokenData.access_token);
      const { data: profile } = await getMe();
      let hospital = null;
      if (profile.role === 'hospital_admin') {
        try { hospital = (await getMyHospital()).data; } catch {}
      }
      signIn(tokenData.access_token, profile, hospital);

      toast.success('Account created!');
      const redirectMap = {
        hospital_admin: '/hospital/dashboard',
        doctor: '/doctor/dashboard',
        patient: '/patient/dashboard',
      };
      navigate(redirectMap[role]);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card animate-slide-up" style={{ maxWidth:560 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon"><Activity size={22} /></div>
          <span className="auth-logo-text">SmartHospital<span style={{ color:'var(--accent-teal)' }}>Records</span></span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Choose your role to get started</p>

        {/* Role selector */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:24 }}>
          {ROLES.map(({ value, label, icon: Icon, desc }) => (
            <button key={value} type="button"
              onClick={() => setRole(value)}
              style={{
                padding:'12px 8px', borderRadius:'var(--radius-md)', textAlign:'center',
                border: `1px solid ${role === value ? 'var(--accent-teal)' : 'var(--border)'}`,
                background: role === value ? 'rgba(0,212,184,0.08)' : 'rgba(255,255,255,0.02)',
                color: role === value ? 'var(--accent-teal)' : 'var(--text-secondary)',
                transition:'all 0.15s', cursor:'pointer',
              }}>
              <Icon size={18} style={{ marginBottom:4 }} />
              <div style={{ fontSize:'0.75rem', fontWeight:600 }}>{label}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Common fields */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Dr. John Doe" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="search-bar">
                <Lock size={14} color="var(--text-muted)" />
                <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
                <button type="button" style={{ background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer' }}
                  onClick={() => setShowPw(s => !s)}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Hospital Admin fields */}
          {role === 'hospital_admin' && (
            <>
              <div className="form-group">
                <label className="form-label">Hospital Name *</label>
                <input className="form-input" placeholder="City General Hospital" value={form.hospital_name} onChange={set('hospital_name')} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" placeholder="123 Medical Ave" value={form.hospital_address} onChange={set('hospital_address')} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" placeholder="Mumbai" value={form.hospital_city} onChange={set('hospital_city')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Hospital Email</label>
                  <input className="form-input" type="email" placeholder="contact@hospital.com" value={form.hospital_contact_email} onChange={set('hospital_contact_email')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hospital Phone</label>
                  <input className="form-input" placeholder="+91 22 1234 5678" value={form.hospital_contact_phone} onChange={set('hospital_contact_phone')} />
                </div>
              </div>
            </>
          )}

          {/* Doctor fields */}
          {role === 'doctor' && (
            <>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <input className="form-input" placeholder="Cardiology" value={form.specialization} onChange={set('specialization')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Qualification</label>
                  <input className="form-input" placeholder="MBBS, MD" value={form.qualification} onChange={set('qualification')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <input className="form-input" type="number" placeholder="5" value={form.years_experience} onChange={set('years_experience')} />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input className="form-input" placeholder="MCI-2024-001" value={form.license_number} onChange={set('license_number')} />
                </div>
              </div>
            </>
          )}

          {/* Patient fields */}
          {role === 'patient' && (
            <>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={set('gender')}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={form.blood_group} onChange={set('blood_group')}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input className="form-input" placeholder="+91 98765 00000" value={form.emergency_contact} onChange={set('emergency_contact')} />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary w-full btn-lg" style={{ marginTop:8 }} disabled={loading}>
            {loading ? <Loader2 size={18} /> : null}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
