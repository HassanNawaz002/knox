import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { BatteryTempChart, AppRamChart } from './Charts';

const PAGE_SIZE_APPS = 10;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function DetailRow({ label, value, mono = false, highlight = false }) {
  return (
    <div className="sys-detail-row">
      <div className="sys-detail-key">{label}</div>
      <div className={`sys-detail-val${mono ? ' mono' : ''}`} style={highlight ? { color: '#dc2626', fontWeight: 700 } : {}}>
        {value || '—'}
      </div>
    </div>
  );
}

function HWMetricCard({ icon, title, iconBg, value, sub, progress, progressColor }) {
  return (
    <div className="hw-metric-card">
      <div className="hw-metric-header">
        <div className="hw-metric-title">{title}</div>
        <div className="hw-metric-icon" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="hw-metric-value">{value}</div>
      <div className="hw-metric-sub">{sub}</div>
      {progress !== undefined && (
        <div className="progress-bar-wrap">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, progress)}%`, background: progressColor || '#10b981' }}
          />
        </div>
      )}
    </div>
  );
}

function InsightList({ insights }) {
  if (!insights) return null;
  const allItems = [
    ...(insights.alerts || []),
    ...(insights.warnings || []),
    ...(insights.info || []),
  ];
  if (allItems.length === 0) return (
    <div className="insight-item low" style={{ gap: '8px' }}>
      <span className="insight-level low">✓ OK</span>
      <span>No issues detected — device appears healthy and compliant.</span>
    </div>
  );
  return allItems.map((item, i) => {
    const level = item.level?.toLowerCase();
    return (
      <div key={i} className={`insight-item ${level === 'critical' ? 'critical' : level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low'}`}>
        <span className={`insight-level ${level === 'critical' ? 'critical' : level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low'}`}>
          {item.level}
        </span>
        <span><strong>{item.category}:</strong> {item.message}</span>
      </div>
    );
  });
}

/**
 * Full-screen Device Detail Modal
 */
