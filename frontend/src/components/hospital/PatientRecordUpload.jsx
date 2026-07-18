import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, FileText, Trash2, ExternalLink,
  FilePlus, X, CloudUpload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPatient } from '../../api/patientApi';
import { listPatientRecords, uploadRecord, deleteRecord } from '../../api/recordsApi';
import Loader from '../common/Loader';
import { toast } from 'react-toastify';

const RECORD_TYPES = ['diagnosis', 'lab_report', 'prescription', 'scan', 'note', 'other'];

const TYPE_COLORS = {
  diagnosis: 'var(--accent-teal)', lab_report: 'var(--accent-blue)',
  prescription: 'var(--accent-emerald)', scan: 'var(--accent-purple)',
  note: 'var(--accent-amber)', other: 'var(--text-secondary)',
};

export default function PatientRecordUpload() {
  const { patientId } = useParams();
  const { hospital } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    title: '', record_type: 'diagnosis',
    description: '', problem_reported: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    Promise.all([
      getPatient(patientId),
      listPatientRecords(patientId),
    ]).then(([pRes, rRes]) => {
      setPatient(pRes.data);
      setRecords(rRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [patientId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('record_type', form.record_type);
      if (form.description) fd.append('description', form.description);
      if (form.problem_reported) fd.append('problem_reported', form.problem_reported);
      if (hospital?.id) fd.append('hospital_id', hospital.id);
      if (file) fd.append('file', file);

      const { data } = await uploadRecord(patientId, fd);
      setRecords(prev => [data, ...prev]);
      toast.success('Record uploaded successfully!');
      setShowForm(false);
      setForm({ title:'', record_type:'diagnosis', description:'', problem_reported:'' });
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await deleteRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success('Record deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hospital/patients')} style={{ marginBottom:8 }}>
            <ArrowLeft size={14} /> Back to Patients
          </button>
          <h1 className="page-title">
            {patient?.full_name || 'Patient'} — Records
          </h1>
          <p className="page-subtitle">
            {patient?.gender && `${patient.gender} · `}
            {patient?.blood_group && `Blood group ${patient.blood_group} · `}
            {patient?.date_of_birth && `DOB: ${patient.date_of_birth}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <FilePlus size={15} /> Upload Record
        </button>
      </div>

      {/* Records list */}
      <div style={{ display:'grid', gap:16 }}>
        {records.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FileText size={44} className="empty-state-icon" />
              <h3>No records yet</h3>
              <p>Upload the patient's first medical record</p>
            </div>
          </div>
        ) : records.map(rec => (
          <div key={rec.id} className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <div style={{
                width:40, height:40, borderRadius:10, flexShrink:0,
                background: `${TYPE_COLORS[rec.record_type] || 'var(--accent-teal)'}18`,
                color: TYPE_COLORS[rec.record_type] || 'var(--accent-teal)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <FileText size={18} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:600 }}>{rec.title}</span>
                  <span className={`badge badge-${rec.record_type === 'diagnosis' ? 'scheduled' : 'pending'}`}
                    style={{ fontSize:'0.7rem', color: TYPE_COLORS[rec.record_type] }}>
                    {rec.record_type?.replace('_', ' ')}
                  </span>
                </div>
                {rec.problem_reported && (
                  <div style={{ marginTop:4, fontSize:'0.8rem', color:'var(--accent-amber)', fontStyle:'italic' }}>
                    Problem: {rec.problem_reported}
                  </div>
                )}
                {rec.description && (
                  <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:4 }}>{rec.description}</p>
                )}
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:8 }}>
                  {new Date(rec.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                {rec.file_url && (
                  <a href={rec.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                    <ExternalLink size={13} /> View File
                  </a>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rec.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Upload Medical Record</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    className="form-input"
                    placeholder="e.g., CBC Blood Test Result"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Record Type *</label>
                  <select
                    className="form-select"
                    value={form.record_type}
                    onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))}
                  >
                    {RECORD_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Problem Reported (used for doctor matching)</label>
                <input
                  className="form-input"
                  placeholder="e.g., chest pain, shortness of breath"
                  value={form.problem_reported}
                  onChange={e => setForm(f => ({ ...f, problem_reported: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Additional notes or details…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* File upload */}
              <div className="form-group">
                <label className="form-label">Attach File (optional)</label>
                <div
                  className={`file-dropzone ${dragOver ? 'active' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <CloudUpload size={28} color="var(--accent-teal)" />
                  {file ? (
                    <p style={{ color:'var(--accent-teal)', fontWeight:500 }}>📎 {file.name}</p>
                  ) : (
                    <p>Drag & drop or <span style={{ color:'var(--accent-teal)' }}>browse</span></p>
                  )}
                  <input type="file" ref={fileRef} style={{ display:'none' }}
                    onChange={e => setFile(e.target.files[0])} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  <Upload size={15} />
                  {uploading ? 'Uploading…' : 'Upload Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
