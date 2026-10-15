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
  const inProgressRuns = runs.filter((r) => r.status === 'in_progress' || r.status === 'queued' || r.status === 'pending').length;
  const completedRuns = totalRuns - inProgressRuns;
  const successRate = completedRuns > 0 ? Math.round((successRuns / completedRuns) * 100) : 0;

  const { info } = repo;

  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (successRate / 100) * gaugeCircumference;

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

      <section className="dashboard-hero card" aria-label="Repository health summary">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">LIVE REPOSITORY SIGNAL</span>
          <h2>Pipeline health,<br /><em>without the guesswork.</em></h2>
          <div className="hero-meta"><span className="status-led success" /> {workflows.length} active workflows <span className="hero-separator">/</span> {totalRuns} recent runs</div>
        </div>
        <div className="hero-gauge-wrap">
          <svg className="hero-gauge" viewBox="0 0 132 132" role="img" aria-label={`${successRate}% CI/CD success rate`}>
            <circle cx="66" cy="66" r={gaugeRadius} className="hero-gauge-track" />
            <circle cx="66" cy="66" r={gaugeRadius} className="hero-gauge-value" strokeDasharray={gaugeCircumference} strokeDashoffset={gaugeOffset} style={{ '--ring-start': gaugeCircumference, '--ring-end': gaugeOffset }} />
          </svg>
          <div className="hero-gauge-label"><strong>{successRate}%</strong><span>SUCCESS RATE</span></div>
        </div>
        <div className="hero-heatmap" aria-label="Recent run status heatmap">
          <span className="eyebrow">RUN PULSE / 30</span>
          <div className="heatmap-grid">{runs.slice(0, 30).map((run, index) => <span key={run.id} style={{ '--i': index }} className={`heat-cell ${run.conclusion || run.status}`} title={`${run.name}: ${run.conclusion || run.status}`} />)}</div>
          <div className="heatmap-legend"><span><i className="success" />Success</span><span><i className="in_progress" />In progress</span><span><i className="failure" />Failed</span><span><i className="no_data" />No data</span></div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats-grid dashboard-stat-blocks">
        <div className="stat-card">
          <div className="stat-label">Stars</div>
          <div className="stat-value"><span className="countup" style={{ '--count-target': info.stars || 0 }} data-suffix="" aria-label={`${info.stars || 0} stars`}>{info.stars || 0}</span></div>
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
            <span className="countup" style={{ '--count-target': successRate, '--count-color': 'var(--bg)' }} data-suffix="%" aria-label={`${successRate}%`}>{successRate}</span>
          </div>
          <div className="stat-detail">{successRuns} of {completedRuns} completed runs{inProgressRuns > 0 ? ` · ${inProgressRuns} in progress` : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Workflows</div>
          <div className="stat-value"><span className="countup" style={{ '--count-target': workflows.length }} data-suffix="" aria-label={`${workflows.length} workflows`}>{workflows.length}</span></div>
          <div className="stat-detail">Active CI/CD pipelines</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Failed Runs</div>
          <div className="stat-value" style={{ color: failedRuns > 0 ? 'var(--error)' : 'var(--success)' }}>
            <span className="countup" style={{ '--count-target': failedRuns, '--count-color': 'var(--bg)' }} data-suffix="" aria-label={`${failedRuns} failed runs`}>{failedRuns}</span>
          </div>
          <div className="stat-detail">out of {totalRuns} recent runs</div>
        </div>
        {inProgressRuns > 0 && <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value" style={{ color: 'var(--highlight)' }}><span className="countup" style={{ '--count-target': inProgressRuns }} data-suffix="" aria-label={`${inProgressRuns} runs in progress`}>{inProgressRuns}</span></div><div className="stat-detail">runs still executing</div></div>}
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
