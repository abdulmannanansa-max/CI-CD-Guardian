import React from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  FileCode2,
  GitBranch,
  Gauge,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
  Workflow,
  Zap,
} from 'lucide-react';

const RULES = [
  {
    id: 'no-permissions', title: 'Least-privilege permissions', category: 'Security', severity: 'critical', icon: LockKeyhole,
    detail: 'Flags a workflow when neither the workflow nor any job defines permissions for the GitHub token.',
  },
  {
    id: 'no-timeout', title: 'Job timeouts', category: 'Reliability', severity: 'warning', icon: Clock3,
    detail: 'Lists jobs without a truthy timeout-minutes value, which can leave a run consuming resources indefinitely.',
  },
  {
    id: 'no-caching', title: 'Dependency caching', category: 'Performance', severity: 'warning', icon: PackageCheck,
    detail: 'Looks for npm install, pip install, or yarn text. If found, it flags the workflow when neither actions/cache nor setup-node appears.',
  },
  {
    id: 'hardcoded-version', title: 'Action versions', category: 'Maintainability', severity: 'warning', icon: GitBranch,
    detail: 'Finds action references matching owner/action@v1 or @v2 and reports them as potentially outdated.',
  },
  {
    id: 'no-env-protection', title: 'Deployment environment gates', category: 'Security', severity: 'warning', icon: ShieldCheck,
    detail: 'When secrets syntax is present, checks jobs named deploy or release for an environment setting.',
  },
  {
    id: 'no-concurrency', title: 'Concurrency control', category: 'Efficiency', severity: 'info', icon: Zap,
    detail: 'Flags the workflow if it has no top-level concurrency setting.',
  },
  {
    id: 'no-fail-fast', title: 'Matrix fail-fast choice', category: 'Reliability', severity: 'info', icon: Workflow,
    detail: 'Finds the first matrix job without an explicit strategy.fail-fast setting.',
  },
  {
    id: 'inline-scripts', title: 'Long inline scripts', category: 'Maintainability', severity: 'info', icon: Code2,
    detail: 'Counts run steps that contain more than 15 lines and suggests extracting complex logic.',
  },
  {
    id: 'no-artifact-upload', title: 'Build and test artifacts', category: 'Observability', severity: 'info', icon: Upload,
    detail: 'If workflow text contains test, jest, pytest, or build, flags it when actions/upload-artifact is absent.',
  },
  {
    id: 'no-retry', title: 'Network retries', category: 'Reliability', severity: 'info', icon: RefreshCw,
    detail: 'Looks for npm install, pip install, docker pull, curl, or wget; flags if retry and attempts are both absent.',
  },
  {
    id: 'no-path-filter', title: 'Trigger path filters', category: 'Efficiency', severity: 'info', icon: GitBranch,
    detail: 'Flags when both push and pull_request triggers exist and neither has a paths or paths-ignore filter.',
  },
];

const SCORE_BANDS = [
  { grade: 'A', range: '90–100', tone: 'success' },
  { grade: 'B', range: '75–89', tone: 'info' },
  { grade: 'C', range: '60–74', tone: 'warning' },
  { grade: 'D', range: '40–59', tone: 'warning' },
  { grade: 'F', range: '0–39', tone: 'critical' },
];

function severityLabel(severity) {
  return severity === 'critical' ? 'Critical · −20' : severity === 'warning' ? 'Warning · −10' : 'Info · −3';
}

