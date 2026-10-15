const express = require('express');
const router = express.Router();
const github = require('../services/githubService');
const { analyzeWorkflow } = require('../services/workflowAnalyzer');
const { analyzeWorkflowWithAI } = require('../services/aiService');
const { cached } = require('../services/responseCache');
const { createHash } = require('node:crypto');

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
