import React, { useState } from 'react';
import { Mail, X, Send, Loader2 } from 'lucide-react';
import { inviteDoctor } from '../../api/doctorApi';
import { toast } from 'react-toastify';

export default function DoctorInviteForm({ hospitalId, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await inviteDoctor(hospitalId, email.trim());
      toast.success('Invitation sent successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Invite Doctor</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
          Enter the email address of a registered doctor to invite them to your hospital.
          They must have already created a Doctor account.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Doctor's Email</label>
            <div className="search-bar">
              <Mail size={16} color="var(--text-muted)" />
              <input
                type="email"
                placeholder="doctor@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