export default function AnalysisGuide() {
  return (
    <div className="analysis-guide fade-in">
      <header className="page-header">
        <span className="eyebrow"><Sparkles size={13} /> ANALYSIS FIELD GUIDE</span>
        <h1>How the analysis works</h1>
        <p>A transparent look at how Guardian reads workflow files, applies its checks, and turns findings into a robustness score.</p>
      </header>

      <section className="guide-overview card">
        <div className="guide-overview-icon"><ScanSearch size={22} /></div>
        <div>
          <span className="guide-kicker">STATIC WORKFLOW REVIEW</span>
          <h2>Rules first. Clear findings. A score you can trace.</h2>
          <p>The server parses each GitHub Actions YAML file, checks its structure and selected text patterns, then returns findings with severity, suggestions, workflow metadata, and a score.</p>
        </div>
      </section>

      <section className="guide-section" aria-labelledby="guide-pipeline-title">
        <div className="guide-section-heading">
          <div><span className="guide-kicker">01 / THE PIPELINE</span><h2 id="guide-pipeline-title">From YAML to result</h2></div>
          <span className="guide-section-note">Backend sequence</span>
        </div>
        <div className="guide-flow">
          <article className="guide-flow-step"><span className="guide-flow-index">01</span><FileCode2 /><h3>Read YAML</h3><p>Workflow source is parsed into a data structure.</p></article>
          <ArrowRight className="guide-flow-arrow" aria-hidden="true" />
          <article className="guide-flow-step"><span className="guide-flow-index">02</span><ScanSearch /><h3>Run checks</h3><p>Eleven predefined heuristics inspect jobs, steps, triggers, and workflow text.</p></article>
          <ArrowRight className="guide-flow-arrow" aria-hidden="true" />
          <article className="guide-flow-step"><span className="guide-flow-index">03</span><Gauge /><h3>Calculate score</h3><p>Severity-based penalties are subtracted from 100 and clamped to 0–100.</p></article>
          <ArrowRight className="guide-flow-arrow" aria-hidden="true" />
          <article className="guide-flow-step"><span className="guide-flow-index">04</span><CheckCircle2 /><h3>Return report</h3><p>Findings, grade, job names, triggers, and step totals are returned.</p></article>
        </div>
        <div className="guide-parse-note"><AlertTriangle size={15} /><span>If YAML parsing fails or the document has no jobs, analysis returns a parse error and score 0; that error response has no grade.</span></div>
      </section>

      <section className="guide-section" aria-labelledby="guide-rules-title">
        <div className="guide-section-heading">
          <div><span className="guide-kicker">02 / THE HEURISTICS</span><h2 id="guide-rules-title">All predefined rules</h2></div>
          <span className="guide-rule-count">{RULES.length} CHECKS</span>
        </div>
        <div className="guide-rule-grid">
          {RULES.map(({ id, title, category, severity, icon: Icon, detail }) => (
            <article className={`guide-rule-card severity-${severity}`} key={id}>
              <div className="guide-rule-top"><span className="guide-rule-icon"><Icon size={17} /></span><span className={`guide-severity-pill ${severity}`}>{severityLabel(severity)}</span></div>
              <div className="guide-rule-category">{category}</div>
              <h3>{title}</h3>
              <code>{id}</code>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-section guide-scoring-section" aria-labelledby="guide-score-title">
        <div className="guide-section-heading">
          <div><span className="guide-kicker">03 / THE SCORE</span><h2 id="guide-score-title">How score becomes grade</h2></div>
        </div>
        <div className="guide-score-layout">
          <article className="guide-score-card">
            <span className="guide-kicker">ROBUSTNESS FORMULA</span>
            <div className="guide-score-equation"><strong>100</strong><ArrowDown size={17} /><span>severity penalties</span></div>
            <div className="guide-penalty-list">
              <div><span className="guide-severity-dot critical" />Critical findings <b>−20 each</b></div>
              <div><span className="guide-severity-dot warning" />Warning findings <b>−10 each</b></div>
              <div><span className="guide-severity-dot info" />Info findings <b>−3 each</b></div>
            </div>
            <code className="guide-formula">score = clamp(100 − 20C − 10W − 3I, 0, 100)</code>
          </article>
          <article className="guide-grade-card">
            <span className="guide-kicker">GRADE BANDS</span>
            <div className="guide-grade-list">
              {SCORE_BANDS.map(({ grade, range, tone }) => <div className={`guide-grade-row ${tone}`} key={grade}><b>{grade}</b><span className="guide-grade-track"><i /></span><span>{range}</span></div>)}
            </div>
          </article>
        </div>
        <div className="guide-example"><span className="guide-example-mark">EXAMPLE</span><p><b>1 critical + 2 warnings + 3 info</b> → 100 − 20 − 20 − 9 = <strong>51 / D</strong></p></div>
      </section>

      <section className="guide-section" aria-labelledby="guide-prediction-title">
        <div className="guide-section-heading">
          <div><span className="guide-kicker">04 / FAILURE PREDICTION</span><h2 id="guide-prediction-title">What does the prediction % mean?</h2></div>
        </div>
        <div className="guide-prediction-grid">
          <article className="guide-accuracy-card">
            <span className="guide-kicker">VALIDATED ACCURACY</span>
            <strong>NOT<br />MEASURED</strong>
            <p>The app currently has no labeled prediction history that compares a saved prediction with what happened in the next CI run. So there is no defensible accuracy percentage to report yet.</p>
          </article>
          <article className="guide-predict-method card">
            <div className="guide-predict-title"><Gauge size={18} /><h3>Risk estimate ≠ accuracy</h3></div>
            <p>The displayed failure probability is a model estimate for the commit being assessed. It is not a claim that prior predictions were correct that percentage of the time.</p>
            <div className="guide-weight-list">
              <div><span>Historical failure rate</span><b>30%</b></div>
              <div><span>Changed-file patterns</span><b>40%</b></div>
              <div><span>Change volume</span><b>15%</b></div>
              <div><span>Recent failure trend</span><b>15%</b></div>
            </div>
            <div className="guide-blend-note">When AI returns a prediction, the API blends 40% heuristic + 60% AI. If AI is unavailable, it uses the heuristic result alone.</div>
          </article>
        </div>
        <div className="guide-evaluation-card">
          <div><span className="guide-kicker">HOW TO GET A REAL ACCURACY %</span><p>Save each prediction <i>before</i> its workflow runs, then link it to that run’s final success/failure result. Evaluate later predictions on a chronological holdout set.</p></div>
          <code>accuracy = correct fixed-threshold predictions ÷ evaluated predictions × 100</code>
          <small>Also track precision, recall, and probability calibration. This project does not currently persist the prediction/outcome pairs needed for those metrics.</small>
        </div>
      </section>

      <footer className="guide-footnote"><ShieldCheck size={16} /><p><b>Heuristic limits:</b> these checks are lightweight indicators, not a complete GitHub Actions security validator. Some inspect serialized YAML text, so wording, capitalization, or unrelated text can affect matches. Individual rule errors are skipped silently. AI-generated commentary may supplement the report, while this robustness score is calculated by the rule-based analyzer.</p></footer>
    </div>
  );
}
