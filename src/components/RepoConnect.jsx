import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, AlertCircle, GitFork as GithubIcon,
  Search, ShieldCheck, Sparkles, Workflow,
} from 'lucide-react';
import PipelineBackdrop from './PipelineBackdrop';
import TerminalStrip from './TerminalStrip';

const examples = ['facebook/react', 'vercel/next.js', 'microsoft/vscode', 'nodejs/node'];
const stages = [
  ['01', 'Commit', 'Changes enter the pipeline'],
  ['02', 'Build', 'Dependencies and runners'],
  ['03', 'Test', 'Flakes and regressions'],
  ['04', 'Security', 'Workflow risks'],
  ['05', 'Deploy', 'Ready for release'],
];

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
        card.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
        card.style.setProperty('--tilt-y', `${(x - 0.5) * 3}deg`);
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
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setFailed(false);
    const err = await onConnect(url.trim());
    if (err) {
      setError(err);
      setFailed(true);
      window.clearTimeout(failureTimer.current);
      failureTimer.current = window.setTimeout(() => setFailed(false), 700);
    }
  }

  return (
    <div className="connect-screen">
      <PipelineBackdrop active={Boolean(url)} connecting={loading} failed={failed} hoveredExample={hoveredExample} />
      <div className="connect-content">
        <header className="landing-masthead">
          <div className="landing-wordmark">
            <span className="landing-mark"><ShieldCheck size={17} strokeWidth={2.4} /></span>
            <span>GUARDIAN<span className="wordmark-slash">/</span><span className="wordmark-sub">CI INTELLIGENCE</span></span>
          </div>
          <div className="masthead-edition"><span className="signal-dot" /> OPEN SOURCE WORKFLOW ANALYSIS</div>
          <a className="masthead-scroll" href="#connect-repository" aria-label="Skip to repository connection">START HERE <ArrowDownRight size={15} /></a>
        </header>

        <main className="landing-grid">
          <section className="landing-story" aria-labelledby="landing-title">
            <div className="landing-kicker"><span>FIELD NOTE 001</span><span>THE RELEASE PIPELINE, DECODED</span></div>
            <h1 id="landing-title">Make every<br /><span className="headline-outline">build</span> <span className="headline-accent">count.</span></h1>
            <p className="landing-deck">Your CI already tells a story. Guardian reads the signals, finds the weak links, and gives your next release a clearer path.</p>

            <div className="landing-principles" aria-label="What Guardian analyzes">
              <div><span className="principle-icon"><Workflow size={16} /></span><span><b>Trace the flow</b><small>Jobs, steps, and dependencies</small></span><span className="principle-index">A</span></div>
              <div><span className="principle-icon coral"><AlertCircle size={16} /></span><span><b>Catch the pattern</b><small>Failures, flakes, and risk signals</small></span><span className="principle-index">B</span></div>
              <div><span className="principle-icon blue"><Sparkles size={16} /></span><span><b>Find the next move</b><small>Specific, actionable suggestions</small></span><span className="principle-index">C</span></div>
            </div>

            <div className="pipeline-board" aria-label="Pipeline stages Guardian analyzes">
              <div className="pipeline-board-head"><span>THE DELIVERY LINE</span><span>FIVE SIGNAL POINTS <i /></span></div>
              <div className="pipeline-track">
                {stages.map(([number, name, detail], index) => (
                  <div className="pipeline-stage" key={name} style={{ '--stage-index': index }}>
                    <span className="stage-node"><span>{number}</span></span>
                    <span className="stage-name">{name}</span>
                    <span className="stage-detail">{detail}</span>
                  </div>
                ))}
              </div>
              <div className="pipeline-board-foot"><span>COMMIT → CONFIDENCE</span><span className="board-coordinate">37°46'49.3"N &nbsp; 122°25'09.6"W</span></div>
            </div>
          </section>

          <section id="connect-repository" className={`connect-card ${failed ? 'connect-failed' : ''}`} onPointerMove={handleCardPointer} onPointerLeave={resetCardPointer} aria-labelledby="connect-title">
            <div className="connect-card-top"><span>02 <i>/</i> CONNECT A SOURCE</span><GithubIcon size={19} aria-hidden="true" /></div>
            <div className="card fade-in" ref={cardRef}>
              <div className="connect-icon"><GithubIcon /></div>
              <div className="connect-label">START WITH A REPOSITORY</div>
              <h2 id="connect-title" className="connect-headline">Bring your<br />pipeline into focus.</h2>
              <p>Connect a public GitHub repository. We’ll map its workflows and surface the details that make releases more reliable.</p>
              <form onSubmit={handleSubmit}>
                <label className="repo-input-label" htmlFor="repo-url-input">GITHUB REPOSITORY</label>
                <div className="input-group">
                  <div className="repo-input-wrap">
                    <Search size={16} aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="owner/repository"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      className={`input input-mono ${failed ? 'input-shake' : ''}`}
                      id="repo-url-input"
                      autoComplete="url"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'repo-connect-error' : 'repo-input-hint'}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading || !url.trim()} id="connect-btn">
                    {loading ? <><span className="spinner" /> Reading</> : <>Analyze <ArrowRight size={16} /></>}
                  </button>
                </div>
                <div id="repo-input-hint" className="repo-input-hint">Public GitHub URL or owner/repository</div>
              </form>
              {error && <div className="error-message" id="repo-connect-error" role="alert"><AlertCircle size={14} />{error}</div>}
              <div className="example-repos">
                <div className="example-heading"><span>OR EXPLORE A LIVE REPOSITORY</span><span>↘</span></div>
                <div className="example-list">
                  {examples.map((example, index) => (
                    <button key={example} type="button" className="example-repo" onClick={() => setUrl(example)} onMouseEnter={() => setHoveredExample(example)} onMouseLeave={() => setHoveredExample('')} onFocus={() => setHoveredExample(example)} onBlur={() => setHoveredExample('')}>
                      <span className="example-index">0{index + 1}</span><span>{example}</span><ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="connect-card-foot"><span><span className="privacy-dot" /> PUBLIC REPOSITORIES</span><span>NO SETUP REQUIRED</span></div>
            </div>
            <div className="connect-card-caption"><span>REPOSITORY IN / SIGNAL OUT</span><span>↓</span></div>
          </section>
        </main>

        <footer className="landing-footer"><span>BUILT FOR THE MOMENT BEFORE “MERGE”</span><span>CI/CD GUARDIAN <i>·</i> RELEASE WITH SIGNAL</span><span>01 — 05</span></footer>
        <TerminalStrip target={url.trim()} />
      </div>
    </div>
  );
}
