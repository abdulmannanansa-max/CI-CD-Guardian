const express = require('express');
const router = express.Router();
const github = require('../services/githubService');
const { analyzeWorkflow } = require('../services/workflowAnalyzer');
const { analyzeWorkflowWithAI } = require('../services/geminiService');

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

    // AI-powered analysis (Gemini)
    const aiAnalysis = await analyzeWorkflowWithAI(yamlContent, workflowName, ruleAnalysis.issues);

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
    const results = [];
    for (const wf of workflows) {
      const yamlContent = await github.getWorkflowFile(owner, repo, wf.path);
      if (yamlContent) {
        const ruleAnalysis = analyzeWorkflow(yamlContent, wf.name);
        results.push({
          workflow: wf,
          yamlContent,
          ruleBasedAnalysis: ruleAnalysis,
        });
      }
    }

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
