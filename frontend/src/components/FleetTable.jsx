import React, { useState, useCallback } from 'react';
import StatusBadge from './StatusBadge';

const PAGE_SIZE = 10;

/**
 * Formats a date string for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Skeleton loading rows
 */
function SkeletonRows({ count = 10 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className="skeleton-row">
      {[60, 140, 120, 130, 110, 100, 90].map((w, j) => (
        <td key={j}>
          <div className="skeleton skeleton-block" style={{ width: `${w}px` }} />
        </td>
      ))}
    </tr>
  ));
}

/**
 * Fleet Overview Table with filtering and client-side pagination
 */
export default function FleetTable({ devices, loading, error, onRowClick, onRefresh }) {
  const [filters, setFilters] = useState({
    deviceName: '',
    userName: '',
    imei: '',
    serialNumber: '',
    organization: '',
    status: '',
    lastSeen: '',
  });
  const [page, setPage] = useState(1);

  // Apply client-side filters
  const filtered = devices.filter((d) => {
    const matchName = !filters.deviceName || d.deviceName?.toLowerCase().includes(filters.deviceName.toLowerCase());
    const matchUser = !filters.userName || d.userName?.toLowerCase().includes(filters.userName.toLowerCase());
    const matchImei = !filters.imei || d.imei?.includes(filters.imei) || d.serialNumber?.includes(filters.imei);
    const matchSerial = !filters.serialNumber || d.serialNumber?.includes(filters.serialNumber);
    const matchOrg = !filters.organization || d.organization?.toLowerCase().includes(filters.organization.toLowerCase());
    const matchStatus = !filters.status || d.status?.toUpperCase() === filters.status.toUpperCase();
    const matchDate = !filters.lastSeen || (d.lastSeen && d.lastSeen.includes(filters.lastSeen));
    return matchName && matchUser && matchImei && matchSerial && matchOrg && matchStatus && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ deviceName: '', userName: '', imei: '', serialNumber: '', organization: '', status: '', lastSeen: '' });
    setPage(1);
  }, []);

  // Pagination buttons (show max 7 page buttons)
  const renderPageButtons = () => {
    const buttons = [];
    const range = 3;
    let start = Math.max(1, safePage - range);
    let end = Math.min(totalPages, safePage + range);
    if (start > 1) buttons.push(<span key="e1" style={{ padding: '0 4px', color: '#9ca3af' }}>…</span>);
    for (let p = start; p <= end; p++) {
      buttons.push(
        <button key={p} className={`page-btn ${safePage === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
      );
    }
    if (end < totalPages) buttons.push(<span key="e2" style={{ padding: '0 4px', color: '#9ca3af' }}>…</span>);
    return buttons;
  };

  const startRow = (safePage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(safePage * PAGE_SIZE, filtered.length);

  return (
    <div className="panel">
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div className="filter-label">Device Name / User</div>
          <input
            className="filter-input"
            placeholder="Search device name..."
            value={filters.deviceName}
            onChange={(e) => handleFilterChange('deviceName', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-label">IMEI / Serial</div>
          <input
            className="filter-input"
            placeholder="Search IMEI or serial..."
            value={filters.imei}
            onChange={(e) => handleFilterChange('imei', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-label">Organization</div>
          <input
            className="filter-input"
            placeholder="Filter by org group..."
            value={filters.organization}
            onChange={(e) => handleFilterChange('organization', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-label">Status</div>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ENROLLED">Enrolled</option>
            <option value="ACTIVE">Active</option>
            <option value="UNENROLLED">Unenrolled</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
        <div className="filter-group" style={{ minWidth: '140px' }}>
          <div className="filter-label">Last Seen</div>
          <input
            type="date"
            className="filter-input"
            value={filters.lastSeen}
            onChange={(e) => handleFilterChange('lastSeen', e.target.value)}
          />
        </div>
        <div className="filter-group" style={{ maxWidth: '160px' }}>
          <div className="filter-label">&nbsp;</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="filter-btn secondary" onClick={resetFilters}>Reset</button>
            <button className="filter-btn primary" onClick={onRefresh} disabled={loading}>
              {loading ? '…' : '↻ Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner" style={{ margin: '12px 20px 0' }}>
          <span>⚠️</span>
          <span><strong>Knox API Error:</strong> {error}</span>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Device Name</th>
              <th>User Name</th>
              <th>IMEI / Serial Number</th>
              <th>Knox Device ID</th>
              <th>Organization</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows count={PAGE_SIZE} />}
            {!loading && pageSlice.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📱</div>
                    <div className="empty-state-title">No devices found</div>
                    <div className="empty-state-sub">
                      {devices.length > 0
                        ? 'No devices match your current filters. Try adjusting the search criteria.'
                        : 'No enrolled devices found in this Knox tenant.'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {!loading && pageSlice.map((device) => (
              <tr key={device.id} onClick={() => onRowClick(device.id)}>
                <td><StatusBadge status={device.status} /></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{device.deviceName}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>{device.model}</div>
                </td>
                <td className="td-muted">{device.userName}</td>
                <td className="td-mono">
                  <div>{device.imei}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{device.serialNumber}</div>
                </td>
                <td className="td-mono truncate" title={device.knoxDeviceId}>{device.knoxDeviceId}</td>
                <td className="td-muted">{device.organization}</td>
                <td className="td-muted">{formatDate(device.lastSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing <strong>{startRow}–{endRow}</strong> of <strong>{filtered.length}</strong> devices
            {filtered.length < devices.length && ` (filtered from ${devices.length} total)`}
          </div>
          <div className="pagination-controls">
            <button className="page-btn" onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
            {renderPageButtons()}
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
            <button className="page-btn" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
