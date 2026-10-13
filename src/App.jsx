import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import RepoConnect from './components/RepoConnect';
import Dashboard from './components/Dashboard';
import WorkflowViewer from './components/WorkflowViewer';
import WorkflowAnalysis from './components/WorkflowAnalysis';
import FailureLogs from './components/FailureLogs';
import PredictionPanel from './components/PredictionPanel';

const API_BASE = '/api';

export default function App() {
  const [repo, setRepo] = useState(null); // { owner, repo, info }
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(false);

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
    setRepo(null);
    setActiveView('dashboard');
  }, []);

  // If no repo connected, show connect screen
  if (!repo) {
    return (
      <div className="app-layout">
        <Sidebar activeView={activeView} onNavigate={setActiveView} repo={null} onDisconnect={disconnect} />
        <main className="main-content">
          <RepoConnect onConnect={connectRepo} loading={loading} />
        </main>
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
    </div>
  );
}
