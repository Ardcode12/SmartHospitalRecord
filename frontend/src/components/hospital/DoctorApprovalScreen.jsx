import React, { useEffect, useState, useCallback } from 'react';
import {
  UserCheck, UserPlus, Search, RefreshCw, CheckCircle2, XCircle, ShieldOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listHospitalDoctors, approveDoctor, rejectDoctor, revokeDoctor } from '../../api/doctorApi';
import StatusBadge from '../common/StatusBadge';
import Loader from '../common/Loader';
import DoctorInviteForm from './DoctorInviteForm';
import { toast } from 'react-toastify';

const TABS = ['all', 'pending', 'approved', 'rejected'];

export default function DoctorApprovalScreen() {
  const { hospital } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async () => {
    if (!hospital?.id) return;
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const { data } = await listHospitalDoctors(hospital.id, status);
      setDoctors(data);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [hospital, activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (doctorId, action) => {
    setActionLoading(prev => ({ ...prev, [doctorId]: action }));
    try {
      const fns = { approve: approveDoctor, reject: rejectDoctor, revoke: revokeDoctor };
      await fns[action](hospital.id, doctorId);
      toast.success(`Doctor ${action}d successfully`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${action} doctor`);
    } finally {
      setActionLoading(prev => ({ ...prev, [doctorId]: null }));
    }
  };

  const filtered = doctors.filter(d =>
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    (d.license_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Management</h1>
          <p className="page-subtitle">Manage doctor approvals and hospital affiliations</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
            <UserPlus size={14} /> Invite Doctor
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="filter-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ flex:1, minWidth:200, maxWidth:360 }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search by name, specialization, license…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? <Loader /> : (
          filtered.length === 0 ? (
            <div className="empty-state">
              <UserCheck size={44} className="empty-state-icon" />
              <h3>No doctors found</h3>
              <p>Invite a doctor to get started</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>License No.</th>
                    <th>Exp.</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:32, height:32, borderRadius:'50%',
                            background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'0.8rem', fontWeight:700, color:'#fff', flexShrink:0,
                          }}>
                            {doc.full_name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{doc.full_name}</div>
                            {doc.phone && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{doc.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color:'var(--accent-teal)', fontWeight:500 }}>{doc.specialization}</td>
                      <td style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{doc.license_number || '—'}</td>
                      <td style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                        {doc.years_experience ? `${doc.years_experience}y` : '—'}
                      </td>
                      <td><StatusBadge status={doc.status} /></td>
                      <td style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                        {doc.requested_at ? new Date(doc.requested_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          {doc.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleAction(doc.id, 'approve')}
                                disabled={!!actionLoading[doc.id]}
                              >
                                <CheckCircle2 size={13} />
                                {actionLoading[doc.id] === 'approve' ? '…' : 'Approve'}
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleAction(doc.id, 'reject')}
                                disabled={!!actionLoading[doc.id]}
                              >
                                <XCircle size={13} />
                                {actionLoading[doc.id] === 'reject' ? '…' : 'Reject'}
                              </button>
                            </>
                          )}
                          {doc.status === 'approved' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleAction(doc.id, 'revoke')}
                              disabled={!!actionLoading[doc.id]}
                            >
                              <ShieldOff size={13} />
                              {actionLoading[doc.id] === 'revoke' ? '…' : 'Revoke'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {showInvite && (
        <DoctorInviteForm
          hospitalId={hospital?.id}
          onClose={() => setShowInvite(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
