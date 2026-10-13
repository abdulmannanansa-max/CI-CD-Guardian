const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

function getHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CICD-Guardian-App',
  };
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_token_here') {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Fetch repository info
 */
async function getRepoInfo(owner, repo) {
  const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: getHeaders(),
  });
  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    language: data.language,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    defaultBranch: data.default_branch,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    htmlUrl: data.html_url,
    topics: data.topics || [],
    size: data.size,
    hasActions: true, // We'll verify this via workflows endpoint
  };
}

/**
 * Fetch recent commits
 */
async function getCommits(owner, repo, perPage = 30) {
  const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/commits`, {
    headers: getHeaders(),
    params: { per_page: perPage },
  });
  return data.map((c) => ({
    sha: c.sha,
    shortSha: c.sha.substring(0, 7),
    message: c.commit.message,
    author: c.commit.author.name,
    authorEmail: c.commit.author.email,
    date: c.commit.author.date,
    avatarUrl: c.author?.avatar_url || null,
    htmlUrl: c.html_url,
  }));
}

/**
 * Fetch commit details (files changed)
 */
async function getCommitDetails(owner, repo, sha) {
  const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, {
    headers: getHeaders(),
  });
  return {
    sha: data.sha,
    message: data.commit.message,
    author: data.commit.author.name,
    date: data.commit.author.date,
    stats: data.stats,
    files: (data.files || []).map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch?.substring(0, 2000) || null, // Limit patch size
    })),
  };
}

/**
 * Fetch CI/CD workflows
 */
async function getWorkflows(owner, repo) {
  try {
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/actions/workflows`, {
      headers: getHeaders(),
    });
    return data.workflows.map((w) => ({
      id: w.id,
      name: w.name,
      path: w.path,
      state: w.state,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
      htmlUrl: w.html_url,
      badgeUrl: w.badge_url,
    }));
  } catch (err) {
    if (err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

/**
 * Fetch workflow runs (history)
 */
async function getWorkflowRuns(owner, repo, workflowId = null, perPage = 30) {
  const url = workflowId
    ? `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`
    : `${GITHUB_API}/repos/${owner}/${repo}/actions/runs`;

  const { data } = await axios.get(url, {
    headers: getHeaders(),
    params: { per_page: perPage },
  });

  return data.workflow_runs.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    conclusion: r.conclusion,
    workflowId: r.workflow_id,
    branch: r.head_branch,
    event: r.event,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    runNumber: r.run_number,
    htmlUrl: r.html_url,
    headSha: r.head_sha?.substring(0, 7),
    headCommitMessage: r.head_commit?.message || '',
  }));
}

/**
 * Fetch workflow run logs (job-level)
 */
async function getWorkflowRunJobs(owner, repo, runId) {
  const { data } = await axios.get(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/runs/${runId}/jobs`,
    { headers: getHeaders() }
  );

  return data.jobs.map((j) => ({
    id: j.id,
    name: j.name,
    status: j.status,
    conclusion: j.conclusion,
    startedAt: j.started_at,
    completedAt: j.completed_at,
    htmlUrl: j.html_url,
    steps: (j.steps || []).map((s) => ({
      name: s.name,
      status: s.status,
      conclusion: s.conclusion,
      number: s.number,
      startedAt: s.started_at,
      completedAt: s.completed_at,
    })),
  }));
}

/**
 * Fetch the raw workflow YAML file content
 */
async function getWorkflowFile(owner, repo, path) {
  try {
    const { data } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
      { headers: getHeaders() }
    );
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (err) {
    return null;
  }
}

module.exports = {
  getRepoInfo,
  getCommits,
  getCommitDetails,
  getWorkflows,
  getWorkflowRuns,
  getWorkflowRunJobs,
  getWorkflowFile,
};
