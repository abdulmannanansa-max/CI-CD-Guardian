require('dotenv').config();
const express = require('express');
const cors = require('cors');
const githubRoutes = require('./routes/github');
const analyzeRoutes = require('./routes/analyze');
const predictRoutes = require('./routes/predict');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/github', githubRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/predict', predictRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Keep unknown API requests machine-readable instead of returning an HTML 404 page.
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`🚀 CI/CD Guardian API running on port ${PORT}`);
});
