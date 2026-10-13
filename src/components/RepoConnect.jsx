import React, { useState } from 'react';
import { GitFork as GithubIcon, ArrowRight, AlertCircle, Search } from 'lucide-react';

export default function RepoConnect({ onConnect, loading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    const err = await onConnect(url.trim());
    if (err) setError(err);
  };

  const examples = [
    'facebook/react',
    'vercel/next.js',
    'microsoft/vscode',
    'nodejs/node',
  ];

  return (
    <div className="connect-screen">
      <div className="connect-card">
        <div className="card fade-in">
          <div className="connect-icon">
            <GithubIcon />
          </div>
          <h2>Connect a Repository</h2>
          <p>
            Enter a public GitHub repository to analyze its CI/CD workflows,
            detect potential failures, and get AI-powered improvement suggestions.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="input input-mono"
                  placeholder="owner/repo or GitHub URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ paddingLeft: 38 }}
                  id="repo-url-input"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !url.trim()}
                id="connect-btn"
              >
                {loading ? (
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                ) : (
                  <>
                    Connect <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
          {error && (
            <div className="error-message">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Try an example
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {examples.map((ex) => (
                <button
                  key={ex}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setUrl(ex)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
