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

app.listen(PORT, () => {
  console.log(`🚀 CI/CD Guardian API running on port ${PORT}`);
});
