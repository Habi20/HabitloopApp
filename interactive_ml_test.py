#!/usr/bin/env python3
"""
Interactive ML Model Test Script for HabitLoop
This script allows you to test the ML model with your own questionnaire data.
"""

import sys
import os
import json
from datetime import datetime

# Add the server directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

try:
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    from sklearn.cluster import KMeans
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.metrics import accuracy_score, mean_squared_error, silhouette_score
    import joblib
    
    print("✅ All ML packages imported successfully")
except ImportError as e:
    print(f"❌ Missing package: {e}")
    print("Please run: pip install -r requirements.txt")
    sys.exit(1)

# Import the core model (same as in test_ml_model.py)
class HabitPredictorEnsemble:
    def __init__(self):
        self.habit_success_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.optimal_timing_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.motivation_clusterer = KMeans(n_clusters=5, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False

    def prepare_features(self, questionnaire_data: dict) -> np.ndarray:
        """Convert questionnaire responses to numerical features"""
        feature_mapping = {
            'focus_areas': {
                'Health & Fitness': 1, 'Learning': 2, 'Productivity': 3,
                'Mindfulness': 4, 'Social': 5, 'Creative': 6
            },
            'motivation_time': {
                'Morning': 1, 'Afternoon': 2, 'Evening': 3, 
                'Late night': 4, 'Varies': 0
            },
            'current_habits': {
                'Exercise': 1, 'Meditation': 2, 'Reading': 3,
                'Journaling': 4, 'Healthy eating': 5, 'Other': 0
            },
            'main_goals': {
                'Build consistency': 1, 'Break bad habits': 2,
                'Improve productivity': 3, 'Better work-life balance': 4,
                'Health improvement': 5
            },
            'mood_description': {
                'Energized': 5, 'Balanced': 4, 'Stressed': 2,
                'Unmotivated': 1, 'Excited': 5
            },
            'motivation_type': {
                'Intrinsic rewards': 4, 'External accountability': 3,
                'Visual progress': 3, 'Social support': 2, 'Gamification': 1
            },
            'procrastination_time': {
                'Morning': 1, 'After lunch': 2, 'Evening': 3,
                'Before bed': 4, 'Weekends': 5
            },
            'best_habit_time': {
                'Right after waking': 1, 'During lunch break': 2,
                'After work': 3, 'Before bed': 4, 'Weekends only': 5
            },
            'missed_habit_feeling': {
                'Guilty': 2, 'Determined to restart': 5, 'Indifferent': 1,
                'Frustrated': 3, 'Like giving up': 1
            },
            'biggest_distraction': {
                'Phone/social media': 1, 'Work demands': 2,
                'Family obligations': 3, 'TV/streaming': 4, 'Other habits': 5
            }
        }

        features = []
        for key, value in questionnaire_data.items():
            if key in feature_mapping:
                if isinstance(value, list):
                    feature_sum = sum(feature_mapping[key].get(item, 0) for item in value)
                    features.append(feature_sum / len(value) if value else 0)
                else:
                    features.append(feature_mapping[key].get(value, 0))

        features.extend(self._calculate_derived_features(questionnaire_data))
        return np.array(features).reshape(1, -1)

    def _calculate_derived_features(self, data: dict) -> list:
        derived = []
        motivation_time = data.get('motivation_time', 'Varies')
        best_habit_time = data.get('best_habit_time', 'Right after waking')
        alignment_score = 1.0 if motivation_time == best_habit_time else 0.5
        derived.append(alignment_score)

        mood = data.get('mood_description', 'Balanced')
        missed_feeling = data.get('missed_habit_feeling', 'Determined to restart')
        stress_resilience = (5 if mood == 'Energized' else 3 if mood == 'Balanced' else 1) * \
                          (1.0 if missed_feeling == 'Determined to restart' else 0.5)
        derived.append(stress_resilience)

        current_habits = data.get('current_habits', [])
        consistency = min(len(current_habits) * 0.2, 1.0)
        derived.append(consistency)

        return derived

    def generate_synthetic_data(self, n_samples: int = 1000) -> tuple:
        np.random.seed(42)
        features = []
        success_rates = []

        for _ in range(n_samples):
            focus_area = np.random.choice([1, 2, 3, 4, 5, 6])
            motivation_time = np.random.choice([0, 1, 2, 3, 4])
            current_habits_count = np.random.choice([0, 1, 2, 3, 4, 5])
            main_goal = np.random.choice([1, 2, 3, 4, 5])
            mood = np.random.choice([1, 2, 3, 4, 5])
            motivation_type = np.random.choice([1, 2, 3, 4])
            procrastination_time = np.random.choice([1, 2, 3, 4, 5])
            best_habit_time = np.random.choice([1, 2, 3, 4, 5])
            missed_feeling = np.random.choice([1, 2, 3, 4, 5])
            distraction = np.random.choice([1, 2, 3, 4, 5])

            alignment = 1.0 if motivation_time == best_habit_time else 0.5
            stress_resilience = mood * (1.0 if missed_feeling >= 4 else 0.5)
            consistency = min(current_habits_count * 0.2, 1.0)

            feature_vector = [
                focus_area, motivation_time, current_habits_count, main_goal,
                mood, motivation_type, procrastination_time, best_habit_time,
                missed_feeling, distraction, alignment, stress_resilience, consistency
            ]

            base_success = 0.3
            success_rate = base_success + \
                     (float(mood) - 1) * 0.1 + \
                     (float(missed_feeling) - 1) * 0.15 + \
                     float(alignment) * 0.2 + \
                     float(consistency) * 0.25

            success_rate += np.random.normal(0, 0.1)
            success_rate = max(0.1, min(0.95, success_rate))

            features.append(feature_vector)
            success_rates.append(success_rate)

        return np.array(features), np.array(success_rates)

    def train_models(self, features: np.ndarray, success_rates: np.ndarray):
        X_train, X_test, y_train, y_test = train_test_split(
            features, success_rates, test_size=0.2, random_state=42
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        y_binary = (y_train > 0.6).astype(int)
        self.habit_success_classifier.fit(X_train_scaled, y_binary)
        self.optimal_timing_regressor.fit(X_train_scaled, y_train)
        self.motivation_clusterer.fit(X_train_scaled)

        y_pred_binary = self.habit_success_classifier.predict(X_test_scaled)
        y_pred_regression = self.optimal_timing_regressor.predict(X_test_scaled)

        accuracy = accuracy_score((y_test > 0.6).astype(int), y_pred_binary)
        mse = mean_squared_error(y_test, y_pred_regression)

        self.is_trained = True

        return {
            'accuracy': accuracy,
            'mse': mse,
            'train_samples': len(X_train),
            'test_samples': len(X_test)
        }

    def predict_habit_success(self, questionnaire_data: dict) -> dict:
        if not self.is_trained:
            raise ValueError("Models must be trained before prediction")

        features = self.prepare_features(questionnaire_data)
        features_scaled = self.scaler.transform(features)

        success_probability = self.habit_success_classifier.predict_proba(features_scaled)[0][1]
        success_score = self.optimal_timing_regressor.predict(features_scaled)[0]
        motivation_cluster = self.motivation_clusterer.predict(features_scaled)[0]

        recommendations = self._generate_recommendations(
            questionnaire_data, success_probability, motivation_cluster
        )

        return {
            'success_probability': float(success_probability),
            'success_score': float(success_score),
            'motivation_cluster': int(motivation_cluster),
            'confidence_level': 'high' if float(success_probability) > 0.7 else 'medium' if success_probability > 0.4 else 'low',
            'recommendations': recommendations
        }

    def _generate_recommendations(self, data: dict, success_prob: float, cluster: int) -> list:
        recommendations = []

        if float(success_prob) < 0.4:
            recommendations.append("Start with very small, easy habits (2-5 minutes)")
            recommendations.append("Focus on consistency over intensity")
        elif float(success_prob) < 0.7:
            recommendations.append("Gradually increase habit difficulty")
            recommendations.append("Set up accountability systems")
        else:
            recommendations.append("You're ready for challenging habits")
            recommendations.append("Consider habit stacking for efficiency")

        cluster_advice = {
            0: ["Focus on intrinsic motivation", "Track personal progress"],
            1: ["Use external accountability", "Join habit communities"],
            2: ["Implement visual progress tracking", "Use habit apps"],
            3: ["Focus on social support systems", "Share goals with friends"],
            4: ["Gamify your habits", "Use reward systems"]
        }

        if cluster in cluster_advice:
            recommendations.extend(cluster_advice[cluster])

        best_time = data.get('best_habit_time', 'Right after waking')
        if best_time == 'Right after waking':
            recommendations.append("Morning habits have highest success rates")
        elif best_time == 'Before bed':
            recommendations.append("Evening habits good for reflection and relaxation")

        return recommendations

def get_user_input():
    """Get questionnaire data from user"""
    print("\n📝 Please answer the following questions:")
    print("=" * 50)
    
    questionnaire = {}
    
    # Focus areas
    print("\n1. What are your main focus areas? (comma-separated)")
    print("   Options: Health & Fitness, Learning, Productivity, Mindfulness, Social, Creative")
    focus_input = input("   Your focus areas: ").strip()
    questionnaire['focus_areas'] = [area.strip() for area in focus_input.split(',') if area.strip()]
    
    # Motivation time
    print("\n2. When do you feel most motivated?")
    print("   Options: Morning, Afternoon, Evening, Late night, Varies")
    questionnaire['motivation_time'] = input("   Motivation time: ").strip()
    
    # Current habits
    print("\n3. What habits do you currently have? (comma-separated)")
    print("   Options: Exercise, Meditation, Reading, Journaling, Healthy eating, Other")
    habits_input = input("   Current habits: ").strip()
    questionnaire['current_habits'] = [habit.strip() for habit in habits_input.split(',') if habit.strip()]
    
    # Main goals
    print("\n4. What's your main goal?")
    print("   Options: Build consistency, Break bad habits, Improve productivity, Better work-life balance, Health improvement")
    questionnaire['main_goals'] = input("   Main goal: ").strip()
    
    # Mood description
    print("\n5. How would you describe your current mood?")
    print("   Options: Energized, Balanced, Stressed, Unmotivated, Excited")
    questionnaire['mood_description'] = input("   Mood: ").strip()
    
    # Motivation type
    print("\n6. What motivates you most?")
    print("   Options: Intrinsic rewards, External accountability, Visual progress, Social support, Gamification")
    questionnaire['motivation_type'] = input("   Motivation type: ").strip()
    
    # Procrastination time
    print("\n7. When do you tend to procrastinate?")
    print("   Options: Morning, After lunch, Evening, Before bed, Weekends")
    questionnaire['procrastination_time'] = input("   Procrastination time: ").strip()
    
    # Best habit time
    print("\n8. When is the best time for you to do habits?")
    print("   Options: Right after waking, During lunch break, After work, Before bed, Weekends only")
    questionnaire['best_habit_time'] = input("   Best habit time: ").strip()
    
    # Missed habit feeling
    print("\n9. How do you feel when you miss a habit?")
    print("   Options: Guilty, Determined to restart, Indifferent, Frustrated, Like giving up")
    questionnaire['missed_habit_feeling'] = input("   Feeling when missed: ").strip()
    
    # Biggest distraction
    print("\n10. What's your biggest distraction?")
    print("    Options: Phone/social media, Work demands, Family obligations, TV/streaming, Other habits")
    questionnaire['biggest_distraction'] = input("    Biggest distraction: ").strip()
    
    return questionnaire

def main():
    print("🚀 HabitLoop Interactive ML Model Test")
    print("=" * 50)
    
    # Initialize and train the model
    print("\n🔄 Initializing and training the ML model...")
    model = HabitPredictorEnsemble()
    features, success_rates = model.generate_synthetic_data(n_samples=1000)
    training_results = model.train_models(features, success_rates)
    print(f"✅ Model trained successfully! (Accuracy: {training_results['accuracy']:.3f})")
    
    while True:
        print("\n" + "=" * 50)
        print("🎯 Choose an option:")
        print("1. Test with sample data")
        print("2. Test with your own questionnaire")
        print("3. Exit")
        
        choice = input("\nYour choice (1-3): ").strip()
        
        if choice == '1':
            # Sample data test
            sample_questionnaire = {
                'focus_areas': ['Health & Fitness'],
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
            
            print("\n📝 Using sample questionnaire data...")
            prediction = model.predict_habit_success(sample_questionnaire)
            
        elif choice == '2':
            # User input test
            try:
                questionnaire = get_user_input()
                prediction = model.predict_habit_success(questionnaire)
            except Exception as e:
                print(f"❌ Error: {e}")
                continue
                
        elif choice == '3':
            print("\n👋 Thanks for testing the ML model!")
            break
            
        else:
            print("❌ Invalid choice. Please try again.")
            continue
        
        # Display results
        print("\n" + "=" * 50)
        print("🎯 PREDICTION RESULTS")
        print("=" * 50)
        print(f"Success Probability: {prediction['success_probability']:.2%}")
        print(f"Confidence Level: {prediction['confidence_level'].upper()}")
        print(f"Motivation Cluster: {prediction['motivation_cluster']}")
        print(f"Success Score: {prediction['success_score']:.3f}")
        
        print(f"\n💡 RECOMMENDATIONS:")
        for i, rec in enumerate(prediction['recommendations'], 1):
            print(f"   {i}. {rec}")
        
        print("\n" + "=" * 50)

if __name__ == "__main__":
    main() 