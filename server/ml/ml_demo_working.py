#!/usr/bin/env python3
"""
ML Demo Working Script for HabitLoop
This script provides synthetic data generation and model training for the ML system.
"""

import sys
import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, mean_squared_error, silhouette_score
import joblib

# Add the ml directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'ml'))

try:
    from models.habitPredictor import HabitPredictorEnsemble
    print("SUCCESS: Imported HabitPredictorEnsemble successfully")
except ImportError as e:
    print(f"WARNING: Could not import HabitPredictorEnsemble: {e}")
    print("INFO: Using fallback ML implementation...")

def generate_synthetic_data(n_samples=1000):
    """Generate synthetic habit and questionnaire data for training"""
    np.random.seed(42)
    
    # Generate synthetic questionnaire data
    focus_areas = ['Health', 'Productivity', 'Learning', 'Relationships', 'Finance']
    motivation_times = ['Morning', 'Afternoon', 'Evening', 'Night']
    motivation_types = ['Intrinsic', 'Extrinsic', 'Social', 'Achievement']
    mood_descriptions = ['Energetic', 'Calm', 'Stressed', 'Motivated', 'Tired']
    
    data = []
    for i in range(n_samples):
        # Generate questionnaire responses
        questionnaire = {
            'focus_areas': np.random.choice(focus_areas, size=np.random.randint(1, 4), replace=False).tolist(),
            'motivation_time': np.random.choice(motivation_times),
            'current_habits': np.random.choice(['Exercise', 'Reading', 'Meditation', 'Journaling'], 
                                             size=np.random.randint(0, 3), replace=False).tolist(),
            'main_goals': np.random.choice(['Weight Loss', 'Career Growth', 'Learning', 'Relationships']),
            'mood_description': np.random.choice(mood_descriptions),
            'motivation_type': np.random.choice(motivation_types),
            'procrastination_time': np.random.choice(['Morning', 'Afternoon', 'Evening']),
            'best_habit_time': np.random.choice(motivation_times),
            'missed_habit_feeling': np.random.choice(['Guilty', 'Disappointed', 'Motivated to try again', 'Indifferent']),
            'biggest_distraction': np.random.choice(['Social Media', 'Work', 'Family', 'Entertainment'])
        }
        
        # Generate habit data
        habit = {
            'title': f'Habit_{i+1}',
            'category': np.random.choice(focus_areas),
            'targetValue': np.random.randint(1, 10),
            'unit': np.random.choice(['times', 'minutes', 'pages', 'exercises']),
            'frequency': np.random.choice(['daily', 'weekly', 'monthly']),
            'difficulty': np.random.choice(['easy', 'medium', 'hard'])
        }
        
        # Generate success probability based on questionnaire and habit data
        success_prob = calculate_success_probability(questionnaire, habit)
        
        data.append({
            'questionnaire': questionnaire,
            'habit': habit,
            'success_probability': success_prob,
            'success': np.random.binomial(1, success_prob)
        })
    
    return data

def calculate_success_probability(questionnaire, habit):
    """Calculate success probability based on questionnaire and habit data"""
    base_prob = 0.5
    
    # Factor 1: Motivation time alignment
    if questionnaire['motivation_time'] == questionnaire['best_habit_time']:
        base_prob += 0.2
    
    # Factor 2: Category alignment with focus areas
    if habit['category'] in questionnaire['focus_areas']:
        base_prob += 0.15
    
    # Factor 3: Motivation type
    if questionnaire['motivation_type'] in ['Intrinsic', 'Achievement']:
        base_prob += 0.1
    
    # Factor 4: Current habits (experience)
    if len(questionnaire['current_habits']) > 0:
        base_prob += 0.1
    
    # Factor 5: Difficulty adjustment
    if habit['difficulty'] == 'easy':
        base_prob += 0.1
    elif habit['difficulty'] == 'hard':
        base_prob -= 0.1
    
    return min(max(base_prob, 0.1), 0.95)

