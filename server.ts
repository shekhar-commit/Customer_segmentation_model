import express from 'express';
import {
  generateDemoRestaurantTransactions,
  executeSegmentationPipeline,
  PipelineConfig
} from './src/ml';
import { Transaction } from './src/types';

export const app = express();
app.use(express.json());

// In-memory backend storage for ML state and metrics
let currentTransactions: Transaction[] = generateDemoRestaurantTransactions(520);
let currentPipelineResult = executeSegmentationPipeline(currentTransactions);

// ================================================================
// 1. Model Performance & Metrics Endpoints
// ================================================================
app.get('/api/segmentation/metrics', (_req, res) => {
  res.json(currentPipelineResult.metrics);
});

app.get('/api/model/current', (_req, res) => {
  res.json(currentPipelineResult.modelMetadata);
});

app.get('/api/model/performance', (_req, res) => {
  res.json({
    metrics: currentPipelineResult.metrics,
    k_evaluations: currentPipelineResult.kEvaluations,
    recommended_k: currentPipelineResult.recommendedK,
    pca_variance: currentPipelineResult.pcaVariance
  });
});

// ================================================================
// 2. Data Quality & Validation Endpoints
// ================================================================
app.get('/api/data-quality', (_req, res) => {
  res.json(currentPipelineResult.dataQualityReport);
});

// ================================================================
// 3. Model Drift Endpoints
// ================================================================
app.get('/api/model/drift', (_req, res) => {
  if (currentPipelineResult.driftComparison) {
    res.json(currentPipelineResult.driftComparison);
  } else {
    res.json({
      status: 'baseline',
      message: 'Initial baseline model active. No prior run for drift comparison yet.'
    });
  }
});

// ================================================================
// 4. Segmentation & Customer Endpoints
// ================================================================
app.get('/api/segments', (_req, res) => {
  res.json(currentPipelineResult.profiles);
});

app.get('/api/customers', (_req, res) => {
  res.json(currentPipelineResult.customers);
});

app.post('/api/model/retrain', (req, res) => {
  const config: PipelineConfig = req.body?.config || { algorithm: 'K-Means' };
  currentPipelineResult = executeSegmentationPipeline(currentTransactions, config);
  res.json({
    success: true,
    modelMetadata: currentPipelineResult.modelMetadata,
    metrics: currentPipelineResult.metrics,
    driftComparison: currentPipelineResult.driftComparison
  });
});

export default app;
