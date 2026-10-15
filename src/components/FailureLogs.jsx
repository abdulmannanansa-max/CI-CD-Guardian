import React, { useEffect, useState } from 'react';
import {
  FileWarning,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  MinusCircle,
  AlertCircle,
} from 'lucide-react';

function formatDuration(start, end) {
  if (!start || !end) return '--';
  const ms = new Date(end) - new Date(start);
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m ${remainSecs}s`;
}

function StepIcon({ conclusion }) {
  if (conclusion === 'success') return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
  if (conclusion === 'failure') return <XCircle size={16} style={{ color: 'var(--error)' }} />;
  if (conclusion === 'skipped') return <MinusCircle size={16} style={{ color: 'var(--text-muted)' }} />;
  return <Clock size={16} style={{ color: 'var(--warning)' }} />;
}

export default function FailureLogs({ repo }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState(null);
  const [jobsMap, setJobsMap] = useState({});
  const [jobsLoading, setJobsLoading] = useState({});
  const [filter, setFilter] = useState('all'); // all, failure, success, in_progress

  useEffect(() => {
    async function fetchRuns() {
      setLoading(true);
      try {
        const res = await fetch(`/api/github/workflow-runs?owner=${repo.owner}&repo=${repo.repo}`);
        const data = await res.json();
        setRuns(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchRuns();
  }, [repo.owner, repo.repo]);

  async function loadJobs(runId) {
    if (jobsMap[runId]) return;
    setJobsLoading((prev) => ({ ...prev, [runId]: true }));
    try {
      const res = await fetch(`/api/github/run-jobs/${repo.owner}/${repo.repo}/${runId}`);
      const data = await res.json();
      setJobsMap((prev) => ({ ...prev, [runId]: data }));
    } catch (err) {
      console.error(err);
    }
    setJobsLoading((prev) => ({ ...prev, [runId]: false }));
  }

  function toggleRun(runId) {
    if (expandedRun === runId) {
      setExpandedRun(null);
    } else {
      setExpandedRun(runId);
      loadJobs(runId);
    }
  }

  const filteredRuns = filter === 'all' ? runs : filter === 'in_progress'
    ? runs.filter((r) => !r.conclusion && ['in_progress', 'queued', 'pending', 'waiting', 'requested'].includes(r.status))
    : runs.filter((r) => r.conclusion === filter);

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>Failure Logs</h1>
          <p>Loading CI/CD run data...</p>
        </div>
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <p>Fetching workflow run history...</p>
        </div>
      </div>
    );
  }

  const failureCount = runs.filter((r) => r.conclusion === 'failure').length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Failure Logs</h1>
        <p>Inspect CI/CD run results, job details, and step-by-step execution logs</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div className="tabs" style={{ width: 'fit-content' }}>
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All Runs ({runs.length})
          </button>
          <button className={`tab ${filter === 'failure' ? 'active' : ''}`} onClick={() => setFilter('failure')}>
            Failed ({failureCount})
          </button>
          <button className={`tab ${filter === 'success' ? 'active' : ''}`} onClick={() => setFilter('success')}>
            Passed ({runs.filter((r) => r.conclusion === 'success').length})
          </button>
          <button className={`tab ${filter === 'in_progress' ? 'active' : ''}`} onClick={() => setFilter('in_progress')}>
            In progress ({runs.filter((r) => !r.conclusion && ['in_progress', 'queued', 'pending', 'waiting', 'requested'].includes(r.status)).length})
          </button>
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FileWarning size={48} />
            <h3>No {filter === 'failure' ? 'Failed' : filter === 'success' ? 'Successful' : ''} Runs Found</h3>
            <p>
              {filter === 'failure'
                ? 'Great news! No recent failures detected.'
                : 'No workflow runs found for this filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredRuns.map((run, index) => (
            <div key={run.id} className="card log-row" style={{ '--i': index, padding: 0, overflow: 'hidden' }}>
              {/* Run Header */}
              <div
                className="job-header"
                onClick={() => toggleRun(run.id)}
                style={{ padding: '14px 18px' }}
              >
                {expandedRun === run.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <div className={`run-status-dot ${run.conclusion || run.status}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {run.name}
                  </div>
                  <div className="run-row-meta" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    <span>#{run.runNumber} · {run.branch} · {run.event}</span>
                    <time>{new Date(run.createdAt).toLocaleString()}</time>
                  </div>
                  {run.headCommitMessage && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        marginTop: 4,
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 500,
                      }}
                    >
                      "{run.headCommitMessage.split('\n')[0]}"
                    </div>
                  )}
                </div>
                <span
                  className={`badge badge-${run.conclusion === 'success' ? 'success' : run.conclusion === 'failure' ? 'error' : ['in_progress', 'queued', 'pending', 'waiting', 'requested'].includes(run.status) ? 'warning' : 'neutral'}`}
                >
                  {run.conclusion || run.status}
                </span>
                <a
                  href={run.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Expanded Jobs/Steps */}
              {expandedRun === run.id && (
                <div className="job-details-enter" style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 18px' }}>
                  {jobsLoading[run.id] ? (
                    <div className="loading-state" style={{ padding: 20 }}>
                      <div className="spinner" />
                      <p>Loading job details...</p>
                    </div>
                  ) : jobsMap[run.id] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {jobsMap[run.id].map((job) => (
                        <div key={job.id} className="job-card">
                          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            {job.conclusion === 'success' ? (
                              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                            ) : job.conclusion === 'failure' ? (
                              <XCircle size={18} style={{ color: 'var(--error)' }} />
                            ) : (
                              <MinusCircle size={18} style={{ color: 'var(--text-muted)' }} />
                            )}
                            <span className="job-name">{job.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {formatDuration(job.startedAt, job.completedAt)}
                            </span>
                            <span
                              className={`badge badge-${
                                job.conclusion === 'success' ? 'success' : job.conclusion === 'failure' ? 'error' : 'neutral'
                              }`}
                            >
                              {job.conclusion || job.status}
                            </span>
                          </div>
                          {job.steps && job.steps.length > 0 && (
                            <div className="job-steps">
                              <div className="step-list">
                                {job.steps.map((step) => (
                                  <div
                                    key={step.number}
                                    className="step-item"
                                    style={{
                                      background: step.conclusion === 'failure' ? 'var(--error-bg)' : 'transparent',
                                      borderRadius: 'var(--radius-sm)',
                                    }}
                                  >
                                    <StepIcon conclusion={step.conclusion} />
                                    <span className="step-name" style={{
                                      color: step.conclusion === 'failure' ? 'var(--error)' : 'var(--text-secondary)',
                                      fontWeight: step.conclusion === 'failure' ? 600 : 400,
                                    }}>
                                      {step.name}
                                    </span>
                                    <span className="step-duration">
                                      {formatDuration(step.startedAt, step.completedAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: 10 }}>
                      Unable to load job details.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
