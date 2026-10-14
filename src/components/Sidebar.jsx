import React, { useState } from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Shield,
  FileWarning,
  Brain,
  LogOut,
  GitFork as GithubIcon,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'workflows', label: 'CI/CD Workflows', icon: GitBranch },
  { id: 'analysis', label: 'Robustness Analysis', icon: Shield },
  { id: 'logs', label: 'Failure Logs', icon: FileWarning },
  { id: 'predict', label: 'Failure Prediction', icon: Brain },
];

export default function Sidebar({ activeView, onNavigate, repo, onDisconnect }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Zap size={18} color="white" />
        </div>
        <div className="sidebar-brand-copy">
          <div className="sidebar-title">CI/CD Guardian</div>
          <div className="sidebar-subtitle">AI Failure Detection</div>
        </div>
        <button
          className="sidebar-toggle"
          type="button"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            disabled={!repo && item.id !== 'dashboard'}
            style={!repo && item.id !== 'dashboard' ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          >
            <item.icon />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}

        {repo && (
          <>
            <div className="nav-section-label" style={{ marginTop: 16 }}>Repository</div>
            <div
              className="nav-item"
              style={{ cursor: 'default', background: 'var(--bg-tertiary)' }}
            >
              <GithubIcon size={16} />
              <span className="nav-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                {repo.info.fullName}
              </span>
            </div>
            <button className="nav-item" onClick={onDisconnect} style={{ color: 'var(--error)' }}>
              <LogOut size={16} />
              <span className="nav-label">Disconnect</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer-copy" style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Powered by Gemini AI + GitHub API
        </div>
      </div>
    </aside>
  );
}
