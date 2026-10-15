import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Plus,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
  Lightbulb,
  Shield,
  BarChart3,
  Loader2,
  GitCommit,
  FileSearch,
  History,
  Cpu,
  BrainCircuit,
  Scan,
} from 'lucide-react';

function PredictionGauge({ probability, riskLevel }) {
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - probability * circumference;

  const colorMap = {
    low: 'var(--success)',
    medium: 'var(--warning)',
    high: 'var(--error)',
    critical: 'var(--coral)',
  };
  const color = colorMap[riskLevel] || 'var(--text-muted)';

  return (
    <div className="prediction-gauge">
      <div className="gauge-ring">
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
            style={{ '--ring-start': circumference, '--ring-end': offset, animation: 'ring-draw 700ms var(--ease-out) both', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        <div className="gauge-center">
          <div className="gauge-percent" style={{ color }}>
            {Math.round(probability * 100)}%
          </div>
          <div className="gauge-label">Failure Risk</div>
        </div>
      </div>
      <span className={`risk-label risk-${riskLevel}`}>
        {riskLevel} risk
      </span>
    </div>
  );
}

function BreakdownBar({ label, value, maxValue = 100, color = 'var(--accent-primary)' }) {
  const pct = Math.min(100, (value / maxValue) * 100);
  return (
    <div className="breakdown-row">
      <span className="breakdown-label">{label}</span>
      <div className="breakdown-bar-bg">
        <div
          className="breakdown-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="breakdown-value">{value}%</span>
    </div>
  );
}

/* ─── Prediction Loading Animation ───────────────────────────────────────── */

const PREDICTION_TASKS = [
  { icon: GitCommit, text: 'Parsing commit details & changed files…', color: 'var(--info)' },
  { icon: History, text: 'Fetching historical workflow run data…', color: 'var(--cobalt)' },
  { icon: FileSearch, text: 'Running heuristic risk analysis…', color: 'var(--warning)' },
  { icon: Scan, text: 'Evaluating file-based risk patterns…', color: 'var(--error)' },
  { icon: BrainCircuit, text: 'Running AI failure prediction model…', color: 'var(--lilac)' },
  { icon: Cpu, text: 'Combining heuristic & AI predictions…', color: 'var(--accent-primary)' },
  { icon: Sparkles, text: 'Generating risk report & recommendations…', color: 'var(--success)' },
];

function PredictionLoadingAnimation() {
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let taskIdx = 0;
    const totalTasks = PREDICTION_TASKS.length;

    const advance = () => {
      if (taskIdx < totalTasks) {
        setCompletedTasks((prev) => [...prev, taskIdx]);
        taskIdx += 1;
        setActiveTaskIndex(taskIdx);
        setProgress(Math.round((taskIdx / totalTasks) * 100));
      } else {
        taskIdx = 0;
        setCompletedTasks([]);
        setActiveTaskIndex(0);
        setProgress(0);
      }
      timerRef.current = setTimeout(advance, 1500 + Math.random() * 1000);
    };

    timerRef.current = setTimeout(advance, 600);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="ai-loading-live" aria-label="Prediction analysis in progress">
      <div className="ai-loading-progress-bar">
        <div className="ai-loading-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="ai-loading-header">
        <Loader2 size={18} className="ai-loading-spinner-icon" />
        <span>Running heuristic + AI analysis…</span>
        <span className="ai-loading-pct">{progress}%</span>
      </div>

      <div className="ai-loading-tasks">
        {PREDICTION_TASKS.map((task, idx) => {
          const isActive = idx === activeTaskIndex;
          const isCompleted = completedTasks.includes(idx);
          const Icon = task.icon;

          return (
            <div
              key={idx}
              className={`ai-loading-task ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              style={{ '--task-color': task.color }}
            >
              <span className="ai-loading-task-icon">
                {isCompleted ? (
                  <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
                ) : isActive ? (
                  <Loader2 size={15} className="ai-loading-spinner-icon" style={{ color: task.color }} />
                ) : (
                  <Icon size={15} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                )}
              </span>
              <span className="ai-loading-task-text">{task.text}</span>
              {isCompleted && <span className="ai-loading-check">✓</span>}
              {isActive && <span className="ai-loading-dots"><span>.</span><span>.</span><span>.</span></span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function PredictionPanel({ repo }) {
  const [commitMessage, setCommitMessage] = useState('');
  const [files, setFiles] = useState([
    { filename: '', changeType: 'modified', additions: 10, deletions: 5 },
  ]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  function addFile() {
    setFiles((prev) => [
      ...prev,
      { filename: '', changeType: 'modified', additions: 0, deletions: 0 },
    ]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFile(index, field, value) {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  }

  async function runPrediction() {
    if (!commitMessage.trim()) return;
    setLoading(true);
    setPrediction(null);
    try {
      const res = await fetch('/api/predict/failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repo.owner,
          repo: repo.repo,
          commitMessage: commitMessage.trim(),
          files: files.filter((f) => f.filename.trim()),
        }),
      });
      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const heuristic = prediction?.heuristicPrediction;
  const ai = prediction?.aiPrediction;
  const combined = prediction?.combinedPrediction;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Failure Prediction</h1>
        <p>
          Enter a hypothetical commit to predict how likely it is to fail in this
          repository's CI/CD pipeline
        </p>
      </div>

      <div className="two-col">
        {/* Input Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Brain size={18} />
              Commit Details
            </div>
          </div>

          <div className="form-group">
            <label>Commit Message</label>
            <textarea
              className="input"
              placeholder="e.g., feat: add user authentication module"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              rows={3}
              id="commit-message-input"
            />
          </div>

          <div className="form-group">
            <label>Files Changed</label>
            <div className="file-change-list">
              <div
                className="file-change-row file-change-heading"
                aria-hidden="true"
                style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                <span>Filename</span>
                <span>Change Type</span>
                <span>Additions</span>
                <span>Deletions</span>
                <span></span>
              </div>
              {files.map((file, idx) => (
                <div key={idx} className="file-change-row">
                  <input
                    className="input input-mono"
                    aria-label={`Filename for file ${idx + 1}`}
                    placeholder="src/components/Auth.jsx"
                    value={file.filename}
                    onChange={(e) => updateFile(idx, 'filename', e.target.value)}
                  />
                  <select
                    aria-label={`Change type for file ${idx + 1}`}
                    value={file.changeType}
                    onChange={(e) => updateFile(idx, 'changeType', e.target.value)}
                  >
                    <option value="added">Added</option>
                    <option value="modified">Modified</option>
                    <option value="removed">Removed</option>
                    <option value="renamed">Renamed</option>
                  </select>
                  <input
                    className="input"
                    type="number"
                    aria-label={`Additions for file ${idx + 1}`}
                    min={0}
                    value={file.additions}
                    onChange={(e) => updateFile(idx, 'additions', parseInt(e.target.value) || 0)}
                  />
                  <input
                    className="input"
                    type="number"
                    aria-label={`Deletions for file ${idx + 1}`}
                    min={0}
                    value={file.deletions}
                    onChange={(e) => updateFile(idx, 'deletions', parseInt(e.target.value) || 0)}
                  />
                  <button
                    className="remove-file-btn"
                    onClick={() => removeFile(idx)}
                    disabled={files.length <= 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={addFile}
              style={{ marginTop: 8 }}
            >
              <Plus size={14} />
              Add File
            </button>
          </div>

          <button
            className="btn btn-primary predict-primary"
            onClick={runPrediction}
            disabled={loading || !commitMessage.trim()}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            id="predict-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="ai-loading-spinner-icon" />
                Analyzing…
              </>
            ) : (
              <>
                <Brain size={16} />
                Predict Failure Probability
              </>
            )}
          </button>
        </div>

        {/* Prediction Results */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Target size={18} />
              Prediction Result
            </div>
            {prediction && (
              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-info">Heuristic</span>
                {ai?.available && <span className="ai-badge">+ AI insights</span>}
              </div>
            )}
          </div>

          {!prediction && !loading && (
            <div className="prediction-placeholder">
              <PredictionGauge probability={0} riskLevel="low" />
              <p>Example output: probability gauge, risk band, and contributing factors appear here.</p>
              <span className="badge badge-neutral">Awaiting commit details</span>
            </div>
          )}

          {loading && <PredictionLoadingAnimation />}

          {prediction && !loading && combined && (
            <div className="slide-in">
              {/* Main Gauge */}
              <PredictionGauge
                probability={combined.failureProbability}
                riskLevel={combined.riskLevel}
              />

              {/* Historical context */}
              {prediction.historicalData && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Historical success rate: {prediction.historicalData.successRate}% ({prediction.historicalData.totalRuns} runs)
                  </span>
                </div>
              )}

              {/* Heuristic Breakdown */}
              {heuristic?.breakdown && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BarChart3 size={14} />
                    Risk Breakdown (Heuristic Model)
                  </div>
                  <div className="breakdown-bars">
                    <BreakdownBar label="Historical" value={heuristic.breakdown.historicalRate} color="var(--info)" />
                    <BreakdownBar label="File Risk" value={heuristic.breakdown.fileRisk} color="var(--warning)" />
                    <BreakdownBar label="Volume" value={heuristic.breakdown.volumeRisk} color="var(--accent-primary)" />
                    <BreakdownBar label="Trend" value={heuristic.breakdown.trendRisk} color="var(--error)" />
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {heuristic?.riskFactors?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} />
                    Risk Factors
                  </div>
                  <div className="risk-factors">
                    {heuristic.riskFactors.map((rf, i) => (
                      <div key={i} className={`risk-factor ${rf.risk}`}>
                        <div>
                          <div className="risk-factor-title">{rf.factor}</div>
                          <div className="risk-factor-detail">{rf.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Prediction Details */}
              {ai?.available && ai?.prediction && (
                <div className="ai-section" style={{ marginTop: 16 }}>
                  <div className="ai-section-header">
                    <Sparkles size={16} style={{ color: 'var(--accent-primary-light)' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>AI Insights</span>
                    <span className="ai-badge">AI</span>
                  </div>

                  {/* AI Reasoning */}
                  {ai.prediction.reasoning && (
                    <div className="ai-finding" style={{ marginBottom: 10 }}>
                      <h4>Analysis</h4>
                      <p>{ai.prediction.reasoning}</p>
                    </div>
                  )}

                  {/* Likely Failure Points */}
                  {ai.prediction.likelyFailurePoints?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Target size={14} />
                        Likely Failure Points
                      </div>
                      {ai.prediction.likelyFailurePoints.map((fp, i) => (
                        <div key={i} className="ai-finding" style={{ borderLeftColor: 'var(--error)' }}>
                          <h4>{fp.step}</h4>
                          <p>{fp.reason}</p>
                          {fp.probability !== undefined && (
                            <span className="badge badge-error" style={{ marginTop: 4, display: 'inline-flex' }}>
                              {Math.round(fp.probability * 100)}% probability
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Recommendations */}
                  {ai.prediction.recommendations?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Lightbulb size={14} />
                        Recommendations
                      </div>
                      {ai.prediction.recommendations.map((rec, i) => (
                        <div key={i} className="ai-finding" style={{ borderLeftColor: 'var(--success)' }}>
                          <p>{rec}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {ai.prediction.confidenceLevel && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <span className="badge badge-info">
                        AI Confidence: {ai.prediction.confidenceLevel}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {ai && !ai.available && (
                <div className="issue-card warning" style={{ marginTop: 12 }}>
                  <div className="issue-message">
                    <AlertTriangle size={14} style={{ marginRight: 6 }} />
                    {ai.message || 'AI analysis unavailable. Results based on heuristic model only.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
