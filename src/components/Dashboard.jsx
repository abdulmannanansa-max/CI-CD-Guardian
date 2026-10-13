import React, { useEffect, useState } from 'react';
import {
  Star,
  GitFork,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  GitCommit,
  ExternalLink,
  Code,
  Activity,
} from 'lucide-react';

export default function Dashboard({ repo }) {
  const [commits, setCommits] = useState([]);
  const [runs, setRuns] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [commitsRes, runsRes, workflowsRes] = await Promise.all([
          fetch(`/api/github/commits?owner=${repo.owner}&repo=${repo.repo}`),
          fetch(`/api/github/workflow-runs?owner=${repo.owner}&repo=${repo.repo}`),
          fetch(`/api/github/workflows?owner=${repo.owner}&repo=${repo.repo}`),
        ]);
        const [commitsData, runsData, workflowsData] = await Promise.all([
          commitsRes.json(),
          runsRes.json(),
          workflowsRes.json(),
        ]);
        setCommits(Array.isArray(commitsData) ? commitsData : []);
        setRuns(Array.isArray(runsData) ? runsData : []);
        setWorkflows(Array.isArray(workflowsData) ? workflowsData : []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
  }, [repo.owner, repo.repo]);

  const totalRuns = runs.length;
  const successRuns = runs.filter((r) => r.conclusion === 'success').length;
  const failedRuns = runs.filter((r) => r.conclusion === 'failure').length;
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;

  const { info } = repo;

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>Repository Overview</h1>
          <p>Loading repository data...</p>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1>{info.fullName}</h1>
          <a
            href={info.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 2 }}
          >
            <ExternalLink size={14} />
          </a>
        </div>
        <p>{info.description || 'No description available'}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Stars</div>
          <div className="stat-value">{info.stars?.toLocaleString()}</div>
          <div className="stat-detail">
            <Star size={12} style={{ marginRight: 4 }} />
            Community support
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CI/CD Success Rate</div>
          <div
            className="stat-value"
            style={{ color: successRate >= 80 ? 'var(--success)' : successRate >= 50 ? 'var(--warning)' : 'var(--error)' }}
          >
            {successRate}%
          </div>
          <div className="stat-detail">{totalRuns} recent runs analyzed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Workflows</div>
          <div className="stat-value">{workflows.length}</div>
          <div className="stat-detail">Active CI/CD pipelines</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed Runs</div>
          <div className="stat-value" style={{ color: failedRuns > 0 ? 'var(--error)' : 'var(--success)' }}>
            {failedRuns}
          </div>
          <div className="stat-detail">out of {totalRuns} recent runs</div>
        </div>
      </div>

      {/* Two columns: Commits + Run History */}
      <div className="two-col">
        {/* Recent Commits */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <GitCommit size={18} />
              Recent Commits
            </div>
            <span className="badge badge-neutral">{commits.length}</span>
          </div>
          <div className="commit-list" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {commits.slice(0, 15).map((c) => (
              <div key={c.sha} className="commit-item">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="commit-avatar" />
                ) : (
                  <div className="commit-avatar" />
                )}
                <div className="commit-info">
                  <div className="commit-message">{c.message.split('\n')[0]}</div>
                  <div className="commit-meta">
                    {c.author} · {new Date(c.date).toLocaleDateString()}
                  </div>
                </div>
                <span className="commit-sha">{c.shortSha}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CI/CD Run History */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} />
              CI/CD Run History
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-success">{successRuns} passed</span>
              {failedRuns > 0 && <span className="badge badge-error">{failedRuns} failed</span>}
            </div>
          </div>
          <div className="run-list" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {runs.slice(0, 15).map((r) => (
              <div key={r.id} className="run-item">
                <div className={`run-status-dot ${r.conclusion || r.status}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {r.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    #{r.runNumber} · {r.branch} · {r.headSha}
                  </div>
                </div>
                <span className={`badge badge-${r.conclusion === 'success' ? 'success' : r.conclusion === 'failure' ? 'error' : 'neutral'}`}>
                  {r.conclusion || r.status}
                </span>
              </div>
            ))}
            {runs.length === 0 && (
              <div className="empty-state">
                <Activity size={36} />
                <h3>No CI/CD runs found</h3>
                <p>This repository may not have GitHub Actions configured.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repo Details */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div className="card-title">
            <Code size={18} />
            Repository Details
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Language</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4 }}>{info.language || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Forks</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4 }}>{info.forks?.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open Issues</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4 }}>{info.openIssues?.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Default Branch</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{info.defaultBranch}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Updated</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4 }}>{new Date(info.updatedAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Size</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: 4 }}>{(info.size / 1024).toFixed(1)} MB</div>
          </div>
        </div>
        {info.topics?.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {info.topics.map((t) => (
              <span key={t} className="badge badge-info">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
