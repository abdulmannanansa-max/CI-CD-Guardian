const express = require('express');
const router = express.Router();
const github = require('../services/githubService');
const { predictFailure } = require('../services/predictionEngine');
const { predictFailureWithAI } = require('../services/geminiService');

// POST /api/predict/failure
// Body: { owner, repo, commitMessage, files: [{ filename, changeType, additions, deletions }] }
router.post('/failure', async (req, res) => {
  try {
    const { owner, repo, commitMessage, files } = req.body;

    // Fetch historical workflow runs
    let runs = [];
    try {
      runs = await github.getWorkflowRuns(owner, repo, null, 30);
    } catch (e) {
      // If we can't get runs, proceed with empty history
    }

    const totalRuns = runs.length;
    const failures = runs.filter((r) => r.conclusion === 'failure').length;
    const successRate = totalRuns > 0 ? Math.round(((totalRuns - failures) / totalRuns) * 100) : 50;

    // Detect recent failure patterns
    const recentFailures = runs.filter((r) => r.conclusion === 'failure').slice(0, 5);
    const recentFailurePatterns = recentFailures.length > 0
      ? recentFailures.map((f) => f.headCommitMessage?.substring(0, 60)).join('; ')
      : 'None detected';

    const historicalData = {
      totalRuns,
      failures,
      successRate,
      recentRuns: runs,
      recentFailurePatterns,
    };

    const commitData = {
      message: commitMessage || 'No message provided',
      files: files || [],
    };

    // Heuristic prediction
    const heuristicPrediction = predictFailure(commitData, historicalData);

    // Get workflow YAML for AI context
    let workflowYaml = null;
    try {
      const workflows = await github.getWorkflows(owner, repo);
      if (workflows.length > 0) {
        workflowYaml = await github.getWorkflowFile(owner, repo, workflows[0].path);
      }
    } catch (e) {
      // Proceed without workflow YAML
    }

    // AI prediction
    const aiPrediction = await predictFailureWithAI(commitData, workflowYaml, historicalData);

    // Combine predictions
    let combinedProbability = heuristicPrediction.failureProbability;
    if (aiPrediction.available && aiPrediction.prediction && Number.isFinite(Number(aiPrediction.prediction.failureProbability))) {
      // Weighted average: 40% heuristic, 60% AI
      const aiProbability = Math.max(0, Math.min(1, Number(aiPrediction.prediction.failureProbability)));
      combinedProbability = Math.round(
        (heuristicPrediction.failureProbability * 0.4 +
          aiProbability * 0.6) *
          100
      ) / 100;
    }

    let combinedRiskLevel;
    if (combinedProbability >= 0.7) combinedRiskLevel = 'critical';
    else if (combinedProbability >= 0.45) combinedRiskLevel = 'high';
    else if (combinedProbability >= 0.25) combinedRiskLevel = 'medium';
    else combinedRiskLevel = 'low';

    res.json({
      combinedPrediction: {
        failureProbability: combinedProbability,
        riskLevel: combinedRiskLevel,
      },
      heuristicPrediction,
      aiPrediction,
      historicalData: {
        totalRuns,
        failures,
        successRate,
      },
    });
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: err.message });
  }
});

module.exports = router;
