import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, Filter, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listHospitalAppointments, updateAppointmentStatus } from '../../api/appointmentsApi';
import { listHospitalDoctors } from '../../api/doctorApi';
import StatusBadge from '../common/StatusBadge';
import Loader from '../common/Loader';
import AssignAppointmentModal from './AssignAppointmentModal';
import { toast } from 'react-toastify';

const STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'];

export default function AppointmentManager() {
  const { hospital } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [filters, setFilters] = useState({ date: '', doctor_id: '', status: '' });

  const load = useCallback(async () => {
    if (!hospital?.id) return;
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.doctor_id) params.doctor_id = filters.doctor_id;
      if (filters.status) params.status = filters.status;

      const [apptRes, docRes] = await Promise.all([
        listHospitalAppointments(hospital.id, params),
        listHospitalDoctors(hospital.id, 'approved'),
      ]);
      setAppointments(apptRes.data);
      setDoctors(docRes.data);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [hospital, filters]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success(`Marked as ${status}`);
      load();
    } catch {
      toast.error('Status update failed');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage and assign patient appointments</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
            <Plus size={15} /> Assign Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <Filter size={15} color="var(--text-muted)" />
          <div className="form-group" style={{ margin:0, flex:'1 1 160px' }}>
            <input type="date" className="form-input" value={filters.date}
              onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              placeholder="Filter by date" />
          </div>
          <div className="form-group" style={{ margin:0, flex:'1 1 200px' }}>
            <select className="form-select" value={filters.doctor_id}
              onChange={e => setFilters(f => ({ ...f, doctor_id: e.target.value }))}>
              <option value="">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.full_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin:0, flex:'1 1 160px' }}>
            <select className="form-select" value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(filters.date || filters.doctor_id || filters.status) && (
            <button className="btn btn-ghost btn-sm"
              onClick={() => setFilters({ date:'', doctor_id:'', status:'' })}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <Loader /> : appointments.length === 0 ? (
          <div className="empty-state">
            <Calendar size={44} className="empty-state-icon" />
            <h3>No appointments found</h3>
            <p>Assign an appointment to get started</p>
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
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.id}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{appt.patient_name || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize:'0.875rem' }}>Dr. {appt.doctor_name || '—'}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--accent-teal)' }}>{appt.doctor_specialization}</div>
                    </td>
                    <td style={{ fontWeight:500 }}>{appt.appointment_date}</td>
                    <td style={{ color:'var(--accent-teal)', fontWeight:600 }}>
                      {appt.start_time?.slice(0,5)} – {appt.end_time?.slice(0,5)}
                    </td>
                    <td style={{ fontSize:'0.8rem', color:'var(--text-secondary)', maxWidth:160 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {appt.reason_for_visit || '—'}
                      </div>
                    </td>
                    <td><StatusBadge status={appt.status} /></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {appt.status === 'scheduled' && (
                          <>
                            <button className="btn btn-success btn-sm"
                              onClick={() => handleStatusUpdate(appt.id, 'completed')}>
                              <CheckCircle2 size={13} /> Done
                            </button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => handleStatusUpdate(appt.id, 'cancelled')}>
                              <XCircle size={13} /> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAssign && (
        <AssignAppointmentModal
          onClose={() => setShowAssign(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
