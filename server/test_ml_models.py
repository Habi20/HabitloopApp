#!/usr/bin/env python3
"""
Test script to verify trained ML models and their performance
"""

import os
import json
import joblib
import pickle
import numpy as np
from pathlib import Path

def test_model_files():
    """Test if all model files exist and can be loaded"""
    print("=== ML MODEL STATUS CHECK ===")
    
    model_dir = Path("ml/models/trained")
    models = {
        'habit_classifier.joblib': 'joblib',
        'timing_regressor.pkl': 'pickle', 
        'motivation_clusterer.pkl': 'pickle',
        'scaler.pkl': 'pickle'
    }
    
    for model_name, load_type in models.items():
        model_path = model_dir / model_name
        exists = model_path.exists()
        size = model_path.stat().st_size if exists else 0
        
        print(f"{model_name}:")
        print(f"  Exists: {exists}")
        print(f"  Size: {size:,} bytes")
        
        if exists:
            try:
                if load_type == 'joblib':
                    model = joblib.load(model_path)
                else:
                    with open(model_path, 'rb') as f:
                        model = pickle.load(f)
                
                print(f"  Type: {type(model).__name__}")
                print(f"  Loaded successfully: ✅")
                
                # Check if it's a trained model
                if hasattr(model, 'n_estimators'):
                    print(f"  Estimators: {model.n_estimators}")
                if hasattr(model, 'n_clusters'):
                    print(f"  Clusters: {model.n_clusters}")
                    
            except Exception as e:
                print(f"  Load failed: ❌ {e}")
        print()

def test_metadata():
    """Test metadata file"""
    print("=== METADATA CHECK ===")
    metadata_path = Path("ml/models/trained/metadata.json")
    
    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        print("Training Information:")
        print(f"  Version: {metadata.get('version', 'N/A')}")
        print(f"  Created: {metadata.get('created_at', 'N/A')}")
        print(f"  Accuracy: {metadata.get('accuracy', 'N/A')}")
        print(f"  R² Score: {metadata.get('r2_score', 'N/A')}")
        print(f"  Training Samples: {metadata.get('training_samples', 'N/A')}")
        print(f"  Test Samples: {metadata.get('test_samples', 'N/A')}")
        print(f"  Features: {metadata.get('features_trained', 'N/A')}")
        print(f"  Algorithm: {metadata.get('algorithm', 'N/A')}")
        print(f"  MSE: {metadata.get('mse', 'N/A')}")
    else:
        print("❌ Metadata file not found")

def test_prediction():
    """Test actual prediction with sample data"""
    print("\n=== PREDICTION TEST ===")
    
    try:
        # Load models
        model_dir = Path("ml/models/trained")
        
        # Load classifier
        classifier = joblib.load(model_dir / "habit_classifier.joblib")
        scaler = pickle.load(open(model_dir / "scaler.pkl", 'rb'))
        
        # Create sample feature vector (26 features as per metadata)
        sample_features = np.random.rand(1, 26)  # Random features for testing
        scaled_features = scaler.transform(sample_features)
        
        # Make prediction
        prediction = classifier.predict_proba(scaled_features)[0]
        success_prob = prediction[1] if len(prediction) > 1 else prediction[0]
        
        print(f"Sample prediction result:")
        print(f"  Success probability: {success_prob:.3f}")
        print(f"  Confidence: {'High' if success_prob > 0.7 else 'Medium' if success_prob > 0.4 else 'Low'}")
        print("✅ Prediction test successful")
        
    except Exception as e:
        print(f"❌ Prediction test failed: {e}")

def test_real_questionnaire():
    """Test with realistic questionnaire data"""
    print("\n=== REALISTIC QUESTIONNAIRE TEST ===")
    
    try:
        # Import the predictor
        import sys
        sys.path.append('ml')
        from models.habitPredictor import predictor
        
        # Load models
        success = predictor.load_models()
        if not success:
            print("❌ Failed to load models")
            return
        
        # Realistic questionnaire data
        questionnaire = {
            'focus_areas': ['Health & Fitness', 'Productivity'],
            'motivation_time': 'Morning',
            'current_habits': ['Morning exercise', 'Reading'],
            'main_goals': 'Build consistent healthy habits',
            'mood_description': 'Energized',
            'motivation_type': 'Intrinsic rewards',
            'procrastination_time': 'Evening',
            'best_habit_time': 'Right after waking',
            'missed_habit_feeling': 'Determined to restart',
            'biggest_distraction': 'Work stress'
        }
        
        # Make prediction
        result = predictor.predict_habit_success(questionnaire)
        
        print("Realistic questionnaire prediction:")
        print(f"  Success probability: {result['success_probability']:.3f}")
        print(f"  Success score: {result['success_score']:.3f}")
        print(f"  Motivation cluster: {result['motivation_cluster']}")
        print(f"  Confidence level: {result['confidence_level']}")
        print("  Recommendations:")
        for rec in result['recommendations']:
            print(f"    - {rec}")
        
        print("✅ Realistic questionnaire test successful")
        
    except Exception as e:
        print(f"❌ Realistic questionnaire test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_model_files()
    test_metadata()
    test_prediction()
    test_real_questionnaire()
