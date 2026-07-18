import React, { useState, useEffect } from 'react';
import { X, Search, ChevronRight, ChevronLeft, Calendar, Clock, User, Stethoscope, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listPatients } from '../../api/patientApi';
import { listHospitalDoctors, getFreeSlots } from '../../api/doctorApi';
import { listPatientRecords } from '../../api/recordsApi';
import { createAppointment } from '../../api/appointmentsApi';
import { toast } from 'react-toastify';

const STEPS = ['Select Patient', 'Choose Doctor', 'Pick Time Slot', 'Confirm'];

export default function AssignAppointmentModal({ onClose, onSuccess }) {
  const { hospital } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0
  const [patients, setPatients] = useState([]);
  const [patSearch, setPatSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Step 1
  const [doctors, setDoctors] = useState([]);
  const [docSearch, setDocSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');

  // Step 2
  const [freeSlots, setFreeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Step 3
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Load patients
  useEffect(() => {
    if (!hospital?.id) return;
    listPatients(hospital.id, patSearch || undefined)
      .then(r => setPatients(r.data))
      .catch(() => {});
  }, [hospital, patSearch]);

  // Load approved doctors
  useEffect(() => {
    if (!hospital?.id) return;
    listHospitalDoctors(hospital.id, 'approved')
      .then(r => setDoctors(r.data))
      .catch(() => {});
  }, [hospital]);

  // Load patient records when patient selected
  useEffect(() => {
    if (!selectedPatient) return;
    listPatientRecords(selectedPatient.id)
      .then(r => {
        setPatientRecords(r.data);
        setSelectedRecord(r.data[0] || null);
        if (r.data[0]?.problem_reported) setReason(r.data[0].problem_reported);
      })
      .catch(() => {});
  }, [selectedPatient]);

  // Load free slots
  useEffect(() => {
    if (!selectedDoctor || !appointmentDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    getFreeSlots(selectedDoctor.id, appointmentDate, hospital?.id)
      .then(r => setFreeSlots(r.data))
      .catch(() => setFreeSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDoctor, appointmentDate, hospital]);

  const filteredDoctors = doctors.filter(d =>
    d.full_name.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.specialization.toLowerCase().includes(docSearch.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSlot || !appointmentDate) return;
    setLoading(true);
    try {
      await createAppointment({
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor.id,
        hospital_id: hospital.id,
        medical_record_id: selectedRecord?.id || null,
        appointment_date: appointmentDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        reason_for_visit: reason,
        notes,
      });
      toast.success('Appointment assigned successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Assign Appointment</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step Wizard */}
        <div className="step-wizard">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`step-item ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="step-dot">{i < step ? '✓' : i + 1}</div>
                <span>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="step-connector" />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 0: Select Patient ── */}
        {step === 0 && (
          <div>
            <div className="search-bar" style={{ marginBottom:16 }}>
              <Search size={15} color="var(--text-muted)" />
              <input placeholder="Search patient…" value={patSearch}
                onChange={e => setPatSearch(e.target.value)} />
            </div>
            <div style={{ maxHeight:300, overflowY:'auto', display:'grid', gap:8 }}>
              {patients.map(p => (
                <div key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  style={{
                    padding:'12px 16px', borderRadius:'var(--radius-md)', cursor:'pointer',
                    border: `1px solid ${selectedPatient?.id === p.id ? 'var(--accent-teal)' : 'var(--border)'}`,
                    background: selectedPatient?.id === p.id ? 'rgba(0,212,184,0.08)' : 'rgba(255,255,255,0.02)',
                    display:'flex', alignItems:'center', gap:12, transition:'all 0.15s',
                  }}
                >
                  <User size={15} color="var(--accent-teal)" />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{p.full_name}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
                      {p.gender} {p.blood_group ? `· ${p.blood_group}` : ''} {p.phone ? `· ${p.phone}` : ''}
                    </div>
                  </div>
                  {selectedPatient?.id === p.id && <ChevronRight size={14} color="var(--accent-teal)" />}
                </div>
              ))}
            </div>
            {selectedPatient && patientRecords.length > 0 && (
              <div style={{ marginTop:16 }}>
                <label className="form-label">Link to Medical Record</label>
                <select className="form-select" value={selectedRecord?.id || ''}
                  onChange={e => {
                    const rec = patientRecords.find(r => r.id === e.target.value);
                    setSelectedRecord(rec);
                    if (rec?.problem_reported) setReason(rec.problem_reported);
                  }}>
                  <option value="">— None —</option>
                  {patientRecords.map(r => (
                    <option key={r.id} value={r.id}>{r.title} ({r.record_type})</option>
                  ))}
                </select>
                {selectedRecord?.problem_reported && (
                  <div style={{ marginTop:8, padding:'8px 12px', borderRadius:'var(--radius-sm)',
                    background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)',
                    fontSize:'0.8rem', color:'var(--accent-amber)' }}>
                    Problem: {selectedRecord.problem_reported}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Choose Doctor + Date ── */}
        {step === 1 && (
          <div>
            <div className="grid-2" style={{ marginBottom:16 }}>
              <div className="form-group">
                <label className="form-label">Appointment Date</label>
                <input type="date" className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Filter Doctors</label>
                <div className="search-bar">
                  <Search size={14} color="var(--text-muted)" />
                  <input placeholder="Specialization or name…" value={docSearch}
                    onChange={e => setDocSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div style={{ maxHeight:300, overflowY:'auto', display:'grid', gap:8 }}>
              {filteredDoctors.map(d => (
                <div key={d.id}
                  onClick={() => setSelectedDoctor(d)}
                  style={{
                    padding:'12px 16px', borderRadius:'var(--radius-md)', cursor:'pointer',
                    border: `1px solid ${selectedDoctor?.id === d.id ? 'var(--accent-teal)' : 'var(--border)'}`,
                    background: selectedDoctor?.id === d.id ? 'rgba(0,212,184,0.08)' : 'rgba(255,255,255,0.02)',
                    display:'flex', alignItems:'center', gap:12, transition:'all 0.15s',
                  }}
                >
                  <Stethoscope size={15} color="var(--accent-blue)" />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{d.full_name}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--accent-teal)' }}>{d.specialization}</div>
                  </div>
                  {d.years_experience && (
                    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{d.years_experience}y exp</span>
                  )}
                </div>
              ))}
              {filteredDoctors.length === 0 && (
                <div className="empty-state" style={{ padding:24 }}>
                  <Stethoscope size={32} className="empty-state-icon" />
                  <h3>No approved doctors</h3>
                  <p>Approve doctors first from the Doctor Management screen</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Pick Slot ── */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              <Calendar size={15} color="var(--accent-teal)" />
              <span style={{ fontWeight:600 }}>{appointmentDate}</span>
              <span style={{ color:'var(--text-muted)' }}>·</span>
              <span style={{ color:'var(--accent-blue)' }}>Dr. {selectedDoctor?.full_name}</span>
            </div>

            {slotsLoading ? (
              <div className="loader-overlay"><div className="spinner" /></div>
            ) : freeSlots.length === 0 ? (
              <div className="empty-state" style={{ padding:32 }}>
                <Clock size={36} className="empty-state-icon" />
                <h3>No free slots</h3>
                <p>Doctor is unavailable on this date. Try a different date.</p>
              </div>
            ) : (
              <div className="slot-grid">
                {freeSlots.map((s, i) => (
                  <button
                    key={i}
                    className={`slot-btn ${selectedSlot?.start_time === s.start_time ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(s)}
                  >
                    {s.start_time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 3 && (
          <div>
            <div style={{ display:'grid', gap:12, marginBottom:20 }}>
              {[
                ['Patient', selectedPatient?.full_name],
                ['Doctor', `Dr. ${selectedDoctor?.full_name} (${selectedDoctor?.specialization})`],
                ['Date', appointmentDate],
                ['Time', selectedSlot ? `${selectedSlot.start_time} – ${selectedSlot.end_time}` : '—'],
                ['Linked Record', selectedRecord?.title || 'None'],
              ].map(([label, val]) => (
                <div key={label} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 16px', borderRadius:'var(--radius-md)',
                  background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)',
                }}>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize:'0.875rem', fontWeight:600 }}>{val}</span>
                </div>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Visit</label>
              <input className="form-input" value={reason}
                onChange={e => setReason(e.target.value)} placeholder="e.g. chest pain review" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" value={notes}
                onChange={e => setNotes(e.target.value)} placeholder="Additional instructions…" />
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="modal-footer">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={14} /> Back
            </button>
          )}
          <div style={{ flex:1 }} />
          {step < 3 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 0 && !selectedPatient) ||
                (step === 1 && (!selectedDoctor || !appointmentDate)) ||
                (step === 2 && !selectedSlot)
              }
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
              {loading ? <Loader2 size={15} /> : <Calendar size={15} />}
              {loading ? 'Assigning…' : 'Confirm Appointment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
