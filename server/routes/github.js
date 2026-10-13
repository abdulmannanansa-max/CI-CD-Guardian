const express = require('express');
const router = express.Router();
const github = require('../services/githubService');

// Parse owner/repo from input (handles full URLs and owner/repo format)
function parseRepoInput(input) {
  // Handle full GitHub URLs
  const urlMatch = input.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  }
  // Handle owner/repo format
  const parts = input.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

// GET /api/github/repo?url=owner/repo
router.get('/repo', async (req, res) => {
  try {
    const parsed = parseRepoInput(req.query.url || '');
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid repository format. Use owner/repo or full GitHub URL.' });
    }
    const info = await github.getRepoInfo(parsed.owner, parsed.repo);
    res.json(info);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = status === 404 ? 'Repository not found' : err.message;
    res.status(status).json({ error: message });
  }
});

// GET /api/github/commits?owner=...&repo=...
router.get('/commits', async (req, res) => {
  try {
    const { owner, repo } = req.query;
    const commits = await github.getCommits(owner, repo, 30);
    res.json(commits);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /api/github/commit/:owner/:repo/:sha
router.get('/commit/:owner/:repo/:sha', async (req, res) => {
  try {
    const { owner, repo, sha } = req.params;
    const details = await github.getCommitDetails(owner, repo, sha);
    res.json(details);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /api/github/workflows?owner=...&repo=...
router.get('/workflows', async (req, res) => {
  try {
    const { owner, repo } = req.query;
    const workflows = await github.getWorkflows(owner, repo);
    res.json(workflows);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /api/github/workflow-runs?owner=...&repo=...&workflowId=...
router.get('/workflow-runs', async (req, res) => {
  try {
    const { owner, repo, workflowId } = req.query;
    const runs = await github.getWorkflowRuns(owner, repo, workflowId || null, 30);
    res.json(runs);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /api/github/run-jobs/:owner/:repo/:runId
router.get('/run-jobs/:owner/:repo/:runId', async (req, res) => {
  try {
    const { owner, repo, runId } = req.params;
    const jobs = await github.getWorkflowRunJobs(owner, repo, runId);
    res.json(jobs);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// GET /api/github/workflow-file?owner=...&repo=...&path=...
router.get('/workflow-file', async (req, res) => {
  try {
    const { owner, repo, path } = req.query;
    const content = await github.getWorkflowFile(owner, repo, path);
    if (!content) {
      return res.status(404).json({ error: 'Workflow file not found' });
    }
    res.json({ content });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

module.exports = router;
