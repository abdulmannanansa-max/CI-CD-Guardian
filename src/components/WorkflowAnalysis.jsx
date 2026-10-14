import React, { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  Lock,
  Gauge,
  Wrench,
  Eye,
  Search,
} from 'lucide-react';

function ScoreRing({ score, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 90 ? 'var(--success)' : score >= 75 ? '#60a5fa' : score >= 60 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-primary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className="score-value" style={{ color }}>{score}</span>
    </div>
  );
}

const severityIcon = {
  critical: <AlertCircle size={16} style={{ color: 'var(--error)' }} />,
  warning: <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />,
  info: <Info size={16} style={{ color: 'var(--info)' }} />,
};

const categoryIcon = {
  Security: <Lock size={14} />,
  Performance: <Gauge size={14} />,
  Reliability: <Shield size={14} />,
  Maintainability: <Wrench size={14} />,
  Efficiency: <Zap size={14} />,
  Observability: <Eye size={14} />,
};

export default function WorkflowAnalysis({ repo }) {
  const [analysis, setAnalysis] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [selectedWorkflowIdx, setSelectedWorkflowIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [workflowQuery, setWorkflowQuery] = useState('');

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const res = await fetch('/api/analyze/all-workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner: repo.owner, repo: repo.repo }),
        });
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchAnalysis();
  }, [repo.owner, repo.repo]);

  async function runAiAnalysis(wf) {
    setAiLoading(true);
    setShowAi(true);
    try {
      const res = await fetch('/api/analyze/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repo.owner,
          repo: repo.repo,
          workflowPath: wf.workflow.path,
          workflowName: wf.workflow.name,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data.aiAnalysis);
    } catch (err) {
      console.error(err);
      setAiAnalysis({ available: false, message: 'Failed to get AI analysis' });
    }
    setAiLoading(false);
  }

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>Robustness Analysis</h1>
          <p>Analyzing CI/CD workflows...</p>
        </div>
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <p>Running rule-based analysis on all workflows...</p>
        </div>
      </div>
    );
  }

  if (!analysis || !analysis.workflows || analysis.workflows.length === 0) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>Robustness Analysis</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <Shield size={48} />
            <h3>No Workflows to Analyze</h3>
            <p>This repository doesn't have any GitHub Actions workflows.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentWf = analysis.workflows[selectedWorkflowIdx];
  const rba = currentWf?.ruleBasedAnalysis;
  const visibleWorkflows = analysis.workflows
    .map((workflow, index) => ({ workflow, index }))
    .filter(({ workflow }) => workflow.workflow.name.toLowerCase().includes(workflowQuery.toLowerCase()));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Robustness Analysis</h1>
        <p>Rule-based and AI-powered analysis of CI/CD pipeline robustness</p>
      </div>

      {/* Overall Score */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ScoreRing score={analysis.overallScore} />
          <div>
            <div className="stat-label">Overall CI/CD Score</div>
            <div
              className="stat-value"
              style={{
                fontSize: '1.2rem',
                color:
                  analysis.overallScore >= 75
                    ? 'var(--success)'
                    : analysis.overallScore >= 50
                    ? 'var(--warning)'
                    : 'var(--error)',
              }}
            >
              Grade {analysis.overallGrade}
            </div>
            <div className="stat-detail">{analysis.workflows.length} workflow(s) analyzed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Issues Found</div>
          <div className="stat-value">
            {analysis.workflows.reduce((s, w) => s + w.ruleBasedAnalysis.issues.length, 0)}
          </div>
          <div className="stat-detail">across all workflows</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical Issues</div>
          <div className="stat-value" style={{ color: 'var(--error)' }}>
            {analysis.workflows.reduce(
              (s, w) => s + w.ruleBasedAnalysis.issues.filter((i) => i.severity === 'critical').length,
              0
            )}
          </div>
          <div className="stat-detail">require immediate attention</div>
        </div>
      </div>

      {/* Workflow selector */}
      {analysis.workflows.length > 1 && (
        <div className="workflow-selector" aria-label="Workflow selector">
          <div className="workflow-selector-head">
            <span className="eyebrow">SELECT PIPELINE</span>
            <label className="workflow-search">
              <Search size={15} />
              <input
                value={workflowQuery}
                onChange={(event) => setWorkflowQuery(event.target.value)}
                placeholder="Search workflows"
                aria-label="Search workflows"
              />
            </label>
          </div>
          <div className="workflow-chip-rail">
          {visibleWorkflows.map(({ workflow: wf, index: idx }) => (
            <button
              key={idx}
              className={`workflow-chip ${selectedWorkflowIdx === idx ? 'active' : ''}`}
              onClick={() => {
                setSelectedWorkflowIdx(idx);
                setShowAi(false);
                setAiAnalysis(null);
              }}
            >
              {wf.workflow.name}
            </button>
          ))}
          {visibleWorkflows.length === 0 && <span className="workflow-no-results">No matching workflows</span>}
          </div>
        </div>
      )}

      <div className="two-col">
        {/* Rule-Based Issues */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Shield size={18} />
              Rule-Based Analysis
            </div>
            <ScoreRing score={rba?.score || 0} size={50} strokeWidth={5} />
          </div>

          {rba?.metadata && (
            <div className="workflow-badge-row">
              <span className="badge badge-info">{rba.metadata.jobCount} jobs</span>
              <span className="badge badge-neutral">{rba.metadata.totalSteps} steps</span>
              {rba.metadata.triggers.map((t) => (
                <span key={t} className="badge badge-neutral">on: {t}</span>
              ))}
            </div>
          )}

          <div className="issue-list">
            {rba?.issues?.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <CheckCircle2 size={28} style={{ color: 'var(--success)', marginBottom: 8 }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  No issues detected. This workflow follows best practices!
                </p>
              </div>
            )}
            {rba?.issues?.map((issue, idx) => (
              <div key={idx} className={`issue-card ${issue.severity}`}>
                <div className="issue-header">
                  {severityIcon[issue.severity]}
                  <span className="badge" style={{
                    background: issue.severity === 'critical' ? 'var(--error-bg)' : issue.severity === 'warning' ? 'var(--warning-bg)' : 'var(--info-bg)',
                    color: issue.severity === 'critical' ? 'var(--error)' : issue.severity === 'warning' ? 'var(--warning)' : 'var(--info)',
                  }}>
                    {issue.severity}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {categoryIcon[issue.category]} {issue.category}
                  </span>
                </div>
                <div className="issue-message">{issue.message}</div>
                <div className="issue-suggestion">💡 {issue.suggestion}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} />
              AI Deep Analysis
              <span className="ai-badge">Gemini</span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => runAiAnalysis(currentWf)}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : (
                <>
                  <Sparkles size={14} />
                  {showAi ? 'Re-Analyze' : 'Run AI Analysis'}
                </>
              )}
            </button>
          </div>

          {!showAi && (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <Sparkles size={36} />
              <h3>AI Analysis Available</h3>
              <p>
                Click "Run AI Analysis" to get detailed, AI-powered insights
                about this workflow's security, performance, and reliability.
              </p>
            </div>
          )}

          {aiLoading && (
            <div className="loading-state">
              <div className="spinner spinner-lg" />
              <p>Gemini AI is analyzing the workflow...</p>
            </div>
          )}

          {showAi && !aiLoading && aiAnalysis && (
            <div className="ai-section slide-in">
              {!aiAnalysis.available ? (
                <div className="issue-card warning">
                  <div className="issue-message">{aiAnalysis.message}</div>
                </div>
              ) : aiAnalysis.analysis ? (
                <>
                  {/* Summary */}
                  <div className="ai-finding" style={{ borderLeftColor: 'var(--accent-primary)' }}>
                    <h4>Summary</h4>
                    <p>{aiAnalysis.analysis.summary}</p>
                  </div>

                  {/* Critical Findings */}
                  {aiAnalysis.analysis.criticalFindings?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div className="ai-section-header">
                        <AlertCircle size={16} style={{ color: 'var(--error)' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Critical Findings</span>
                      </div>
                      {aiAnalysis.analysis.criticalFindings.map((f, i) => (
                        <div key={i} className="ai-finding" style={{ borderLeftColor: 'var(--error)' }}>
                          <p>{f}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Security Issues */}
                  {aiAnalysis.analysis.securityIssues?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div className="ai-section-header">
                        <Lock size={16} style={{ color: 'var(--warning)' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Security Issues</span>
                      </div>
                      {aiAnalysis.analysis.securityIssues.map((s, i) => (
                        <div key={i} className="ai-finding" style={{ borderLeftColor: s.severity === 'critical' ? 'var(--error)' : 'var(--warning)' }}>
                          <h4>{s.issue}</h4>
                          <p>Fix: {s.fix}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Performance Optimizations */}
                  {aiAnalysis.analysis.performanceOptimizations?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div className="ai-section-header">
                        <Gauge size={16} style={{ color: 'var(--info)' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Performance Optimizations</span>
                      </div>
                      {aiAnalysis.analysis.performanceOptimizations.map((p, i) => (
                        <div key={i} className="ai-finding" style={{ borderLeftColor: 'var(--info)' }}>
                          <h4>{p.issue}</h4>
                          <p>{p.fix}</p>
                          {p.impactEstimate && (
                            <span className="badge badge-success" style={{ marginTop: 6, display: 'inline-flex' }}>
                              Impact: {p.impactEstimate}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Best Practices */}
                  {aiAnalysis.analysis.bestPractices?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div className="ai-section-header">
                        <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Best Practices</span>
                      </div>
                      {aiAnalysis.analysis.bestPractices.map((bp, i) => (
                        <div
                          key={i}
                          className="ai-finding"
                          style={{ borderLeftColor: bp.status === 'implemented' ? 'var(--success)' : 'var(--warning)' }}
                        >
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {bp.status === 'implemented' ? (
                              <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                            ) : (
                              <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
                            )}
                            {bp.practice}
                          </h4>
                          <p>{bp.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reliability */}
                  {aiAnalysis.analysis.reliabilityImprovements?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div className="ai-section-header">
                        <Shield size={16} style={{ color: 'var(--accent-primary-light)' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Reliability Improvements</span>
                      </div>
                      {aiAnalysis.analysis.reliabilityImprovements.map((r, i) => (
                        <div key={i} className="ai-finding">
                          <h4>{r.issue}</h4>
                          <p>{r.fix}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="issue-card info">
                  <div className="issue-message">AI analysis returned no structured data.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
