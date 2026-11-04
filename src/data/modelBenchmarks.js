export const MODEL_METRICS = {
  transformer: {
    id: 'transformer',
    name: 'Multimodal Cross-Attention Transformer',
    badge: 'Recommended Architecture',
    isWinner: true,
    version: 'v2.4-Hybrid',
    description: 'Vision Transformer (ViT) patch encoder for Sentinel-2 MSI tiles coupled with Multi-Head Cross-Attention over IoT temporal tokens.',
    accuracy: 96.8,
    precision: 96.4,
    recall: 97.2,
    f1: 96.8,
    rmse: 0.142,
    mae: 0.098,
    r2Score: 0.948,
    inferenceLatencyMs: 18,
    trainingTimeHours: 4.8,
    parametersM: 14.6,
    weights: {
      compositeScore: 95.8,
      explanation: 'Highest generalizability across diverse optical water types, superior handling of missing satellite cloud gaps via cross-modal self-attention weighting (0.30 Acc + 0.25 F1 + 0.20 RMSE + 0.15 MAE + 0.10 Latency).'
    },
    pros: [
      'Dynamic cross-attention handles cloud-masked satellite tiles with graceful degradation',
      'Captures long-range temporal lag between agricultural rainfall runoff and lake eutrophication',
      'Highest R² score (0.948) on multi-parameter regression'
    ],
    cons: [
      'Slightly higher compute requirement during pre-training on multi-year Landsat archives'
    ]
  },
  cnnLstm: {
    id: 'cnn-lstm',
    name: 'Spatial CNN + Bidirectional LSTM',
    badge: 'Edge-Optimized Baseline',
    isWinner: false,
    version: 'v1.8-ResNetBiLSTM',
    description: 'Lightweight MobileNetV3 convolutional backbone for spatial feature extraction combined with BiLSTM for sequential sensor readings.',
    accuracy: 93.4,
    precision: 92.8,
    recall: 93.6,
    f1: 93.2,
    rmse: 0.218,
    mae: 0.165,
    r2Score: 0.902,
    inferenceLatencyMs: 11,
    trainingTimeHours: 2.3,
    parametersM: 6.2,
    weights: {
      compositeScore: 91.2,
      explanation: 'Extremely fast inference suitable for ultra-low-power microcontrollers (ESP32 / Edge TPU), though slightly less sensitive to sudden localized turbidity plumes.'
    },
    pros: [
      'Low memory footprint, deployable on Raspberry Pi / Jetson Nano edge gateways',
      'Faster convergence time during initial transfer learning'
    ],
    cons: [
      'Vulnerable to spatial misalignment when satellite revisit is delayed by cloud cover',
      'Lower precision on extreme anomalous outlier events'
    ]
  }
};

export const BASELINE_COMPARISONS = [
  { model: 'Multimodal Transformer', type: 'Deep Learning (Proposed)', accuracy: 96.8, f1: 96.8, rmse: 0.142, latency: '18 ms', rank: 1 },
  { model: 'CNN-BiLSTM Hybrid', type: 'Deep Learning', accuracy: 93.4, f1: 93.2, rmse: 0.218, latency: '11 ms', rank: 2 },
  { model: 'XGBoost Regressor', type: 'Tree Ensemble (Baseline)', accuracy: 88.5, f1: 88.1, rmse: 0.345, latency: '6 ms', rank: 3 },
  { model: 'Random Forest', type: 'Ensemble (Baseline)', accuracy: 86.2, f1: 85.9, rmse: 0.389, latency: '8 ms', rank: 4 },
  { model: 'Support Vector Regr (SVR)', type: 'Kernel Method (Baseline)', accuracy: 81.4, f1: 80.8, rmse: 0.490, latency: '24 ms', rank: 5 },
];

export const RADAR_DATA = [
  { metric: 'Accuracy', transformer: 96.8, cnnLstm: 93.4, baseline: 86.2 },
  { metric: 'Cloud-Gap Resilience', transformer: 95.0, cnnLstm: 82.0, baseline: 70.0 },
  { metric: 'Spatial Resolution', transformer: 94.5, cnnLstm: 90.2, baseline: 75.0 },
  { metric: 'Temporal Sensitivity', transformer: 97.2, cnnLstm: 92.5, baseline: 82.0 },
  { metric: 'Inference Speed', transformer: 88.0, cnnLstm: 96.0, baseline: 98.0 },
  { metric: 'Anomaly Detection', transformer: 96.0, cnnLstm: 89.4, baseline: 78.5 },
];

export const TRAINING_EPOCHS = [
  { epoch: 1, transformerLoss: 0.62, cnnLstmLoss: 0.68, transformerVal: 0.58, cnnLstmVal: 0.64 },
  { epoch: 5, transformerLoss: 0.44, cnnLstmLoss: 0.50, transformerVal: 0.41, cnnLstmVal: 0.47 },
  { epoch: 10, transformerLoss: 0.32, cnnLstmLoss: 0.39, transformerVal: 0.30, cnnLstmVal: 0.38 },
  { epoch: 15, transformerLoss: 0.23, cnnLstmLoss: 0.31, transformerVal: 0.22, cnnLstmVal: 0.32 },
  { epoch: 20, transformerLoss: 0.17, cnnLstmLoss: 0.25, transformerVal: 0.18, cnnLstmVal: 0.27 },
  { epoch: 25, transformerLoss: 0.13, cnnLstmLoss: 0.21, transformerVal: 0.15, cnnLstmVal: 0.24 },
  { epoch: 30, transformerLoss: 0.10, cnnLstmLoss: 0.18, transformerVal: 0.13, cnnLstmVal: 0.22 },
  { epoch: 35, transformerLoss: 0.08, cnnLstmLoss: 0.16, transformerVal: 0.11, cnnLstmVal: 0.20 },
  { epoch: 40, transformerLoss: 0.065, cnnLstmLoss: 0.145, transformerVal: 0.098, cnnLstmVal: 0.19 },
  { epoch: 45, transformerLoss: 0.054, cnnLstmLoss: 0.138, transformerVal: 0.092, cnnLstmVal: 0.18 },
  { epoch: 50, transformerLoss: 0.046, cnnLstmLoss: 0.130, transformerVal: 0.088, cnnLstmVal: 0.17 },
];
