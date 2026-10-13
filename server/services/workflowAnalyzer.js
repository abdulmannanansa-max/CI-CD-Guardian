const yaml = require('yaml');

/**
 * Rule-based CI/CD workflow analyzer.
 * Parses GitHub Actions YAML and checks against best-practice rules.
 * Returns issues categorized by severity: critical, warning, info.
 */

const RULES = [
  {
    id: 'no-timeout',
    severity: 'warning',
    category: 'Reliability',
    check: (workflow) => {
      const jobs = workflow.jobs || {};
      const jobsWithoutTimeout = Object.entries(jobs)
        .filter(([, job]) => !job['timeout-minutes'])
        .map(([name]) => name);
      if (jobsWithoutTimeout.length > 0) {
        return {
          message: `Jobs without timeout-minutes: ${jobsWithoutTimeout.join(', ')}`,
          suggestion: 'Add `timeout-minutes` to all jobs to prevent hung pipelines from consuming resources.',
          affectedJobs: jobsWithoutTimeout,
        };
      }
      return null;
    },
  },
  {
    id: 'no-caching',
    severity: 'warning',
    category: 'Performance',
    check: (workflow) => {
      const workflowStr = JSON.stringify(workflow);
      if (!workflowStr.includes('actions/cache') && !workflowStr.includes('setup-node') ) {
        // Check if there are install steps that could benefit from caching
        if (workflowStr.includes('npm install') || workflowStr.includes('pip install') || workflowStr.includes('yarn')) {
          return {
            message: 'No dependency caching detected despite package installation steps.',
            suggestion: 'Use `actions/cache` or built-in caching in setup actions to speed up workflows by 30-70%.',
          };
        }
      }
      return null;
    },
  },
  {
    id: 'no-concurrency',
    severity: 'info',
    category: 'Efficiency',
    check: (workflow) => {
      if (!workflow.concurrency) {
        return {
          message: 'No concurrency control configured.',
          suggestion: 'Add `concurrency` with `cancel-in-progress: true` to prevent redundant runs on rapid pushes.',
        };
      }
      return null;
    },
  },
  {
    id: 'hardcoded-version',
    severity: 'warning',
    category: 'Maintainability',
    check: (workflow) => {
      const workflowStr = JSON.stringify(workflow);
      const oldActions = [];
      // Check for actions using @v1 or @v2 (often outdated)
      const actionPattern = /uses:\s*["']?([^"'\s]+@v[12])["']?/g;
      const matches = workflowStr.matchAll(/([a-zA-Z-]+\/[a-zA-Z-]+@v[12])\b/g);
      for (const m of matches) {
        oldActions.push(m[1]);
      }
      if (oldActions.length > 0) {
        return {
          message: `Potentially outdated action versions: ${[...new Set(oldActions)].join(', ')}`,
          suggestion: 'Update to latest major versions of actions for security patches and new features.',
        };
      }
      return null;
    },
  },
  {
    id: 'no-fail-fast',
    severity: 'info',
    category: 'Reliability',
    check: (workflow) => {
      const jobs = workflow.jobs || {};
      for (const [name, job] of Object.entries(jobs)) {
        if (job.strategy?.matrix && job.strategy['fail-fast'] === undefined) {
          return {
            message: `Job "${name}" uses matrix strategy without explicit fail-fast setting.`,
            suggestion: 'Explicitly set `fail-fast: false` if you want all matrix jobs to complete even if one fails, or `true` for fast feedback.',
          };
        }
      }
      return null;
    },
  },
  {
    id: 'no-permissions',
    severity: 'critical',
    category: 'Security',
    check: (workflow) => {
      if (!workflow.permissions) {
        const jobs = workflow.jobs || {};
        const anyJobHasPerms = Object.values(jobs).some((j) => j.permissions);
        if (!anyJobHasPerms) {
          return {
            message: 'No permissions block defined — workflow runs with default (broad) permissions.',
            suggestion: 'Add a top-level `permissions` block with least-privilege settings (e.g., `contents: read`) to limit token scope.',
          };
        }
      }
      return null;
    },
  },
  {
    id: 'no-env-protection',
    severity: 'warning',
    category: 'Security',
    check: (workflow) => {
      const workflowStr = JSON.stringify(workflow);
      if (workflowStr.includes('${{') && workflowStr.includes('secrets.')) {
        const jobs = workflow.jobs || {};
        const deployJobs = Object.entries(jobs).filter(
          ([name]) => name.toLowerCase().includes('deploy') || name.toLowerCase().includes('release')
        );
        for (const [name, job] of deployJobs) {
          if (!job.environment) {
            return {
              message: `Deploy/release job "${name}" uses secrets but has no environment protection.`,
              suggestion: 'Add `environment` with required reviewers for deployment jobs to enforce approval gates.',
            };
          }
        }
      }
      return null;
    },
  },
  {
    id: 'inline-scripts',
    severity: 'info',
    category: 'Maintainability',
    check: (workflow) => {
      const jobs = workflow.jobs || {};
      let longScriptCount = 0;
      for (const job of Object.values(jobs)) {
        for (const step of job.steps || []) {
          if (step.run && step.run.split('\n').length > 15) {
            longScriptCount++;
          }
        }
      }
      if (longScriptCount > 0) {
        return {
          message: `${longScriptCount} step(s) contain long inline scripts (>15 lines).`,
          suggestion: 'Move complex logic to shell scripts or composite actions for better testability and reuse.',
        };
      }
      return null;
    },
  },
  {
    id: 'no-artifact-upload',
    severity: 'info',
    category: 'Observability',
    check: (workflow) => {
      const workflowStr = JSON.stringify(workflow);
      const hasTests = workflowStr.includes('test') || workflowStr.includes('jest') || workflowStr.includes('pytest');
      const hasBuild = workflowStr.includes('build');
      if ((hasTests || hasBuild) && !workflowStr.includes('actions/upload-artifact')) {
        return {
          message: 'No artifact upload found despite test/build steps.',
          suggestion: 'Upload test reports, coverage data, or build artifacts using `actions/upload-artifact` for better debugging.',
        };
      }
      return null;
    },
  },
  {
    id: 'no-retry',
    severity: 'info',
    category: 'Reliability',
    check: (workflow) => {
      const workflowStr = JSON.stringify(workflow);
      const hasNetworkOps =
        workflowStr.includes('npm install') ||
        workflowStr.includes('pip install') ||
        workflowStr.includes('docker pull') ||
        workflowStr.includes('curl') ||
        workflowStr.includes('wget');
      if (hasNetworkOps && !workflowStr.includes('retry') && !workflowStr.includes('attempts')) {
        return {
          message: 'Network-dependent steps detected without retry mechanisms.',
          suggestion: 'Add retry logic (e.g., `nick-fields/retry` action) for network operations to handle transient failures.',
        };
      }
      return null;
    },
  },
  {
    id: 'no-path-filter',
    severity: 'info',
    category: 'Efficiency',
    check: (workflow) => {
      const triggers = workflow.on || workflow.true || {};
      if (triggers.push && !triggers.push.paths && !triggers.push['paths-ignore']) {
        if (triggers.pull_request && !triggers.pull_request.paths && !triggers.pull_request['paths-ignore']) {
          return {
            message: 'Workflow triggers on all file changes without path filters.',
            suggestion: 'Add `paths` or `paths-ignore` filters to avoid running CI on irrelevant changes (docs, README, etc.).',
          };
        }
      }
      return null;
    },
  },
];

