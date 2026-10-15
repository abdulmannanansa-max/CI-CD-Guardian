import React, { useEffect, useState } from 'react';
import { GitBranch, Eye, FileCode, ExternalLink, Copy, Check } from 'lucide-react';

function highlightYamlLine(line) {
  const commentAt = line.indexOf('#');
  const code = commentAt < 0 ? line : line.slice(0, commentAt);
  const comment = commentAt < 0 ? '' : line.slice(commentAt);
  const match = code.match(/^(\s*(?:-\s*)?)([^:]+)(:)(.*)$/);
  const colorValue = (value) => {
    const trimmed = value.trim();
    if (/^(true|false|null|yes|no|on|off|\d+|\$\{.*\})$/i.test(trimmed)) return 'yaml-value';
    if (/^["'].*["']$/.test(trimmed)) return 'yaml-string';
    return '';
  };
  return <>{match ? <>{match[1]}<span className="yaml-key">{match[2]}</span><span className="yaml-punctuation">{match[3]}</span><span className={colorValue(match[4])}>{match[4]}</span></> : code}{comment && <span className="yaml-comment">{comment}</span>}</>;
}

export default function WorkflowViewer({ repo }) {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [yamlContent, setYamlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [yamlLoading, setYamlLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchWorkflows() {
      setLoading(true);
      try {
        const res = await fetch(`/api/github/workflows?owner=${repo.owner}&repo=${repo.repo}`);
        const data = await res.json();
        setWorkflows(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          loadWorkflowYaml(data[0]);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchWorkflows();
  }, [repo.owner, repo.repo]);

  async function loadWorkflowYaml(wf) {
    setSelectedWorkflow(wf);
    setYamlLoading(true);
    try {
      const res = await fetch(
        `/api/github/workflow-file?owner=${repo.owner}&repo=${repo.repo}&path=${encodeURIComponent(wf.path)}`
      );
      const data = await res.json();
      setYamlContent(data.content || '# Unable to load workflow file');
    } catch (err) {
      setYamlContent('# Error loading workflow file');
    }
    setYamlLoading(false);
  }

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>CI/CD Workflows</h1>
          <p>Loading workflows...</p>
        </div>
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <p>Fetching workflow data from GitHub...</p>
        </div>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>CI/CD Workflows</h1>
        </div>
        <div className="card">
          <div className="empty-state">
            <GitBranch size={48} />
            <h3>No Workflows Found</h3>
            <p>
              This repository doesn't have any GitHub Actions workflows configured.
              CI/CD workflows are defined in <code>.github/workflows/</code> directory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>CI/CD Workflows</h1>
        <p>View and inspect GitHub Actions workflow configurations</p>
      </div>

      <div className="two-col">
        {/* Workflow List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <GitBranch size={18} />
              Workflows ({workflows.length})
            </div>
          </div>
          <div className="workflow-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {workflows.map((wf, index) => (
              <div
                key={wf.id}
                className="run-item"
                onClick={() => loadWorkflowYaml(wf)}
                style={{
                  '--i': index,
                  border: selectedWorkflow?.id === wf.id ? '1px solid var(--border-primary)' : '1px solid transparent',
                  background: selectedWorkflow?.id === wf.id ? 'var(--bg-hover)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <FileCode size={18} style={{ color: 'var(--accent-primary-light)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {wf.name}
                  </div>
                  <div className="workflow-path" title={wf.path} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {wf.path}
                  </div>
                </div>
                <span className={`badge ${wf.state === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                  {wf.state}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* YAML Viewer */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Eye size={18} />
              {selectedWorkflow ? selectedWorkflow.name : 'Select a Workflow'}
            </div>
            {selectedWorkflow && (
              <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={async () => { await navigator.clipboard.writeText(yamlContent); setCopied(true); setTimeout(() => setCopied(false), 1500); }} aria-label="Copy YAML">
                {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={selectedWorkflow.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <ExternalLink size={14} />
                GitHub
              </a>
              </div>
            )}
          </div>
          {yamlLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading YAML...</p>
            </div>
          ) : (
            <div className="code-block" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <pre className="yaml-code" style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {yamlContent.split('\n').map((line, index) => <span className="yaml-line" style={{ '--i': index }} key={index}><span className="yaml-line-number">{index + 1}</span><code>{highlightYamlLine(line)}</code></span>)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
