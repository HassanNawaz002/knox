import React from 'react';

/**
 * Sidebar navigation component
 */
export default function Sidebar({ activeTab, onTabChange, tenantId, isConnected }) {
  const navItems = [
    { id: 'fleet',     icon: '📱', label: 'Fleet Overview',    section: 'Device Management' },
    { id: 'analytics', icon: '📊', label: 'Analytics',         section: null },
    { id: 'security',  icon: '🛡️', label: 'Security Center',  section: null },
    { id: 'settings',  icon: '⚙️', label: 'Settings',         section: 'System' },
  ];

  const sections = [];
  let currentSection = null;
  navItems.forEach((item) => {
    if (item.section && item.section !== currentSection) {
      sections.push({ type: 'label', label: item.section });
      currentSection = item.section;
    }
    sections.push({ type: 'item', ...item });
  });

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🛡️</div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-title">Knox Dashboard</div>
          <div className="sidebar-logo-sub">Enterprise Console</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sections.map((s, i) => {
          if (s.type === 'label') {
            return (
              <div key={`lbl-${i}`} className="sidebar-section-label">{s.label}</div>
            );
          }
          return (
            <div
              key={s.id}
              className={`sidebar-nav-item ${activeTab === s.id ? 'active' : ''}`}
              onClick={() => onTabChange(s.id)}
            >
              <span className="sidebar-nav-icon">{s.icon}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ fontSize: '10px', marginBottom: '6px', color: '#475569' }}>
          Connected Tenant
        </div>
        <div className="sidebar-tenant-badge">
          <div className={`tenant-dot`} style={{ background: isConnected ? '#10b981' : '#ef4444' }} />
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            {tenantId || 'Not Connected'}
          </span>
        </div>
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#334155' }}>
          Knox OAPI v1 · ap01.manage
        </div>
      </div>
    </aside>
  );
}