def train_models(data):
    """Train ML models with synthetic data"""
    print("INFO: Training ML models with synthetic data...")
    
    # Prepare features
    features = []
    targets = []
    
    for item in data:
        # Extract features from questionnaire and habit
        feature_vector = extract_features(item['questionnaire'], item['habit'])
        features.append(feature_vector)
        targets.append(item['success'])
    
    # Convert to numpy arrays
    X = np.array(features)
    y = np.array(targets)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest Classifier
    rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_classifier.fit(X_train, y_train)
    
    # Evaluate
    y_pred = rf_classifier.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    # Train Random Forest Regressor for probability prediction
    rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_regressor.fit(X_train, y_train)
    
    # Evaluate regressor
    y_pred_prob = rf_regressor.predict(X_test)
    mse = mean_squared_error(y_test, y_pred_prob)
    r2_score = rf_regressor.score(X_test, y_test)
    
    # Save models
    model_dir = 'ml/models/trained'
    os.makedirs(model_dir, exist_ok=True)
    
    joblib.dump(rf_classifier, os.path.join(model_dir, 'habit_classifier.joblib'))
    joblib.dump(rf_regressor, os.path.join(model_dir, 'habit_regressor.joblib'))
    
    # Save metadata
    metadata = {
        'version': '1.0.0',
        'created_at': datetime.now().isoformat(),
        'accuracy': accuracy,
        'r2_score': r2_score,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'features_trained': X.shape[1],
        'algorithm': 'RandomForest',
        'mse': mse
    }
    
    with open(os.path.join(model_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"SUCCESS: Models trained successfully!")
    print(f"INFO: Accuracy: {accuracy:.4f}")
    print(f"INFO: R² Score: {r2_score:.4f}")
    print(f"INFO: Training samples: {len(X_train)}")
    print(f"INFO: Test samples: {len(X_test)}")
    print(f"INFO: Features: {X.shape[1]}")
    
    return metadata

def extract_features(questionnaire, habit):
    """Extract numerical features from questionnaire and habit data"""
    features = []
    
    # Focus areas (one-hot encoding)
    focus_areas = ['Health', 'Productivity', 'Learning', 'Relationships', 'Finance']
    for area in focus_areas:
        features.append(1 if area in questionnaire['focus_areas'] else 0)
    
    # Motivation time (one-hot encoding)
    motivation_times = ['Morning', 'Afternoon', 'Evening', 'Night']
    for time in motivation_times:
        features.append(1 if questionnaire['motivation_time'] == time else 0)
    
    # Current habits count
    features.append(len(questionnaire['current_habits']))
    
    # Motivation type (one-hot encoding)
    motivation_types = ['Intrinsic', 'Extrinsic', 'Social', 'Achievement']
    for mtype in motivation_types:
        features.append(1 if questionnaire['motivation_type'] == mtype else 0)
    
    # Habit category (one-hot encoding)
    categories = ['Health', 'Productivity', 'Learning', 'Relationships', 'Finance']
    for category in categories:
        features.append(1 if habit['category'] == category else 0)
    
    # Habit difficulty (one-hot encoding)
    difficulties = ['easy', 'medium', 'hard']
    for diff in difficulties:
        features.append(1 if habit['difficulty'] == diff else 0)
    
    # Target value (normalized)
    features.append(habit['targetValue'] / 10.0)
    
    # Frequency (one-hot encoding)
    frequencies = ['daily', 'weekly', 'monthly']
    for freq in frequencies:
        features.append(1 if habit['frequency'] == freq else 0)
    
    return features

def main():
    """Main function to run the ML demo"""
    print("STARTING: Starting ML Demo for HabitLoop...")
    
    try:
        # Generate synthetic data
        print("INFO: Generating synthetic data...")
        data = generate_synthetic_data(1000)
        print(f"SUCCESS: Generated {len(data)} synthetic samples")
        
        # Train models
        models = train_models(data)
        
        # Test predictions
        test_questionnaire = {
            'focus_areas': ['Health', 'Productivity'],
            'motivation_time': 'Morning',
            'current_habits': ['Exercise'],
            'main_goals': 'Build consistency',
            'mood_description': 'Energized',
            'motivation_type': 'Intrinsic rewards',
            'procrastination_time': 'Evening',
            'best_habit_time': 'Right after waking',
            'missed_habit_feeling': 'Determined to restart',
            'biggest_distraction': 'Phone/social media'
        }
        
        # Extract features for test
        features = extract_features(test_questionnaire, {
            'title': 'Test Habit',
            'category': 'Health',
            'targetValue': 5,
            'unit': 'minutes',
            'frequency': 'daily',
            'difficulty': 'medium'
        })
        
        print(f"SUCCESS: ML Demo completed successfully!")
        
    except Exception as e:
        print(f"ERROR: ML Demo failed: {e}")
        import traceback
        traceback.print_exc() 