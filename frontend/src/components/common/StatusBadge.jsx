import React from 'react';

const STATUS_MAP = {
  pending:     'badge-pending',
  approved:    'badge-approved',
  rejected:    'badge-rejected',
  revoked:     'badge-revoked',
  scheduled:   'badge-scheduled',
  completed:   'badge-completed',
  cancelled:   'badge-cancelled',
  rescheduled: 'badge-rescheduled',
  no_show:     'badge-no_show',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'badge-pending';
  return (
    <span className={`badge ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
