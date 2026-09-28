import React from 'react';

/**
 * Status badge component for device enrollment status
 */
const STATUS_MAP = {
  ENROLLED:   { cls: 'badge-enrolled',   label: 'Enrolled' },
  ACTIVE:     { cls: 'badge-active',     label: 'Active' },
  UNENROLLED: { cls: 'badge-unenrolled', label: 'Unenrolled' },
  INACTIVE:   { cls: 'badge-inactive',   label: 'Inactive' },
  PENDING:    { cls: 'badge-pending',    label: 'Pending' },
  UNKNOWN:    { cls: 'badge-unknown',    label: 'Unknown' },
};

export default function StatusBadge({ status }) {
  const key = (status || 'UNKNOWN').toUpperCase();
  const cfg = STATUS_MAP[key] || { cls: 'badge-unknown', label: status || 'Unknown' };
  return (
    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
  );
}
