import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, mean_squared_error, silhouette_score
import joblib
import json
from typing import Dict, List, Tuple, Any
import os
from datetime import datetime

# Optional import for database connectivity
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print("WARNING: psycopg2 not available. Database connectivity will be disabled.")

class HabitPredictorEnsemble:
    def __init__(self):
        self.habit_success_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.optimal_timing_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.motivation_clusterer = KMeans(n_clusters=5, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False

    def prepare_features(self, questionnaire_data: Dict) -> np.ndarray:
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
                    # Handle multiple selections
                    feature_sum = sum(feature_mapping[key].get(item, 0) for item in value)
                    features.append(feature_sum / len(value) if value else 0)
                else:
                    features.append(feature_mapping[key].get(value, 0))

        # Add derived features
        features.extend(self._calculate_derived_features(questionnaire_data))

        return np.array(features).reshape(1, -1)

    def _calculate_derived_features(self, data: Dict) -> List[float]:
        """Calculate complex derived features"""
        derived = []

        # Motivation-time alignment score
        motivation_time = data.get('motivation_time', 'Varies')
        best_habit_time = data.get('best_habit_time', 'Right after waking')
        alignment_score = 1.0 if motivation_time == best_habit_time else 0.5
        derived.append(alignment_score)

        # Stress resilience score
        mood = data.get('mood_description', 'Balanced')
        missed_feeling = data.get('missed_habit_feeling', 'Determined to restart')
        stress_resilience = (5 if mood == 'Energized' else 3 if mood == 'Balanced' else 1) * \
                          (1.0 if missed_feeling == 'Determined to restart' else 0.5)
        derived.append(stress_resilience)

        # Consistency potential
        current_habits = data.get('current_habits', [])
        consistency_score = len(current_habits) * 0.2 if isinstance(current_habits, list) else 0.2
        derived.append(min(consistency_score, 1.0))

        return derived

    def generate_synthetic_data(self, n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data based on behavioral psychology research"""
        np.random.seed(42)

        # Realistic feature distributions
        features = []
        success_rates = []

        for _ in range(n_samples):
            # Random questionnaire responses
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

            # Derived features
            alignment = 1.0 if motivation_time == best_habit_time else 0.5
            stress_resilience = mood * (1.0 if missed_feeling >= 4 else 0.5)
            consistency = min(current_habits_count * 0.2, 1.0)

            feature_vector = [
                focus_area, motivation_time, current_habits_count, main_goal,
                mood, motivation_type, procrastination_time, best_habit_time,
                missed_feeling, distraction, alignment, stress_resilience, consistency
            ]

            # Success rate based on psychological factors
            base_success = 0.3
            success_rate = base_success + \
                     (float(mood) - 1) * 0.1 + \
                     (float(missed_feeling) - 1) * 0.15 + \
                     float(alignment) * 0.2 + \
                     float(consistency) * 0.25

            # Add realistic noise
            success_rate += np.random.normal(0, 0.1)
            success_rate = max(0.1, min(0.95, success_rate))

            features.append(feature_vector)
            success_rates.append(success_rate)

        return np.array(features), np.array(success_rates)

    def train_models(self, features: np.ndarray, success_rates: np.ndarray):
        """Train all ensemble models"""
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features, success_rates, test_size=0.2, random_state=42
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train habit success classifier (binary: >0.6 success rate)
        y_binary = (y_train > 0.6).astype(int)
        self.habit_success_classifier.fit(X_train_scaled, y_binary)

        # Train optimal timing regressor (predict success rate)
        self.optimal_timing_regressor.fit(X_train_scaled, y_train)

        # Train motivation clusterer
        self.motivation_clusterer.fit(X_train_scaled)

        # Evaluate models
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

    def predict_habit_success(self, questionnaire_data: Dict) -> Dict[str, Any]:
        """Predict habit success probability and recommendations"""
        if not self.is_trained:
            raise ValueError("Models must be trained before prediction")

        features = self.prepare_features(questionnaire_data)
        features_scaled = self.scaler.transform(features)

        # Get predictions from all models
        success_probability = self.habit_success_classifier.predict_proba(features_scaled)[0][1]
        success_score = self.optimal_timing_regressor.predict(features_scaled)[0]
        motivation_cluster = self.motivation_clusterer.predict(features_scaled)[0]

        # Generate personalized recommendations
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

    def _generate_recommendations(self, data: Dict, success_prob: float, cluster: int) -> List[str]:
        """Generate personalized habit recommendations"""
        recommendations = []

        # Base recommendations on success probability
        if float(success_prob) < 0.4:
            recommendations.append("Start with very small, easy habits (2-5 minutes)")
            recommendations.append("Focus on consistency over intensity")
        elif float(success_prob) < 0.7:
            recommendations.append("Gradually increase habit difficulty")
            recommendations.append("Set up accountability systems")
        else:
            recommendations.append("You're ready for challenging habits")
            recommendations.append("Consider habit stacking for efficiency")

        # Cluster-specific recommendations
        cluster_advice = {
            0: ["Focus on intrinsic motivation", "Track personal progress"],
            1: ["Use external accountability", "Join habit communities"],
            2: ["Implement visual progress tracking", "Use habit apps"],
            3: ["Focus on social support systems", "Share goals with friends"],
            4: ["Gamify your habits", "Use reward systems"]
        }

        if cluster in cluster_advice:
            recommendations.extend(cluster_advice[cluster])

        # Time-based recommendations
        best_time = data.get('best_habit_time', 'Right after waking')
        if best_time == 'Right after waking':
            recommendations.append("Morning habits have highest success rates")
        elif best_time == 'Before bed':
            recommendations.append("Evening habits good for reflection and relaxation")

        return recommendations

    def save_models(self, model_dir: str = "server/ml/models/trained"):
        """Save trained models to disk"""
        os.makedirs(model_dir, exist_ok=True)

        joblib.dump(self.habit_success_classifier, f"{model_dir}/habit_classifier.pkl")
        joblib.dump(self.optimal_timing_regressor, f"{model_dir}/timing_regressor.pkl")
        joblib.dump(self.motivation_clusterer, f"{model_dir}/motivation_clusterer.pkl")
        joblib.dump(self.scaler, f"{model_dir}/scaler.pkl")

        with open(f"{model_dir}/metadata.json", 'w') as f:
            json.dump({
                'is_trained': self.is_trained,
                'created_at': datetime.now().isoformat(),
                'model_version': '1.0'
            }, f)

    def load_models(self, model_dir: str = "server/ml/models/trained"):
        """Load trained models from disk"""
        try:
            self.habit_success_classifier = joblib.load(f"{model_dir}/habit_classifier.pkl")
            self.optimal_timing_regressor = joblib.load(f"{model_dir}/timing_regressor.pkl")
            self.motivation_clusterer = joblib.load(f"{model_dir}/motivation_clusterer.pkl")
            self.scaler = joblib.load(f"{model_dir}/scaler.pkl")
            self.is_trained = True
            return True
        except FileNotFoundError:
            return False

# Global instance
predictor = HabitPredictorEnsemble()