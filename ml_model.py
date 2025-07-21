#!/usr/bin/env python3
"""
HabitFlow ML Model - Habit Success Prediction
Predicts completion probability based on user behavior and habit characteristics
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import psycopg2
import os
import pickle
import json
import sys
from datetime import datetime

class HabitSuccessPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = [
            'user_level', 'user_xp', 'target_value', 'user_existing_habits_count', 
            'habit_difficulty_score', 'reminder_set_encoded', 'category_encoded', 'frequency_encoded'
        ]
        self.is_trained = False
        
    def connect_to_database(self):
        """Connect to PostgreSQL database using environment variables"""
        try:
            conn = psycopg2.connect(
                host=os.getenv('PGHOST', 'localhost'),
                database=os.getenv('PGDATABASE', 'habit_tracker_dev'),
                user=os.getenv('PGUSER', 'postgres'),
                password=os.getenv('PGPASSWORD', 'password'),
                port=os.getenv('PGPORT', '5432')
            )
            return conn
        except Exception as e:
            print(f"Database connection error: {e}")
            return None
    
    def create_training_table(self):
        """Create ML training data table with synthetic data"""
        conn = self.connect_to_database()
        if not conn:
            return False
            
        cursor = conn.cursor()
        
        try:
            # Create table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ml_habit_features (
                    id SERIAL PRIMARY KEY,
                    user_level INTEGER,
                    user_xp INTEGER,
                    habit_category VARCHAR(50),
                    target_value INTEGER,
                    frequency VARCHAR(20),
                    reminder_set BOOLEAN,
                    user_existing_habits_count INTEGER,
                    habit_difficulty_score DECIMAL(3,2),
                    completion_rate DECIMAL(5,4),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            
            # Check if data already exists
            cursor.execute("SELECT COUNT(*) FROM ml_habit_features")
            count = cursor.fetchone()[0]
            
            if count == 0:
                print("Generating synthetic training data...")
                # Insert base training examples
                base_data = [
                    # High success patterns
                    (5, 2500, 'health', 1, 'daily', True, 3, 0.3, 0.95),
                    (4, 1800, 'productivity', 1, 'daily', True, 2, 0.4, 0.88),
                    (3, 1200, 'mindfulness', 1, 'daily', True, 4, 0.2, 0.92),
                    (6, 3200, 'fitness', 2, 'daily', True, 1, 0.6, 0.85),
                    (2, 800, 'learning', 1, 'daily', True, 5, 0.3, 0.78),
                    
                    # Medium success patterns  
                    (3, 1500, 'health', 3, 'daily', False, 6, 0.7, 0.65),
                    (2, 600, 'productivity', 2, 'weekly', True, 3, 0.5, 0.72),
                    (4, 2100, 'social', 1, 'daily', False, 2, 0.4, 0.68),
                    (1, 200, 'creativity', 1, 'daily', True, 1, 0.3, 0.55),
                    (5, 2800, 'finance', 4, 'weekly', True, 4, 0.8, 0.70),
                    
                    # Low success patterns
                    (1, 100, 'fitness', 5, 'daily', False, 8, 0.9, 0.25),
                    (2, 400, 'health', 4, 'daily', False, 7, 0.8, 0.35),
                    (3, 900, 'productivity', 6, 'daily', False, 5, 0.9, 0.40),
                    (1, 50, 'learning', 3, 'weekly', False, 9, 0.7, 0.28),
                    (4, 1600, 'mindfulness', 5, 'daily', False, 6, 0.8, 0.45)
                ]
                
                for data in base_data:
                    cursor.execute("""
                        INSERT INTO ml_habit_features 
                        (user_level, user_xp, habit_category, target_value, frequency, 
                         reminder_set, user_existing_habits_count, habit_difficulty_score, completion_rate)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, data)
                
                # Generate additional synthetic data
                categories = ['health', 'productivity', 'fitness', 'mindfulness', 'learning', 'social', 'creativity', 'finance']
                frequencies = ['daily', 'weekly']
                
                for i in range(185):  # Generate 185 more samples for total of 200
                    level_val = np.random.randint(1, 11)
                    xp_val = level_val * 400 + np.random.randint(0, 800)
                    category_val = np.random.choice(categories)
                    target_val = np.random.randint(1, 6)
                    freq_val = np.random.choice(frequencies)
                    reminder_val = np.random.random() > 0.3
                    existing_habits = np.random.randint(1, 9)
                    difficulty = np.random.uniform(0.1, 0.9)
                    
                    # Calculate realistic completion rate based on features
                    completion = max(0.1, min(0.98, 
                        0.6 + 
                        (level_val - 5) * 0.05 +
                        (0.15 if reminder_val else -0.10) +
                        (8 - existing_habits) * 0.02 +
                        (1 - difficulty) * 0.3 +
                        (0.1 if target_val <= 2 else -0.05 * (target_val - 2)) +
                        np.random.uniform(-0.1, 0.1)
                    ))
                    
                    cursor.execute("""
                        INSERT INTO ml_habit_features 
                        (user_level, user_xp, habit_category, target_value, frequency, 
                         reminder_set, user_existing_habits_count, habit_difficulty_score, completion_rate)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (level_val, xp_val, category_val, target_val, freq_val, 
                          reminder_val, existing_habits, round(difficulty, 2), round(completion, 4)))
                
                print("Generated 200 synthetic training samples")
            else:
                print(f"Using existing {count} training samples")
            
            conn.commit()
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Error creating training data: {e}")
            cursor.close()
            conn.close()
            return False
    
    def load_training_data(self):
        """Load training data from PostgreSQL"""
        conn = self.connect_to_database()
        if not conn:
            return None
            
        query = """
        SELECT user_level, user_xp, habit_category, target_value, frequency, 
               reminder_set, user_existing_habits_count, habit_difficulty_score, completion_rate
        FROM ml_habit_features
        ORDER BY created_at
        """
        
        try:
            df = pd.read_sql_query(query, conn)
            conn.close()
            return df
        except Exception as e:
            print(f"Error loading data: {e}")
            if conn:
                conn.close()
            return None
    
    def preprocess_data(self, df):
        """Preprocess data for training"""
        # Handle categorical variables
        categorical_columns = ['habit_category', 'frequency']
        
        for col in categorical_columns:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                encoded_col = f'{col.split("_")[0]}_encoded'
                df[encoded_col] = self.label_encoders[col].fit_transform(df[col])
            else:
                encoded_col = f'{col.split("_")[0]}_encoded'
                df[encoded_col] = self.label_encoders[col].transform(df[col])
        
        # Convert boolean to int
        df['reminder_set_encoded'] = df['reminder_set'].astype(int)
        
        # Select features
        X = df[self.feature_columns]
        y = df['completion_rate']
        
        return X, y
    
    def train_model(self):
        """Train the linear regression model"""
        print("Creating training data table...")
        if not self.create_training_table():
            return False
            
        print("Loading training data from PostgreSQL...")
        df = self.load_training_data()
        
        if df is None or len(df) == 0:
            print("No training data available")
            return False
        
        print(f"Loaded {len(df)} training samples")
        
        # Preprocess data
        X, y = self.preprocess_data(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        print("Training linear regression model...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        
        r2 = r2_score(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        
        print(f"\nModel Performance Metrics:")
        print(f"R² Score: {r2:.4f}")
        print(f"Mean Squared Error: {mse:.4f}")
        print(f"Mean Absolute Error: {mae:.4f}")
        
        # Feature importance
        feature_importance = dict(zip(self.feature_columns, self.model.coef_))
        print(f"\nFeature Importance (Coefficients):")
        for feature, importance in sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True):
            print(f"  {feature}: {importance:.4f}")
        
        self.is_trained = True
        return True
    
    def predict_success_probability(self, user_profile):
        """Predict habit completion probability for a user profile"""
        if not self.is_trained:
            print("Model not trained yet")
            return None
        
        # Prepare input data
        input_data = {
            'user_level': user_profile.get('level', 1),
            'user_xp': user_profile.get('xp', 0),
            'target_value': user_profile.get('target_value', 1),
            'user_existing_habits_count': user_profile.get('existing_habits_count', 0),
            'habit_difficulty_score': user_profile.get('difficulty_score', 0.5),
            'reminder_set_encoded': 1 if user_profile.get('reminder_set', False) else 0,
        }
        
        # Encode categorical features
        try:
            input_data['category_encoded'] = self.label_encoders['habit_category'].transform(
                [user_profile.get('category', 'health')]
            )[0]
            input_data['frequency_encoded'] = self.label_encoders['frequency'].transform(
                [user_profile.get('frequency', 'daily')]
            )[0]
        except ValueError as e:
            print(f"Unknown category or frequency: {e}")
            return None
        
        # Create input array
        input_array = np.array([[input_data[col] for col in self.feature_columns]])
        
        # Scale input
        input_scaled = self.scaler.transform(input_array)
        
        # Predict
        prediction = self.model.predict(input_scaled)[0]
        
        # Ensure prediction is between 0 and 1
        prediction = max(0, min(1, prediction))
        
        return prediction
    
    def save_model(self, filepath='habit_success_model.pkl'):
        """Save trained model to file"""
        if not self.is_trained:
            print("Model not trained")
            return False
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_columns': self.feature_columns,
            'trained_at': datetime.now().isoformat()
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"Model saved to {filepath}")
        return True
    
    def load_model(self, filepath='habit_success_model.pkl'):
        """Load trained model from file"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.label_encoders = model_data['label_encoders']
            self.feature_columns = model_data['feature_columns']
            self.is_trained = True
            
            print(f"Model loaded from {filepath}")
            print(f"Trained at: {model_data['trained_at']}")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False

def main():
    """Main function to demonstrate ML functionality"""
    predictor = HabitSuccessPredictor()
    
    # Train model
    if predictor.train_model():
        predictor.save_model()
        
        # Example predictions
        print("\n" + "="*60)
        print("SAMPLE PREDICTIONS - HABIT SUCCESS PROBABILITY")
        print("="*60)
        
        # High success profile
        profile_1 = {
            'level': 5,
            'xp': 2500,
            'category': 'health',
            'target_value': 1,
            'frequency': 'daily',
            'reminder_set': True,
            'existing_habits_count': 3,
            'difficulty_score': 0.3
        }
        
        prediction_1 = predictor.predict_success_probability(profile_1)
        print(f"High Success Profile: {prediction_1:.2%} completion probability")
        print(f"  - Level 5 user with reminders enabled")
        print(f"  - Easy habit (difficulty: 0.3) with 3 existing habits")
        
        # Medium success profile
        profile_2 = {
            'level': 3,
            'xp': 1200,
            'category': 'productivity',
            'target_value': 2,
            'frequency': 'daily',
            'reminder_set': False,
            'existing_habits_count': 5,
            'difficulty_score': 0.6
        }
        
        prediction_2 = predictor.predict_success_probability(profile_2)
        print(f"\nMedium Success Profile: {prediction_2:.2%} completion probability")
        print(f"  - Level 3 user without reminders")
        print(f"  - Moderate habit (difficulty: 0.6) with 5 existing habits")
        
        # Low success profile
        profile_3 = {
            'level': 1,
            'xp': 100,
            'category': 'fitness',
            'target_value': 5,
            'frequency': 'daily',
            'reminder_set': False,
            'existing_habits_count': 8,
            'difficulty_score': 0.9
        }
        
        prediction_3 = predictor.predict_success_probability(profile_3)
        print(f"\nLow Success Profile: {prediction_3:.2%} completion probability")
        print(f"  - Level 1 beginner without reminders")
        print(f"  - Very difficult habit (difficulty: 0.9) with 8 existing habits")
        
        print(f"\n" + "="*60)
        print("MODEL READY FOR API INTEGRATION")
        print("="*60)
    else:
        print("Failed to train model")

if __name__ == "__main__":
    main()