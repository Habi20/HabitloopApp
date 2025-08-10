
import pandas as pd
import numpy as np
from typing import Dict, List, Any
from datetime import datetime, timedelta
import json

class FeatureEngineeringPipeline:
    def __init__(self):
        self.feature_store = {}
        
    def extract_user_profile_features(self, user_data: Dict, questionnaire: Dict) -> Dict[str, float]:
        """Extract comprehensive user profile features"""
        features = {}
        
        # Basic profile features
        features['user_level'] = user_data.get('level', 1)
        features['user_xp'] = user_data.get('xp', 0)
        features['account_age_days'] = self._calculate_account_age(user_data.get('created_at'))
        
        # Questionnaire-derived features
        features.update(self._process_questionnaire_features(questionnaire))
        
        # Behavioral pattern features
        features.update(self._extract_behavioral_patterns(user_data))
        
        return features
    
    def extract_habit_features(self, habit_data: Dict) -> Dict[str, float]:
        """Extract habit-specific features"""
        features = {}
        
        # Habit characteristics
        features['target_value'] = habit_data.get('target_value', 1)
        features['has_reminder'] = 1.0 if habit_data.get('reminder_time') else 0.0
        features['is_daily'] = 1.0 if habit_data.get('frequency') == 'daily' else 0.0
        
        # Category difficulty mapping
        category_difficulty = {
            'Health & Fitness': 0.7,
            'Learning': 0.8,
            'Productivity': 0.6,
            'Mindfulness': 0.5,
            'Social': 0.4,
            'Creative': 0.6
        }
        features['category_difficulty'] = category_difficulty.get(
            habit_data.get('category'), 0.5
        )
        
        # Habit complexity score
        features['complexity_score'] = self._calculate_habit_complexity(habit_data)
        
        return features
    
    def extract_temporal_features(self, completion_history: List[Dict]) -> Dict[str, float]:
        """Extract time-based behavioral features"""
        features = {}
        
        if not completion_history:
            return {
                'completion_rate': 0.0,
                'avg_streak': 0.0,
                'consistency_score': 0.0,
                'weekend_completion_rate': 0.0,
                'time_of_day_preference': 0.0
            }
        
        # Calculate completion metrics
        total_days = len(completion_history)
        completed_days = sum(1 for c in completion_history if c.get('value', 0) > 0)
        features['completion_rate'] = completed_days / total_days if total_days > 0 else 0.0
        
        # Streak analysis
        streaks = self._calculate_streaks(completion_history)
        features['avg_streak'] = np.mean(streaks) if streaks else 0.0
        features['max_streak'] = max(streaks) if streaks else 0.0
        
        # Consistency patterns
        features['consistency_score'] = self._calculate_consistency_score(completion_history)
        
        # Weekend vs weekday patterns
        features['weekend_completion_rate'] = self._calculate_weekend_rate(completion_history)
        
        # Time preferences (if available)
        features['time_of_day_preference'] = self._analyze_time_preferences(completion_history)
        
        return features
    
    def extract_contextual_features(self, external_data: Dict = None) -> Dict[str, float]:
        """Extract environmental and contextual features"""
        features = {}
        
        # Default contextual features
        current_date = datetime.now()
        features['day_of_week'] = current_date.weekday()  # 0-6
        features['is_weekend'] = 1.0 if current_date.weekday() >= 5 else 0.0
        features['month'] = current_date.month
        features['is_holiday_season'] = 1.0 if current_date.month in [11, 12, 1] else 0.0
        
        # External data integration (if available)
        if external_data:
            features['weather_score'] = external_data.get('weather_favorability', 0.5)
            features['calendar_busy_score'] = external_data.get('calendar_density', 0.5)
        
        return features
    
    def create_feature_vector(self, user_data: Dict, habit_data: Dict, 
                            completion_history: List[Dict], questionnaire: Dict) -> np.ndarray:
        """Create complete feature vector for ML models"""
        all_features = {}
        
        # Combine all feature types
        all_features.update(self.extract_user_profile_features(user_data, questionnaire))
        all_features.update(self.extract_habit_features(habit_data))
        all_features.update(self.extract_temporal_features(completion_history))
        all_features.update(self.extract_contextual_features())
        
        # Convert to ordered array
        feature_names = [
            'user_level', 'user_xp', 'account_age_days', 'motivation_score',
            'resilience_score', 'consistency_preference', 'target_value',
            'has_reminder', 'is_daily', 'category_difficulty', 'complexity_score',
            'completion_rate', 'avg_streak', 'max_streak', 'consistency_score',
            'weekend_completion_rate', 'time_of_day_preference', 'day_of_week',
            'is_weekend', 'month', 'is_holiday_season'
        ]
        
        feature_vector = [all_features.get(name, 0.0) for name in feature_names]
        return np.array(feature_vector)
    
    def _process_questionnaire_features(self, questionnaire: Dict) -> Dict[str, float]:
        """Process questionnaire responses into numerical features"""
        features = {}
        
        # Motivation score from multiple questions
        motivation_indicators = [
            questionnaire.get('mood_description', 'Balanced'),
            questionnaire.get('motivation_type', 'Intrinsic rewards'),
            questionnaire.get('missed_habit_feeling', 'Determined to restart')
        ]
        features['motivation_score'] = self._calculate_motivation_score(motivation_indicators)
        
        # Resilience score
        resilience_indicators = [
            questionnaire.get('missed_habit_feeling', 'Determined to restart'),
            questionnaire.get('biggest_distraction', 'Phone/social media')
        ]
        features['resilience_score'] = self._calculate_resilience_score(resilience_indicators)
        
        # Consistency preference
        timing_consistency = questionnaire.get('motivation_time') == questionnaire.get('best_habit_time')
        features['consistency_preference'] = 1.0 if timing_consistency else 0.5
        
        return features
    
    def _calculate_account_age(self, created_at: str) -> float:
        """Calculate account age in days"""
        if not created_at:
            return 0.0
        
        try:
            created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            return (datetime.now() - created_date).days
        except:
            return 0.0
    
    def _calculate_habit_complexity(self, habit_data: Dict) -> float:
        """Calculate habit complexity score"""
        base_complexity = 0.3
        
        # Target value complexity
        target_value = habit_data.get('target_value', 1)
        complexity = base_complexity + (target_value - 1) * 0.1
        
        # Frequency complexity
        frequency = habit_data.get('frequency', 'daily')
        if frequency == 'weekly':
            complexity += 0.2
        elif frequency == 'monthly':
            complexity += 0.4
        
        return min(complexity, 1.0)
    
    def _calculate_streaks(self, completion_history: List[Dict]) -> List[int]:
        """Calculate all streaks from completion history"""
        streaks = []
        current_streak = 0
        
        for completion in sorted(completion_history, key=lambda x: x.get('completed_at', '')):
            if completion.get('value', 0) > 0:
                current_streak += 1
            else:
                if current_streak > 0:
                    streaks.append(current_streak)
                current_streak = 0
        
        if current_streak > 0:
            streaks.append(current_streak)
        
        return streaks
    
    def _calculate_consistency_score(self, completion_history: List[Dict]) -> float:
        """Calculate consistency score based on completion patterns"""
        if len(completion_history) < 7:
            return 0.0
        
        # Check for regular patterns (weekly consistency)
        completions_by_day = {}
        for completion in completion_history:
            try:
                date = datetime.fromisoformat(completion.get('completed_at', ''))
                day_of_week = date.weekday()
                if day_of_week not in completions_by_day:
                    completions_by_day[day_of_week] = []
                completions_by_day[day_of_week].append(completion.get('value', 0) > 0)
            except:
                continue
        
        # Calculate consistency for each day of week
        day_consistency_scores = []
        for day, completions in completions_by_day.items():
            if len(completions) >= 2:
                completion_rate = sum(completions) / len(completions)
                day_consistency_scores.append(completion_rate)
        
        return np.mean(day_consistency_scores) if day_consistency_scores else 0.0
    
    def _calculate_weekend_rate(self, completion_history: List[Dict]) -> float:
        """Calculate weekend completion rate"""
        weekend_completions = 0
        weekend_total = 0
        
        for completion in completion_history:
            try:
                date = datetime.fromisoformat(completion.get('completed_at', ''))
                if date.weekday() >= 5:  # Saturday or Sunday
                    weekend_total += 1
                    if completion.get('value', 0) > 0:
                        weekend_completions += 1
            except:
                continue
        
        return weekend_completions / weekend_total if weekend_total > 0 else 0.0
    
    def _analyze_time_preferences(self, completion_history: List[Dict]) -> float:
        """Analyze time of day preferences (placeholder)"""
        # This would analyze completion times if available
        # For now, return neutral score
        return 0.5
    
    def _calculate_motivation_score(self, indicators: List[str]) -> float:
        """Calculate motivation score from questionnaire indicators"""
        mood_scores = {
            'Energized': 1.0, 'Excited': 1.0, 'Balanced': 0.7,
            'Stressed': 0.3, 'Unmotivated': 0.1
        }
        
        motivation_type_scores = {
            'Intrinsic rewards': 0.9, 'Visual progress': 0.7,
            'External accountability': 0.6, 'Social support': 0.5,
            'Gamification': 0.4
        }
        
        missed_feeling_scores = {
            'Determined to restart': 1.0, 'Frustrated': 0.6,
            'Guilty': 0.4, 'Indifferent': 0.2, 'Like giving up': 0.1
        }
        
        scores = [
            mood_scores.get(indicators[0], 0.5),
            motivation_type_scores.get(indicators[1], 0.5),
            missed_feeling_scores.get(indicators[2], 0.5)
        ]
        
        return np.mean(scores)
    
    def _calculate_resilience_score(self, indicators: List[str]) -> float:
        """Calculate resilience score from questionnaire responses"""
        missed_feeling_resilience = {
            'Determined to restart': 1.0, 'Frustrated': 0.7,
            'Guilty': 0.5, 'Indifferent': 0.3, 'Like giving up': 0.1
        }
        
        distraction_resilience = {
            'Other habits': 0.8, 'Family obligations': 0.7,
            'Work demands': 0.6, 'TV/streaming': 0.4, 'Phone/social media': 0.2
        }
        
        scores = [
            missed_feeling_resilience.get(indicators[0], 0.5),
            distraction_resilience.get(indicators[1], 0.5)
        ]
        
        return np.mean(scores)

# Global instance
feature_pipeline = FeatureEngineeringPipeline()
