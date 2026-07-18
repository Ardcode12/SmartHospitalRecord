import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listPatients } from '../../api/patientApi';
import Loader from '../common/Loader';
import { useNavigate } from 'react-router-dom';

export default function PatientList() {
  const { hospital } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!hospital?.id) return;
    setLoading(true);
    try {
      const { data } = await listPatients(hospital.id, search || undefined);
      setPatients(data);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [hospital, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage patients registered to your hospital</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div className="search-bar" style={{ flex:1, maxWidth:400 }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? <Loader /> : patients.length === 0 ? (
          <div className="empty-state">
            <Users size={44} className="empty-state-icon" />
            <h3>No patients found</h3>
            <p>{search ? 'Try a different search term' : 'Patients registered to this hospital will appear here'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Date of Birth</th>
                  <th>Emergency Contact</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr
                    key={p.id}
                    style={{ cursor:'pointer' }}
                    onClick={() => navigate(`/hospital/patients/${p.id}/records`)}
                  >
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:32, height:32, borderRadius:'50%',
                          background:'linear-gradient(135deg,var(--accent-teal),var(--accent-blue))',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'0.8rem', fontWeight:700, color:'#fff', flexShrink:0,
                        }}>
                          {p.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{p.full_name}</div>
                          {p.phone && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{p.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>{p.gender || '—'}</td>
                    <td>
                      {p.blood_group ? (
                        <span className="badge badge-scheduled">{p.blood_group}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{p.date_of_birth || '—'}</td>
                    <td style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{p.emergency_contact || '—'}</td>
                    <td><ChevronRight size={16} color="var(--text-muted)" /></td>
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
