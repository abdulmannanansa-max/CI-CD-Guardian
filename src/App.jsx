import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RepoConnect from './components/RepoConnect';
import Dashboard from './components/Dashboard';
import WorkflowViewer from './components/WorkflowViewer';
import WorkflowAnalysis from './components/WorkflowAnalysis';
import FailureLogs from './components/FailureLogs';
import PredictionPanel from './components/PredictionPanel';
import { Command, Search, X } from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [repo, setRepo] = useState(null); // { owner, repo, info }
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    try {
      const savedRepo = window.localStorage.getItem('cicd-guardian:last-repo');
      if (savedRepo) setRepo(JSON.parse(savedRepo));
    } catch {
      window.localStorage.removeItem('cicd-guardian:last-repo');
    }
  }, []);

  useEffect(() => {
    if (repo) window.localStorage.setItem('cicd-guardian:last-repo', JSON.stringify(repo));
  }, [repo]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const connectRepo = useCallback(async (repoUrl) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/github/repo?url=${encodeURIComponent(repoUrl)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to connect');
      }
      const info = await res.json();
      const parts = info.fullName.split('/');
      setRepo({ owner: parts[0], repo: parts[1], info });
      setActiveView('dashboard');
      return null;
    } catch (err) {
      return err.message;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (repo && !window.confirm(`Disconnect from ${repo.info.fullName}?`)) return;
    setRepo(null);
    window.localStorage.removeItem('cicd-guardian:last-repo');
    setActiveView('dashboard');
  }, [repo]);

  const commandItems = [
    ['dashboard', 'Overview'],
    ['workflows', 'CI/CD Workflows'],
    ['analysis', 'Robustness Analysis'],
    ['logs', 'Failure Logs'],
    ['predict', 'Failure Prediction'],
  ];

  const commandPalette = commandOpen && (
    <div className="command-backdrop" onMouseDown={() => setCommandOpen(false)}>
      <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-topline"><Command size={16} /><span>COMMAND PALETTE</span><kbd>ESC</kbd><button onClick={() => setCommandOpen(false)} aria-label="Close command palette"><X size={16} /></button></div>
        <div className="command-search"><Search size={16} /><input autoFocus placeholder="Jump to a control or page…" /></div>
        <div className="command-list">
          {commandItems.map(([id, label]) => (
            <button key={id} disabled={!repo} onClick={() => { setActiveView(id); setCommandOpen(false); }}>
              <span>{label}</span><kbd>{id === activeView ? 'OPEN' : 'GO'}</kbd>
            </button>
          ))}
        </div>
        <p>Use <kbd>Ctrl</kbd> <span>+</span> <kbd>K</kbd> anytime to open this palette.</p>
      </div>
    </div>
  );

  // If no repo connected, show connect screen
  if (!repo) {
    return (
      <div className="app-layout">
        <Sidebar activeView={activeView} onNavigate={setActiveView} repo={null} onDisconnect={disconnect} />
        <main className="main-content">
          <RepoConnect onConnect={connectRepo} loading={loading} />
        </main>
        {commandPalette}
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard repo={repo} />;
      case 'workflows':
        return <WorkflowViewer repo={repo} />;
      case 'analysis':
        return <WorkflowAnalysis repo={repo} />;
      case 'logs':
        return <FailureLogs repo={repo} />;
      case 'predict':
        return <PredictionPanel repo={repo} />;
      default:
        return <Dashboard repo={repo} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onNavigate={setActiveView} repo={repo} onDisconnect={disconnect} />
      <main className="main-content">
        {renderView()}
      </main>
      {commandPalette}
    </div>
  );
}
