const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

function initGemini() {
  if (!genAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
}

/**
 * Get detailed AI analysis of a CI/CD workflow
 */
async function analyzeWorkflowWithAI(yamlContent, workflowName, ruleBasedIssues) {
  const m = initGemini();
  if (!m) {
    return {
      available: false,
      message: 'Gemini API key not configured. Add GEMINI_API_KEY to .env file.',
    };
  }

  const prompt = `You are an expert DevOps/CI-CD engineer. Analyze this GitHub Actions workflow YAML file and provide detailed, actionable insights.

**Workflow Name:** ${workflowName}

**Workflow YAML:**
\`\`\`yaml
${yamlContent}
\`\`\`

**Already-detected rule-based issues:**
${ruleBasedIssues.map((i) => `- [${i.severity}] ${i.message}`).join('\n')}

Please provide your analysis in the following JSON format (return ONLY valid JSON, no markdown):
{
  "summary": "Brief 2-3 sentence summary of the workflow's purpose and overall quality",
  "securityIssues": [
    {"issue": "description", "fix": "how to fix", "severity": "critical|warning|info"}
  ],
  "performanceOptimizations": [
    {"issue": "description", "fix": "how to optimize", "impactEstimate": "e.g. ~30% faster"}
  ],
  "reliabilityImprovements": [
    {"issue": "description", "fix": "how to improve"}
  ],
  "bestPractices": [
    {"practice": "description", "status": "implemented|missing", "recommendation": "what to do"}
  ],
  "overallScore": 75,
  "criticalFindings": ["list of most important things to fix first"]
}`;

  try {
    const result = await m.generateContent(prompt);
    const text = result.response.text();
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return {
        available: true,
        analysis: JSON.parse(jsonMatch[0]),
      };
    }
    return { available: true, analysis: null, rawResponse: text };
  } catch (err) {
    return {
      available: false,
      message: `Gemini API error: ${err.message}`,
    };
  }
}

/**
 * Predict failure likelihood for a hypothetical commit
 */
async function predictFailureWithAI(commitData, workflowYaml, historicalData) {
  const m = initGemini();
  if (!m) {
    return {
      available: false,
      message: 'Gemini API key not configured.',
    };
  }

  const prompt = `You are an expert CI/CD failure prediction system. Given a hypothetical commit and the CI/CD workflow it will run through, predict how likely it is to cause a CI/CD failure.

**Proposed Commit:**
- Message: ${commitData.message}
- Files changed: ${commitData.files.map((f) => `${f.filename} (${f.changeType}: +${f.additions || 0}/-${f.deletions || 0})`).join(', ')}

**CI/CD Workflow YAML:**
\`\`\`yaml
${workflowYaml?.substring(0, 3000) || 'No workflow available'}
\`\`\`

**Historical CI/CD Data:**
- Total runs: ${historicalData.totalRuns}
- Failures: ${historicalData.failures}
- Success rate: ${historicalData.successRate}%
- Recent failure patterns: ${historicalData.recentFailurePatterns || 'None detected'}

Analyze and provide your prediction in JSON format ONLY (no markdown):
{
  "failureProbability": 0.35,
  "riskLevel": "low|medium|high|critical",
  "reasoning": "Detailed explanation of why this commit might or might not fail",
  "riskFactors": [
    {"factor": "description", "risk": "high|medium|low", "explanation": "why"}
  ],
  "likelyFailurePoints": [
    {"step": "which CI step might fail", "reason": "why", "probability": 0.2}
  ],
  "recommendations": ["list of suggestions to reduce failure risk"],
  "confidenceLevel": "high|medium|low"
}`;

  try {
    const result = await m.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return {
        available: true,
        prediction: JSON.parse(jsonMatch[0]),
      };
    }
    return { available: true, prediction: null, rawResponse: text };
  } catch (err) {
    return {
      available: false,
      message: `Gemini API error: ${err.message}`,
    };
  }
}

module.exports = { analyzeWorkflowWithAI, predictFailureWithAI };