/**
 * Analyze a workflow YAML string against all rules.
 * @param {string} yamlContent - Raw YAML content of the workflow file
 * @param {string} workflowName - Name of the workflow
 * @returns {object} Analysis result with issues and score
 */
function analyzeWorkflow(yamlContent, workflowName = 'unknown') {
  let workflow;
  try {
    workflow = yaml.parse(yamlContent);
  } catch (err) {
    return {
      workflowName,
      parseError: true,
      error: `Failed to parse YAML: ${err.message}`,
      issues: [],
      score: 0,
    };
  }

  if (!workflow || !workflow.jobs) {
    return {
      workflowName,
      parseError: true,
      error: 'Invalid workflow: no jobs found',
      issues: [],
      score: 0,
    };
  }

  const issues = [];
  for (const rule of RULES) {
    try {
      const result = rule.check(workflow);
      if (result) {
        issues.push({
          id: rule.id,
          severity: rule.severity,
          category: rule.category,
          ...result,
        });
      }
    } catch (e) {
      // Skip failed rules silently
    }
  }

  // Calculate robustness score (0-100)
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  let score = 100;
  score -= criticalCount * 20;
  score -= warningCount * 10;
  score -= infoCount * 3;
  score = Math.max(0, Math.min(100, score));

  // Extract workflow metadata
  const jobNames = Object.keys(workflow.jobs);
  const triggers = workflow.on
    ? typeof workflow.on === 'string'
      ? [workflow.on]
      : Array.isArray(workflow.on)
      ? workflow.on
      : Object.keys(workflow.on)
    : [];

  return {
    workflowName,
    score,
    grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F',
    issues,
    metadata: {
      jobCount: jobNames.length,
      jobNames,
      triggers,
      totalSteps: Object.values(workflow.jobs).reduce(
        (acc, j) => acc + (j.steps?.length || 0),
        0
      ),
    },
  };
}

module.exports = { analyzeWorkflow };
