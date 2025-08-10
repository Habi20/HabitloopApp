// server/demo/ml-visualization.ts
export class MLVisualization {
    async createMLDemonstration() {
      return {
        // 1. Model Training Visualization
        trainingProgress: await this.simulateTrainingProgress(),
        
        // 2. Prediction Accuracy Metrics
        accuracyMetrics: await this.generateAccuracyMetrics(),
        
        // 3. Feature Importance Analysis
        featureImportance: await this.analyzeFeatureImportance(),
        
        // 4. Real-time Prediction Demo
        livePredictons: await this.generateLivePredictions()
      };
    }
  
    async simulateTrainingProgress() {
      return {
        epochs: Array.from({length: 50}, (_, i) => i + 1),
        accuracy: Array.from({length: 50}, (_, i) => Math.min(0.95, 0.3 + (i * 0.013))),
        loss: Array.from({length: 50}, (_, i) => Math.max(0.05, 2.1 - (i * 0.04))),
        algorithm: "Hybrid ML System (Random Forest + Neural Network)"
      };
    }
  
    async generateAccuracyMetrics() {
      return {
        overall: 87.5,
        precision: 89.2,
        recall: 85.1,
        f1Score: 87.1,
        confusionMatrix: [
          [150, 12],
          [18, 220]
        ]
      };
    }
  
    async analyzeFeatureImportance() {
      return {
        features: [
          { name: 'User Consistency Rating', importance: 0.34 },
          { name: 'Habit Category', importance: 0.28 },
          { name: 'Time of Day', importance: 0.22 },
          { name: 'Streak Length', importance: 0.18 },
          { name: 'User Level', importance: 0.15 },
          { name: 'Motivation Style', importance: 0.12 },
          { name: 'Previous Success Rate', importance: 0.11 },
          { name: 'Difficulty Setting', importance: 0.08 }
        ],
        totalFeatures: 8,
        topFeatures: 4,
        analysisMethod: 'Random Forest Feature Importance'
      };
    }
  
    async generateLivePredictions() {
      const predictions = [];
      
      for (let i = 0; i < 10; i++) {
        predictions.push({
          userId: `user-${i + 1}`,
          habitTitle: `Habit ${i + 1}`,
          successProbability: Math.random() * 0.4 + 0.6, // 60-100%
          confidence: Math.random() * 0.3 + 0.7, // 70-100%
          recommendedTime: ['08:00', '12:00', '18:00', '20:00'][Math.floor(Math.random() * 4)],
          riskFactors: ['low_streak', 'time_conflict', 'category_difficulty'][Math.floor(Math.random() * 3)],
          timestamp: new Date().toISOString()
        });
      }
  
      return {
        predictions,
        modelVersion: '2.1.0',
        totalPredictions: predictions.length,
        avgConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
      };
    }
  }
  