const express = require('express');
const router = express.Router();
const github = require('../services/githubService');
const { analyzeWorkflow } = require('../services/workflowAnalyzer');
const { analyzeWorkflowWithAI, generateFixedWorkflow } = require('../services/aiService');
const { cached } = require('../services/responseCache');
const { createHash } = require('node:crypto');
const YAML = require('yaml');

// POST /api/analyze/workflow
// Body: { owner, repo, workflowPath, workflowName }
router.post('/workflow', async (req, res) => {
  try {
    const { owner, repo, workflowPath, workflowName } = req.body;

    // Fetch workflow YAML
    const yamlContent = await github.getWorkflowFile(owner, repo, workflowPath);
    if (!yamlContent) {
      return res.status(404).json({ error: 'Workflow file not found' });
    }

    // Rule-based analysis
    const ruleAnalysis = analyzeWorkflow(yamlContent, workflowName);

    // AI-powered analysis with automatic provider fallback.
    const cacheKey = createHash('sha256').update(`${workflowName}\0${yamlContent}\0${JSON.stringify(ruleAnalysis.issues)}`).digest('hex');
    const aiAnalysis = await cached(
      `ai-analysis:${cacheKey}`,
      15 * 60_000,
      () => analyzeWorkflowWithAI(yamlContent, workflowName, ruleAnalysis.issues),
      (result) => result.available && result.analysis
    );

    res.json({
      workflowName,
      workflowPath,
      yamlContent,
      ruleBasedAnalysis: ruleAnalysis,
      aiAnalysis,
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// POST /api/analyze/workflow/fix — generate a validated draft; never writes to GitHub.
router.post('/workflow/fix', async (req, res) => {
  try {
    const { owner, repo, workflowPath, workflowName } = req.body;
    if (![owner, repo, workflowPath, workflowName].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'owner, repo, workflowPath, and workflowName are required.' });
    }
    if (!workflowPath.startsWith('.github/workflows/') || workflowPath.includes('..')) {
      return res.status(400).json({ error: 'A GitHub Actions workflow path is required.' });
    }

    const yamlContent = await github.getWorkflowFile(owner, repo, workflowPath);
    if (!yamlContent) return res.status(404).json({ error: 'Workflow file not found' });
    const ruleAnalysis = analyzeWorkflow(yamlContent, workflowName);
    const cacheKey = createHash('sha256').update(`${workflowName}\0${yamlContent}\0${JSON.stringify(ruleAnalysis.issues)}`).digest('hex');
    const aiAnalysis = await cached(
      `ai-analysis:${cacheKey}`,
      15 * 60_000,
      () => analyzeWorkflowWithAI(yamlContent, workflowName, ruleAnalysis.issues),
      (result) => result.available && result.analysis
    );
    if (!aiAnalysis.available || !aiAnalysis.analysis) {
      return res.status(503).json({ error: aiAnalysis.message || 'AI analysis is unavailable; no workflow draft was generated.' });
    }

    const draft = await generateFixedWorkflow(yamlContent, workflowName, aiAnalysis.analysis);
    if (typeof draft.workflowYaml !== 'string' || !draft.workflowYaml.trim() || draft.workflowYaml.length > 100_000) {
      return res.status(502).json({ error: 'AI returned an empty or oversized workflow draft.' });
    }
    const document = YAML.parseDocument(draft.workflowYaml, { uniqueKeys: true });
    if (document.errors.length || !document.toJS() || typeof document.toJS() !== 'object' || !document.toJS().jobs) {
      return res.status(502).json({ error: 'AI returned invalid workflow YAML. The original workflow was not changed.' });
    }
    res.json({ workflowName, workflowPath, workflowYaml: draft.workflowYaml, appliedChanges: draft.appliedChanges, reviewNotes: draft.reviewNotes });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

// POST /api/analyze/all-workflows
// Body: { owner, repo }
router.post('/all-workflows', async (req, res) => {
  try {
    const { owner, repo } = req.body;

    // Fetch all workflows
    const workflows = await github.getWorkflows(owner, repo);
    if (workflows.length === 0) {
      return res.json({ workflows: [], message: 'No CI/CD workflows found in this repository.' });
    }

    // Analyze each workflow
    const results = (await Promise.all(workflows.map(async (wf) => {
      const yamlContent = await github.getWorkflowFile(owner, repo, wf.path);
      if (!yamlContent) return null;
      return {
        workflow: wf,
        yamlContent,
        ruleBasedAnalysis: analyzeWorkflow(yamlContent, wf.name),
      };
    }))).filter(Boolean);

    // Overall repo CI/CD score
    const avgScore = results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.ruleBasedAnalysis.score, 0) / results.length)
      : 0;

    res.json({
      workflows: results,
      overallScore: avgScore,
      overallGrade: avgScore >= 90 ? 'A' : avgScore >= 75 ? 'B' : avgScore >= 60 ? 'C' : avgScore >= 40 ? 'D' : 'F',
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

module.exports = router;
