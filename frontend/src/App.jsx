import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import FleetTable from './components/FleetTable';
import DeviceModal from './components/DeviceModal';
import { fetchDeviceList, fetchDeviceDetail } from './api';

// ─── Fleet Metric Cards ────────────────────────────────────────────────────────

function MetricCard({ icon, iconBg, label, value, sub, change, changeDir }) {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <div className="metric-label">{label}</div>
        <div className="metric-icon" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="metric-value">{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="metric-sub">{sub}</div>
        {change !== undefined && (
          <span className={`metric-change ${changeDir}`}>{change}</span>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Placeholder ──────────────────────────────────────────────────────

function AnalyticsPlaceholder({ devices }) {
  const total = devices.length;
  const enrolled = devices.filter(d => ['ENROLLED','ACTIVE'].includes(d.status?.toUpperCase())).length;
  const unenrolled = devices.filter(d => ['UNENROLLED','INACTIVE'].includes(d.status?.toUpperCase())).length;
  const pending = total - enrolled - unenrolled;

  const orgs = {};
  devices.forEach(d => { if (d.organization) orgs[d.organization] = (orgs[d.organization] || 0) + 1; });
  const topOrgs = Object.entries(orgs).sort((a,b) => b[1]-a[1]).slice(0, 5);

  return (
    <div>
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <MetricCard icon="📱" iconBg="#dbeafe" label="Total Devices" value={total} sub="In Knox tenant" />
        <MetricCard icon="✅" iconBg="#d1fae5" label="Enrolled" value={enrolled} sub="Active & compliant" change={`${Math.round((enrolled/Math.max(total,1))*100)}%`} changeDir="up" />
        <MetricCard icon="⚠️" iconBg="#fef3c7" label="Unenrolled" value={unenrolled} sub="Needs attention" />
        <MetricCard icon="🔄" iconBg="#ede9fe" label="Pending" value={pending} sub="Enrollment in progress" />
      </div>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">🏢 Devices by Organization Group</div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {topOrgs.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-state-icon">🏢</div>
              <div className="empty-state-sub">No organization data available</div>
            </div>
          ) : topOrgs.map(([org, count]) => (
            <div key={org} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{org}</span>
                <span style={{ color: '#6b7280' }}>{count} device{count !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((count/Math.max(total,1))*100)}%`, background: '#2563eb', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Security Center ───────────────────────────────────────────────────────────

function SecurityCenter({ devices }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">🛡️ Security Center</div>
        <div className="panel-subtitle">Knox compliance posture across enrolled fleet</div>
      </div>
      <div style={{ padding: '20px' }}>
        <div className="warning-banner">
          ⚠️ Connect to individual devices via Fleet Overview to view per-device security telemetry (root status, Play Integrity, biometrics).
        </div>
        <div className="metrics-grid">
          <MetricCard icon="📱" iconBg="#dbeafe" label="Managed Devices" value={devices.length} sub="Under Knox policy" />
          <MetricCard icon="🔒" iconBg="#d1fae5" label="Knox Protected" value={devices.filter(d => ['ENROLLED','ACTIVE'].includes(d.status?.toUpperCase())).length} sub="Knox enrolled" change="✓" changeDir="up" />
        </div>
        <div style={{ marginTop: 16, padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, color: '#14532d' }}>
          💡 <strong>Knox Asset Intelligence:</strong> Click any device in Fleet Overview to view real-time security analysis including root detection, Play Integrity status, biometric enrollment, and vulnerability scoring.
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState(null);

  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [deviceDetail, setDeviceDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Computed metrics from device list
  const totalDevices = devices.length;
  const enrolledCount = devices.filter(d => ['ENROLLED','ACTIVE'].includes(d.status?.toUpperCase())).length;
  const unenrolledCount = devices.filter(d => ['UNENROLLED','INACTIVE'].includes(d.status?.toUpperCase())).length;
  const pendingCount = totalDevices - enrolledCount - unenrolledCount;

  // ── Fetch device list ────────────────────────────────────────────────────────
  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    setDeviceError(null);
    try {
      const result = await fetchDeviceList();
      if (result.success) {
        setDevices(result.devices || []);
        setIsConnected(true);
        setLastRefresh(new Date());
      } else {
        setDeviceError(result.error || 'Knox API returned an unsuccessful response');
        setIsConnected(false);
      }
    } catch (err) {
      setDeviceError(err.message);
      setIsConnected(false);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  // ── Fetch device detail ──────────────────────────────────────────────────────
  const loadDeviceDetail = useCallback(async (deviceId) => {
    setSelectedDeviceId(deviceId);
    setDeviceDetail(null);
    setDetailError(null);
    setLoadingDetail(true);
    try {
      const result = await fetchDeviceDetail(deviceId);
      if (result.success) {
        setDeviceDetail(result);
      } else {
        setDetailError(result.error || 'Failed to fetch device telemetry');
      }
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedDeviceId(null);
    setDeviceDetail(null);
    setDetailError(null);
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // ── Keyboard: Escape closes modal ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tenantId={import.meta.env.VITE_TENANT_ID || 'mm.mercurialminds.com'}
        isConnected={isConnected}
      />

      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="top-header-left">
            <h1>
              {activeTab === 'fleet' && '📱 Fleet Overview'}
              {activeTab === 'analytics' && '📊 Analytics Dashboard'}
              {activeTab === 'security' && '🛡️ Security Center'}
              {activeTab === 'settings' && '⚙️ Settings'}
            </h1>
            <p>
              {isConnected
                ? `${totalDevices} devices · Last refreshed ${lastRefresh ? lastRefresh.toLocaleTimeString() : '—'}`
                : 'Connecting to Knox Manage OAPI…'
              }
            </p>
          </div>
          <div className="top-header-right">
            <div className="header-status-pill">
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: isConnected ? '#10b981' : '#ef4444',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }} />
              {isConnected ? 'Knox OAPI Connected' : 'Disconnected'}
            </div>
            <button
              className="header-refresh-btn"
              onClick={loadDevices}
              disabled={loadingDevices}
            >
              {loadingDevices ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Syncing…</> : '↻ Refresh Fleet'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">

          {/* ── Fleet Overview ───────────────────────────────────────────────── */}
          {activeTab === 'fleet' && (
            <>
              {/* Summary Metric Cards */}
              <div className="metrics-grid">
                <MetricCard
                  icon="📱" iconBg="#dbeafe" label="Total Devices"
                  value={loadingDevices ? '—' : totalDevices}
                  sub="Registered in tenant"
                />
                <MetricCard
                  icon="✅" iconBg="#d1fae5" label="Enrolled"
                  value={loadingDevices ? '—' : enrolledCount}
                  sub="Active & compliant"
                  change={totalDevices > 0 ? `${Math.round((enrolledCount/totalDevices)*100)}%` : '—'}
                  changeDir="up"
                />
                <MetricCard
                  icon="❌" iconBg="#fee2e2" label="Unenrolled"
                  value={loadingDevices ? '—' : unenrolledCount}
                  sub="Not enrolled"
                  change={unenrolledCount > 0 ? `${unenrolledCount}` : '0'}
                  changeDir={unenrolledCount > 0 ? 'down' : 'neutral'}
                />
                <MetricCard
                  icon="🔄" iconBg="#fef3c7" label="Pending"
                  value={loadingDevices ? '—' : pendingCount}
                  sub="Enrollment in progress"
                  changeDir="neutral"
                />
              </div>

              {/* Fleet Table */}
              <FleetTable
                devices={devices}
                loading={loadingDevices}
                error={deviceError}
                onRowClick={loadDeviceDetail}
                onRefresh={loadDevices}
              />
            </>
          )}

          {/* ── Analytics ───────────────────────────────────────────────────── */}
          {activeTab === 'analytics' && <AnalyticsPlaceholder devices={devices} />}

          {/* ── Security ────────────────────────────────────────────────────── */}
          {activeTab === 'security' && <SecurityCenter devices={devices} />}

          {/* ── Settings ────────────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">⚙️ Knox API Configuration</div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '8px 16px', fontSize: 13 }}>
                  {[
                    ['Knox Server URL', 'https://ap01.manage.samsungknox.com'],
                    ['Tenant ID', 'mm.mercurialminds.com'],
                    ['Client ID', 'knoxapi@mm.mercurialminds.com'],
                    ['Auth Grant Type', 'Client Credentials (OAuth2)'],
                    ['Token Endpoint', '/emm/oauth/token'],
                    ['Device List API', '/emm/oapi/device/selectDeviceList'],
                    ['Device Detail API', '/emm/oapi/device/selectDeviceDetail'],
                    ['App List API', '/emm/oapi/device/selectDeviceAppList'],
                    ['Backend Port', '5000'],
                    ['Frontend Port', '3000'],
                  ].map(([k, v]) => (
                    <React.Fragment key={k}>
                      <div style={{ fontWeight: 600, color: '#6b7280' }}>{k}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{v}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Device Detail Modal ───────────────────────────────────────────────── */}
      {selectedDeviceId && (
        <DeviceModal
          deviceData={deviceDetail}
          loading={loadingDetail}
          error={detailError}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