export default function DeviceModal({ deviceData, loading, error, onClose }) {
  const [appPage, setAppPage] = useState(1);
  const [appSearch, setAppSearch] = useState('');

  if (!deviceData && !loading && !error) return null;

  const { device, appMetrics, apps, insights, chartData } = deviceData || {};

  // App table filter + pagination
  const filteredApps = (apps || []).filter(a =>
    !appSearch ||
    a.appName?.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.packageName?.toLowerCase().includes(appSearch.toLowerCase())
  );
  const appTotalPages = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE_APPS));
  const appSlice = filteredApps.slice((appPage - 1) * PAGE_SIZE_APPS, appPage * PAGE_SIZE_APPS);

  const memProgressColor = device?.memPercent >= 90 ? '#ef4444' : device?.memPercent >= 75 ? '#f59e0b' : '#10b981';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" id="detailModal">

        {/* ── Header Card ─────────────────────────────────────────────────── */}
        <div className="modal-header-card">
          <div className="modal-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '28px' }}>📱</div>
              <div>
                <div className="modal-device-title">
                  {loading ? 'Loading Device…' : (device?.deviceName || 'Unknown Device')}
                </div>
                {device && <StatusBadge status={device.status} />}
              </div>
            </div>
            <div className="modal-meta-row">
              {device?.knoxDeviceId && (
                <div className="modal-meta-item">
                  🔑 Knox ID: <strong>{device.knoxDeviceId}</strong>
                </div>
              )}
              {device?.serialNumber && (
                <div className="modal-meta-item">
                  🔢 Serial: <strong>{device.serialNumber}</strong>
                </div>
              )}
              {device?.lastSync && (
                <div className="modal-meta-item">
                  🕒 Last Sync: <strong>{formatDate(device.lastSync)}</strong>
                </div>
              )}
              {insights && (
                <div className="modal-meta-item">
                  🎯 Risk Score: <strong style={{ color: insights.riskScore > 40 ? '#f87171' : '#6ee7b7' }}>
                    {insights.riskScore} · {insights.summary}
                  </strong>
                </div>
              )}
            </div>
          </div>
          <button className="modal-back-btn" onClick={onClose}>
            ← Back to Fleet Overview
          </button>
        </div>

        {/* ── Modal Body ───────────────────────────────────────────────────── */}
        <div className="modal-body">

          {/* Loading State */}
          {loading && (
            <div className="loading-overlay">
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <div>Fetching device telemetry from Knox OAPI…</div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="error-banner">
              ⚠️ <span><strong>Failed to load device telemetry:</strong> {error}</span>
            </div>
          )}

          {/* Content */}
          {!loading && device && (
            <>
              {/* ── HW Metrics Row ─────────────────────────────────────────── */}
              <div className="hw-metrics-row">
                <HWMetricCard
                  icon="💾"
                  iconBg="#dbeafe"
                  title="Memory Usage"
                  value={`${device.usedRamGB} GB`}
                  sub={`${device.memPercent}% of ${device.totalRamGB} GB total`}
                  progress={device.memPercent}
                  progressColor={memProgressColor}
                />
                <HWMetricCard
                  icon="🔋"
                  iconBg="#d1fae5"
                  title="Battery Health"
                  value={device.batterySOH !== '—' ? `${device.batterySOH}%` : (device.batterySOH || '—')}
                  sub={`${device.batteryCycles !== '—' ? device.batteryCycles + ' cycles' : ''} · Level: ${device.batteryLevel}%`}
                />
                <HWMetricCard
                  icon="📶"
                  iconBg="#ede9fe"
                  title="Wi-Fi Speed"
                  value={device.maxWifiSpeed !== '—' ? `${device.maxWifiSpeed} Mbps` : '—'}
                  sub={`SSID: ${device.connectedSsid}`}
                />
                <HWMetricCard
                  icon="🛡️"
                  iconBg="#fef3c7"
                  title="Knox SDK"
                  value={device.knoxSdkVersion || '—'}
                  sub={`Android ${device.androidVersion}`}
                />
              </div>

              {/* ── App Status Metrics Grid ─────────────────────────────────── */}
              {appMetrics && (
                <div className="app-metrics-grid">
                  {[
                    { label: 'Total Apps', num: appMetrics.total, color: '#2563eb', bg: '#dbeafe' },
                    { label: 'Preload Apps', num: appMetrics.preload, color: '#8b5cf6', bg: '#ede9fe' },
                    { label: 'Third-Party', num: appMetrics.thirdParty, color: '#f59e0b', bg: '#fef3c7' },
                    { label: 'Managed Apps', num: appMetrics.managed, color: '#10b981', bg: '#d1fae5' },
                  ].map((tile) => (
                    <div key={tile.label} className="app-metric-tile" style={{ borderTopColor: tile.color }}>
                      <div className="app-metric-tile-num" style={{ color: tile.color }}>{tile.num}</div>
                      <div className="app-metric-tile-label">{tile.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Deep System Details Grid ────────────────────────────────── */}
              <div className="deep-sys-grid">
                {/* System & Identity */}
                <div className="sys-detail-panel">
                  <div className="sys-detail-header">🖥️ System & Identity Specs</div>
                  <div className="sys-detail-rows">
                    <DetailRow label="Model" value={device.model} />
                    <DetailRow label="Manufacturer" value={device.manufacturer} />
                    <DetailRow label="IMEI" value={device.imei} mono />
                    <DetailRow label="Knox Device ID" value={device.knoxDeviceId} mono />
                    <DetailRow label="Serial Number" value={device.serialNumber} mono />
                    <DetailRow label="Android OS" value={device.androidVersion} />
                    <DetailRow label="Firmware Version" value={device.firmwareVersion} mono />
                    <DetailRow label="Security Patch" value={device.securityPatchLevel} />
                    <DetailRow label="License Key" value={device.licenseKey} mono />
                  </div>
                </div>

                {/* Security & OS Integrity */}
                <div className="sys-detail-panel">
                  <div className="sys-detail-header">🔒 Security & OS Integrity</div>
                  <div className="sys-detail-rows">
                    <DetailRow label="Lock Status" value={device.lockStatus} />
                    <DetailRow label="Unenrollment Code" value={device.unenrollmentCode} mono />
                    <DetailRow label="Play Integrity" value={device.playIntegrityStatus} />
                    <DetailRow
                      label="Root Status"
                      value={device.rootStatus}
                      highlight={device.rootStatus?.includes('Rooted') && !device.rootStatus?.includes('Not')}
                    />
                    <DetailRow label="Exit Kiosk Code" value={device.exitKioskCode} mono />
                    <DetailRow label="Biometrics" value={device.biometricsEnabled} />
                    <DetailRow label="Knox SDK Version" value={device.knoxSdkVersion} />
                  </div>
                </div>

                {/* Connectivity & Network */}
                <div className="sys-detail-panel">
                  <div className="sys-detail-header">📡 Connectivity & Network</div>
                  <div className="sys-detail-rows">
                    <DetailRow label="Wi-Fi Status" value={device.wifiStatus} />
                    <DetailRow label="Connected AP (SSID)" value={device.connectedSsid} />
                    <DetailRow label="IP Address" value={device.ipAddress} mono />
                    <DetailRow label="MAC Address" value={device.macAddress} mono />
                    <DetailRow label="Max Wi-Fi Speed" value={device.maxWifiSpeed !== '—' ? `${device.maxWifiSpeed} Mbps` : '—'} />
                    <DetailRow label="Organization Group" value={device.organizationGroup} />
                  </div>
                </div>
              </div>

              {/* ── Knox Asset Intelligence Insights ─────────────────────────── */}
              <div className="panel insights-section">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">🧠 Knox Asset Intelligence — Smart Insights</div>
                    <div className="panel-subtitle">Cross-telemetry vulnerability detection & compliance analysis</div>
                  </div>
                  {insights && (
                    <span className={`badge ${insights.riskScore > 40 ? 'badge-unenrolled' : insights.riskScore > 10 ? 'badge-pending' : 'badge-enrolled'}`}>
                      Risk Score: {insights.riskScore}
                    </span>
                  )}
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <InsightList insights={insights} />
                </div>
              </div>

              {/* ── Charts Row ───────────────────────────────────────────────── */}
              <div className="charts-row">
                <div className="chart-panel">
                  <div className="chart-header">
                    <div className="chart-title">🔋 Battery Drain & Temperature Telemetry</div>
                    <div className="chart-sub">24-hour historical trend — Battery (%) & Temperature (°C)</div>
                  </div>
                  <div className="chart-body">
                    <BatteryTempChart data={chartData?.batteryChart} />
                  </div>
                </div>

                <div className="chart-panel">
                  <div className="chart-header">
                    <div className="chart-title">🍩 App RAM Usage</div>
                    <div className="chart-sub">Top apps by memory allocation (MB)</div>
                  </div>
                  <div className="chart-body">
                    <AppRamChart data={chartData?.appRamChart} />
                  </div>
                </div>
              </div>

              {/* ── Installed Applications Table ─────────────────────────────── */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">📦 Installed Applications Telemetry</div>
                    <div className="panel-subtitle">
                      {apps?.length || 0} applications found · Click column headers to sort
                    </div>
                  </div>
                  <input
                    className="filter-input"
                    style={{ width: '220px' }}
                    placeholder="🔍 Search apps..."
                    value={appSearch}
                    onChange={(e) => { setAppSearch(e.target.value); setAppPage(1); }}
                  />
                </div>

                <div className="apps-table-wrap">
                  <table className="apps-table">
                    <thead>
                      <tr>
                        <th>App Name</th>
                        <th>Package Name</th>
                        <th>Version</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Install Date</th>
                        <th style={{ textAlign: 'right' }}>Memory (MB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appSlice.length === 0 && (
                        <tr>
                          <td colSpan={7}>
                            <div className="empty-state" style={{ padding: '30px' }}>
                              <div className="empty-state-icon">📦</div>
                              <div className="empty-state-sub">No applications found.</div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {appSlice.map((app, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, maxWidth: '180px' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {app.appName}
                            </div>
                          </td>
                          <td className="td-mono" style={{ fontSize: '11px', maxWidth: '200px' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {app.packageName}
                            </div>
                          </td>
                          <td className="td-mono">{app.version}</td>
                          <td>
                            <span className={`badge ${app.type?.toLowerCase().includes('system') || app.type?.toLowerCase().includes('preload') ? 'badge-blue' : app.type?.toLowerCase().includes('manage') ? 'badge-enrolled' : 'badge-pending'}`}>
                              {app.type || 'User'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${app.status?.toLowerCase() === 'installed' ? 'badge-active' : 'badge-pending'}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="td-muted">{formatDate(app.installDate)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                            {app.memoryMB > 0 ? `${app.memoryMB} MB` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* App pagination */}
                {filteredApps.length > PAGE_SIZE_APPS && (
                  <div className="pagination">
                    <div className="pagination-info">
                      Showing {(appPage - 1) * PAGE_SIZE_APPS + 1}–{Math.min(appPage * PAGE_SIZE_APPS, filteredApps.length)} of {filteredApps.length} apps
                    </div>
                    <div className="pagination-controls">
                      <button className="page-btn" onClick={() => setAppPage(p => Math.max(1, p - 1))} disabled={appPage === 1}>‹</button>
                      {Array.from({ length: Math.min(appTotalPages, 5) }, (_, i) => i + 1).map(p => (
                        <button key={p} className={`page-btn ${appPage === p ? 'active' : ''}`} onClick={() => setAppPage(p)}>{p}</button>
                      ))}
                      <button className="page-btn" onClick={() => setAppPage(p => Math.min(appTotalPages, p + 1))} disabled={appPage === appTotalPages}>›</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
