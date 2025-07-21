import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export class MLModelService {
  private modelPath: string;
  private scriptPath: string;

  constructor() {
    this.modelPath = path.join(process.cwd(), 'habit_success_model.pkl');
    this.scriptPath = path.join(process.cwd(), 'ml_model.py');
  }

  async trainModel() {
    try {
      console.log('Training ML model...');
      const { stdout, stderr } = await execAsync(`python3 ${this.scriptPath}`);
      
      if (stderr) {
        console.error('ML training stderr:', stderr);
      }
      
      console.log('ML training output:', stdout);
      return { 
        success: true, 
        output: stdout,
        r2_score: this.extractR2Score(stdout),
        features_trained: this.extractFeatureCount(stdout)
      };
    } catch (error) {
      console.error('ML training error:', error);
      return { success: false, error: error.message };
    }
  }

  async predictHabitSuccess(userProfile: any) {
    try {
      // Validate model exists
      if (!fs.existsSync(this.modelPath)) {
        return { success: false, error: "Model not trained yet. Please train the model first." };
      }

      const predictionScript = `
import sys
import json
import os
sys.path.append('.')
from ml_model import HabitSuccessPredictor

try:
    predictor = HabitSuccessPredictor()
    if predictor.load_model('${this.modelPath}'):
        profile = ${JSON.stringify(userProfile)}
        prediction = predictor.predict_success_probability(profile)
        if prediction is not None:
            result = {
                "prediction": float(prediction),
                "success": True,
                "confidence": "high" if prediction > 0.7 else "medium" if prediction > 0.4 else "low"
            }
        else:
            result = {"success": False, "error": "Invalid profile data"}
        print(json.dumps(result))
    else:
        print(json.dumps({"success": False, "error": "Model not found"}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;
      
      const { stdout, stderr } = await execAsync(`python3 -c "${predictionScript}"`);
      
      if (stderr) {
        console.error('ML prediction stderr:', stderr);
      }
      
      const result = JSON.parse(stdout.trim());
      return result;
    } catch (error) {
      console.error('ML prediction error:', error);
      return { success: false, error: error.message };
    }
  }

  async getModelStatus() {
    const modelExists = fs.existsSync(this.modelPath);
    const modelStats = modelExists ? fs.statSync(this.modelPath) : null;
    
    return {
      trained: modelExists,
      model_path: this.modelPath,
      last_trained: modelStats ? modelStats.mtime.toISOString() : null,
      file_size: modelStats ? modelStats.size : 0
    };
  }

  private extractR2Score(output: string): number | null {
    const match = output.match(/R² Score: ([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  }

  private extractFeatureCount(output: string): number | null {
    const match = output.match(/Loaded (\d+) training samples/);
    return match ? parseInt(match[1]) : null;
  }
}

export const mlService = new MLModelService();