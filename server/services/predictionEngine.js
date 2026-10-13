/**
 * Heuristic-based failure prediction engine.
 * Uses historical run data and commit characteristics to compute a failure risk score.
 * No ML training required — uses statistical patterns and domain rules.
 */

// File patterns that are high-risk for CI/CD failures
const HIGH_RISK_PATTERNS = [
  { pattern: /\.github\/workflows\//i, weight: 0.25, reason: 'CI config changes are inherently risky' },
  { pattern: /Dockerfile/i, weight: 0.2, reason: 'Docker changes can break build/deploy' },
  { pattern: /docker-compose/i, weight: 0.15, reason: 'Docker Compose changes affect service orchestration' },
  { pattern: /package\.json$/i, weight: 0.15, reason: 'Dependency changes can introduce incompatibilities' },
  { pattern: /requirements\.txt$/i, weight: 0.15, reason: 'Python dependency changes can break builds' },
  { pattern: /Gemfile$/i, weight: 0.15, reason: 'Ruby dependency changes can break builds' },
  { pattern: /\.env/i, weight: 0.12, reason: 'Environment config changes can cause runtime failures' },
  { pattern: /webpack|vite|rollup|babel/i, weight: 0.1, reason: 'Build config changes can break compilation' },
  { pattern: /tsconfig/i, weight: 0.1, reason: 'TypeScript config changes affect compilation' },
  { pattern: /jest\.config|vitest|\.test\.|\.spec\./i, weight: 0.08, reason: 'Test config/file changes may cause test failures' },
  { pattern: /migration/i, weight: 0.12, reason: 'Database migrations are failure-prone' },
];

const LOW_RISK_PATTERNS = [
  { pattern: /\.md$/i, weight: -0.1, reason: 'Documentation changes rarely affect CI' },
  { pattern: /\.txt$/i, weight: -0.08, reason: 'Text files rarely affect CI' },
  { pattern: /LICENSE/i, weight: -0.1, reason: 'License changes dont affect CI' },
  { pattern: /\.gitignore$/i, weight: -0.05, reason: 'Gitignore changes rarely affect CI' },
  { pattern: /\.(png|jpg|jpeg|gif|svg|ico)$/i, weight: -0.05, reason: 'Image assets rarely affect CI' },
];

/**
 * Compute heuristic failure prediction
 * @param {object} commitData - { message, files: [{ filename, changeType, additions, deletions }] }
 * @param {object} historicalData - { totalRuns, failures, successRate, recentRuns }
 * @returns {object} Prediction result
 */
function predictFailure(commitData, historicalData) {
  let riskScore = 0;
  const riskFactors = [];

  // 1. Historical failure rate (30% weight)
  const histFailureRate = historicalData.totalRuns > 0
    ? historicalData.failures / historicalData.totalRuns
    : 0.15; // Default 15% if no history
  riskScore += histFailureRate * 0.3;
  if (histFailureRate > 0.3) {
    riskFactors.push({
      factor: 'High historical failure rate',
      risk: 'high',
      detail: `${(histFailureRate * 100).toFixed(1)}% of recent runs failed`,
      contribution: histFailureRate * 0.3,
    });
  }

  // 2. File-based risk analysis (40% weight)
  let fileRiskSum = 0;
  const files = commitData.files || [];

  for (const file of files) {
    let fileRisk = 0;
    for (const pattern of HIGH_RISK_PATTERNS) {
      if (pattern.pattern.test(file.filename)) {
        fileRisk = Math.max(fileRisk, pattern.weight);
        riskFactors.push({
          factor: `High-risk file: ${file.filename}`,
          risk: pattern.weight > 0.15 ? 'high' : 'medium',
          detail: pattern.reason,
          contribution: pattern.weight * 0.4,
        });
      }
    }
    for (const pattern of LOW_RISK_PATTERNS) {
      if (pattern.pattern.test(file.filename)) {
        fileRisk = Math.min(fileRisk, pattern.weight);
      }
    }
    fileRiskSum += fileRisk;
  }

  const avgFileRisk = files.length > 0 ? fileRiskSum / files.length : 0;
  riskScore += Math.max(0, avgFileRisk) * 0.4;

  // 3. Change volume risk (15% weight)
  const totalChanges = files.reduce((sum, f) => sum + (f.additions || 0) + (f.deletions || 0), 0);
  const fileCount = files.length;

  let volumeRisk = 0;
  if (fileCount > 20) {
    volumeRisk = 0.8;
    riskFactors.push({
      factor: 'Large number of files changed',
      risk: 'high',
      detail: `${fileCount} files changed — large changesets have higher failure rates`,
      contribution: 0.8 * 0.15,
    });
  } else if (fileCount > 10) {
    volumeRisk = 0.5;
    riskFactors.push({
      factor: 'Moderate number of files changed',
      risk: 'medium',
      detail: `${fileCount} files changed`,
      contribution: 0.5 * 0.15,
    });
  } else if (totalChanges > 500) {
    volumeRisk = 0.4;
    riskFactors.push({
      factor: 'Large number of line changes',
      risk: 'medium',
      detail: `${totalChanges} total line changes`,
      contribution: 0.4 * 0.15,
    });
  }
  riskScore += volumeRisk * 0.15;

  // 4. Recent trend analysis (15% weight)
  const recentRuns = historicalData.recentRuns || [];
  const last5 = recentRuns.slice(0, 5);
  const recentFailures = last5.filter((r) => r.conclusion === 'failure').length;
  let trendRisk = 0;
  if (recentFailures >= 3) {
    trendRisk = 0.8;
    riskFactors.push({
      factor: 'Unstable recent CI history',
      risk: 'high',
      detail: `${recentFailures} of last 5 runs failed — pipeline is currently unstable`,
      contribution: 0.8 * 0.15,
    });
  } else if (recentFailures >= 2) {
    trendRisk = 0.4;
    riskFactors.push({
      factor: 'Recent CI failures detected',
      risk: 'medium',
      detail: `${recentFailures} of last 5 runs failed`,
      contribution: 0.4 * 0.15,
    });
  }
  riskScore += trendRisk * 0.15;

  // Clamp to [0, 1]
  riskScore = Math.max(0, Math.min(1, riskScore));

  // Determine risk level
  let riskLevel;
  if (riskScore >= 0.7) riskLevel = 'critical';
  else if (riskScore >= 0.45) riskLevel = 'high';
  else if (riskScore >= 0.25) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    failureProbability: Math.round(riskScore * 100) / 100,
    riskLevel,
    riskFactors: riskFactors.sort((a, b) => b.contribution - a.contribution).slice(0, 8),
    modelType: 'heuristic',
    breakdown: {
      historicalRate: Math.round(histFailureRate * 0.3 * 100),
      fileRisk: Math.round(Math.max(0, avgFileRisk) * 0.4 * 100),
      volumeRisk: Math.round(volumeRisk * 0.15 * 100),
      trendRisk: Math.round(trendRisk * 0.15 * 100),
    },
  };
}

module.exports = { predictFailure };
