import React, { useEffect, useRef, useState } from 'react';
import { GitFork as GithubIcon, ArrowRight, AlertCircle, Search } from 'lucide-react';
import PipelineBackdrop from './PipelineBackdrop';
import TerminalStrip from './TerminalStrip';

export default function RepoConnect({ onConnect, loading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [hoveredExample, setHoveredExample] = useState('');
  const [failed, setFailed] = useState(false);
  const cardRef = useRef(null);
  const pointerFrame = useRef(0);
  const failureTimer = useRef(0);

  useEffect(() => () => {
    cancelAnimationFrame(pointerFrame.current);
    window.clearTimeout(failureTimer.current);
  }, []);

  function handleCardPointer(event) {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches || pointerFrame.current) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    pointerFrame.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (card) {
        card.style.setProperty('--spot-x', `${x * 100}%`);
        card.style.setProperty('--spot-y', `${y * 100}%`);
        card.style.setProperty('--tilt-x', `${(0.5 - y) * 8}deg`);
        card.style.setProperty('--tilt-y', `${(x - 0.5) * 8}deg`);
      }
      pointerFrame.current = 0;
    });
  }

  function resetCardPointer() {
    cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = 0;
    const card = cardRef.current;
    if (card) {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--spot-x', '50%');
      card.style.setProperty('--spot-y', '50%');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setFailed(false);
    const err = await onConnect(url.trim());
    if (err) { setError(err); setFailed(true); window.clearTimeout(failureTimer.current); failureTimer.current = window.setTimeout(() => setFailed(false), 700); }
  };

  const examples = [
    'facebook/react',
    'vercel/next.js',
    'microsoft/vscode',
    'nodejs/node',
  ];

  return (
    <div className="connect-screen">
      <PipelineBackdrop active={Boolean(url)} connecting={loading} failed={failed} hoveredExample={hoveredExample} />
      <div className="connect-content">
      <div className={`connect-card ${failed ? 'connect-failed' : ''}`} onPointerMove={handleCardPointer} onPointerLeave={resetCardPointer}>
        <div className="card fade-in" ref={cardRef}>
          <div className="connect-icon">
            <GithubIcon />
          </div>
          <h2 className="connect-headline" aria-label="Connect a Repository"><span style={{ '--word-index': 0 }}>Connect</span> <span style={{ '--word-index': 1 }}>a</span><br /><span className="repository-word" style={{ '--word-index': 2 }}>Repository</span></h2>
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
                  placeholder="owner/repo or GitHub URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`input input-mono ${failed ? 'input-shake' : ''}`}
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
                  onMouseEnter={() => setHoveredExample(ex)}
                  onMouseLeave={() => setHoveredExample('')}
                  onFocus={() => setHoveredExample(ex)}
                  onBlur={() => setHoveredExample('')}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TerminalStrip target={url.trim()} />
      </div>
    </div>
  );
}
