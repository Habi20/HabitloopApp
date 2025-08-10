import asyncio
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np
from .models.habitPredictor import predictor
from .pipelines.featureEngineering import feature_pipeline
import os

# Optional import for database connectivity
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print("WARNING: psycopg2 not available. Database connectivity will be disabled.")

class MLInferenceService:
    def __init__(self):
        self.predictor = predictor
        self.feature_pipeline = feature_pipeline
        self.model_loaded = False
        self._load_models()
    
    def _load_models(self):
        """Load pre-trained models on service initialization"""
        try:
            success = self.predictor.load_models()
            if success:
                self.model_loaded = True
                print("✅ ML models loaded successfully")
            else:
                print("⚠️ No pre-trained models found, will need to train first")
        except Exception as e:
            print(f"❌ Error loading models: {e}")
    
    async def train_models_with_synthetic_data(self) -> Dict[str, Any]:
        """Train models using synthetic data"""
        try:
            print("🔄 Generating synthetic training data...")
            features, success_rates = self.predictor.generate_synthetic_data(n_samples=1000)
            
            print("🔄 Training ensemble models...")
            training_results = self.predictor.train_models(features, success_rates)
            
            print("💾 Saving trained models...")
            self.predictor.save_models()
            self.model_loaded = True
            
            return {
                'success': True,
                'training_results': training_results,
                'message': 'Models trained successfully with synthetic data'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to train models'
            }
    
    async def predict_habit_success(self, user_id: str, habit_data: Dict, 
                                  questionnaire_data: Dict) -> Dict[str, Any]:
        """Predict habit success probability for a user"""
        if not self.model_loaded:
            return {
                'success': False,
                'error': 'Models not loaded',
                'message': 'Please train models first'
            }
        
        try:
            # Get user data and completion history
            user_data = await self._get_user_data(user_id)
            completion_history = await self._get_completion_history(user_id)
            
            # Create feature vector
            feature_vector = self.feature_pipeline.create_feature_vector(
                user_data, habit_data, completion_history, questionnaire_data
            )
            
            # Get prediction
            prediction_result = self.predictor.predict_habit_success(questionnaire_data)
            
            # Enhance with feature-based insights
            enhanced_result = await self._enhance_prediction_with_insights(
                prediction_result, feature_vector, user_data, habit_data
            )
            
            return {
                'success': True,
                'prediction': enhanced_result,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to generate prediction'
            }
    
    async def get_personalized_recommendations(self, user_id: str, 
                                             questionnaire_data: Dict) -> Dict[str, Any]:
        """Get personalized habit recommendations"""
        if not self.model_loaded:
            return {'success': False, 'error': 'Models not loaded'}
        
        try:
            # Get user context
            user_data = await self._get_user_data(user_id)
            existing_habits = await self._get_user_habits(user_id)
            
            # Generate recommendations for different habit categories
            categories = ['Health & Fitness', 'Learning', 'Productivity', 'Mindfulness', 'Social', 'Creative']
            recommendations = []
            
            for category in categories:
                if not self._user_has_category(existing_habits, category):
                    habit_suggestion = {
                        'category': category,
                        'title': self._get_category_habit_suggestion(category),
                        'difficulty': self._calculate_category_difficulty(category, questionnaire_data),
                        'predicted_success': await self._predict_category_success(
                            user_id, category, questionnaire_data
                        )
                    }
                    recommendations.append(habit_suggestion)
            
            # Sort by predicted success rate
            recommendations.sort(key=lambda x: x['predicted_success'], reverse=True)
            
            return {
                'success': True,
                'recommendations': recommendations[:5],  # Top 5 recommendations
                'user_profile': await self._generate_user_profile_summary(user_data, questionnaire_data)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to generate recommendations'
            }
    
    async def analyze_habit_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze user's habit completion patterns"""
        try:
            completion_history = await self._get_completion_history(user_id)
            user_habits = await self._get_user_habits(user_id)
            
            if not completion_history:
                return {
                    'success': True,
                    'analysis': {
                        'message': 'No habit data available for analysis',
                        'recommendations': ['Start tracking habits to see personalized insights']
                    }
                }
            
            # Analyze patterns
            patterns = {
                'overall_completion_rate': self._calculate_overall_completion_rate(completion_history),
                'best_day_of_week': self._find_best_completion_day(completion_history),
                'consistency_trend': self._analyze_consistency_trend(completion_history),
                'streak_performance': self._analyze_streak_performance(completion_history),
                'category_performance': self._analyze_category_performance(completion_history, user_habits)
            }
            
            # Generate insights
            insights = self._generate_pattern_insights(patterns)
            
            return {
                'success': True,
                'analysis': {
                    'patterns': patterns,
                    'insights': insights,
                    'recommendations': self._generate_pattern_recommendations(patterns)
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to analyze habit patterns'
            }
    
    async def _get_user_data(self, user_id: str) -> Dict:
        """Get user data from database"""
        # Placeholder - integrate with your existing storage
        return {
            'id': user_id,
            'level': 1,
            'xp': 0,
            'created_at': datetime.now().isoformat()
        }
    
    async def _get_completion_history(self, user_id: str) -> List[Dict]:
        """Get user's habit completion history"""
        # Placeholder - integrate with your existing storage
        return []
    
    async def _get_user_habits(self, user_id: str) -> List[Dict]:
        """Get user's current habits"""
        # Placeholder - integrate with your existing storage
        return []
    
    async def _enhance_prediction_with_insights(self, prediction: Dict, 
                                              feature_vector: np.ndarray,
                                              user_data: Dict, habit_data: Dict) -> Dict:
        """Enhance prediction with additional insights"""
        enhanced = prediction.copy()
        
        # Add feature importance insights
        feature_names = [
            'user_level', 'user_xp', 'account_age_days', 'motivation_score',
            'resilience_score', 'consistency_preference', 'target_value',
            'has_reminder', 'is_daily', 'category_difficulty'
        ]
        
        # Identify key factors affecting success
        key_factors = []
        if feature_vector[6] > 5:  # High target value
            key_factors.append("High target value may reduce success rate")
        if feature_vector[7] == 1:  # Has reminder
            key_factors.append("Reminder system will help with consistency")
        if feature_vector[3] > 0.7:  # High motivation score
            key_factors.append("Strong motivation profile detected")
        
        enhanced['key_factors'] = key_factors
        enhanced['difficulty_assessment'] = self._assess_habit_difficulty(feature_vector)
        
        return enhanced
    
    def _user_has_category(self, habits: List[Dict], category: str) -> bool:
        """Check if user already has habits in this category"""
        return any(habit.get('category') == category for habit in habits)
    
    def _get_category_habit_suggestion(self, category: str) -> str:
        """Get habit suggestion for category"""
        suggestions = {
            'Health & Fitness': 'Daily 10-minute walk',
            'Learning': 'Read for 15 minutes daily',
            'Productivity': 'Plan tomorrow before bed',
            'Mindfulness': '5-minute morning meditation',
            'Social': 'Call a friend weekly',
            'Creative': 'Write in journal for 10 minutes'
        }
        return suggestions.get(category, 'Daily practice')
    
    def _calculate_category_difficulty(self, category: str, questionnaire: Dict) -> str:
        """Calculate difficulty level for category based on user profile"""
        base_difficulties = {
            'Health & Fitness': 'medium',
            'Learning': 'medium',
            'Productivity': 'easy',
            'Mindfulness': 'easy',
            'Social': 'easy',
            'Creative': 'medium'
        }
        
        # Adjust based on user motivation and experience
        motivation_level = questionnaire.get('mood_description', 'Balanced')
        if motivation_level in ['Energized', 'Excited']:
            return 'easy'
        elif motivation_level in ['Stressed', 'Unmotivated']:
            return 'hard'
        
        return base_difficulties.get(category, 'medium')
    
    async def _predict_category_success(self, user_id: str, category: str, 
                                      questionnaire: Dict) -> float:
        """Predict success rate for a specific category"""
        # Create mock habit data for category
        mock_habit = {
            'category': category,
            'target_value': 1,
            'frequency': 'daily',
            'reminder_time': '09:00'
        }
        
        result = await self.predict_habit_success(user_id, mock_habit, questionnaire)
        return result.get('prediction', {}).get('success_probability', 0.5)
    
    async def _generate_user_profile_summary(self, user_data: Dict, questionnaire: Dict) -> Dict:
        """Generate user profile summary"""
        return {
            'motivation_type': questionnaire.get('motivation_type', 'Unknown'),
            'best_time': questionnaire.get('best_habit_time', 'Not specified'),
            'focus_areas': questionnaire.get('focus_areas', []),
            'experience_level': 'Beginner' if user_data.get('level', 1) < 5 else 'Intermediate'
        }
    
    def _calculate_overall_completion_rate(self, history: List[Dict]) -> float:
        """Calculate overall completion rate"""
        if not history:
            return 0.0
        completed = sum(1 for h in history if h.get('value', 0) > 0)
        return completed / len(history)
    
    def _find_best_completion_day(self, history: List[Dict]) -> str:
        """Find day of week with highest completion rate"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[0]  # Placeholder
    
    def _analyze_consistency_trend(self, history: List[Dict]) -> str:
        """Analyze if user is getting more or less consistent"""
        return "improving"  # Placeholder
    
    def _analyze_streak_performance(self, history: List[Dict]) -> Dict:
        """Analyze streak performance"""
        return {
            'longest_streak': 7,
            'current_streak': 3,
            'average_streak': 4.2
        }
    
    def _analyze_category_performance(self, history: List[Dict], habits: List[Dict]) -> Dict:
        """Analyze performance by category"""
        return {}  # Placeholder
    
    def _generate_pattern_insights(self, patterns: Dict) -> List[str]:
        """Generate insights from patterns"""
        insights = []
        
        completion_rate = patterns.get('overall_completion_rate', 0)
        if completion_rate > 0.8:
            insights.append("Excellent consistency! You're building strong habits.")
        elif completion_rate > 0.6:
            insights.append("Good progress! Small improvements can boost your success.")
        else:
            insights.append("Focus on building consistency with easier habits first.")
        
        return insights
    
    def _generate_pattern_recommendations(self, patterns: Dict) -> List[str]:
        """Generate recommendations based on patterns"""
        recommendations = []
        
        completion_rate = patterns.get('overall_completion_rate', 0)
        if completion_rate < 0.5:
            recommendations.append("Try reducing habit difficulty or target values")
            recommendations.append("Focus on building one habit at a time")
        else:
            recommendations.append("Consider adding a new habit to your routine")
            recommendations.append("Try habit stacking to build on your success")
        
        return recommendations
    
    def _assess_habit_difficulty(self, feature_vector: np.ndarray) -> str:
        """Assess habit difficulty based on features"""
        target_value = feature_vector[6]
        category_difficulty = feature_vector[9]
        
        if target_value > 5 or category_difficulty > 0.7:
            return "challenging"
        elif target_value > 2 or category_difficulty > 0.5:
            return "moderate"
        else:
            return "easy"

# Global service instance
ml_service = MLInferenceService()
