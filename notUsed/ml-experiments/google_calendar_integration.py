#!/usr/bin/env python3
"""
Google Calendar Integration for HabitFlow ML Predictions
Demonstrates how ML model predictions trigger automated calendar management
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List
import os

# Simulated Google Calendar API integration
class GoogleCalendarIntegration:
    def __init__(self, credentials_path=None):
        self.credentials_path = credentials_path
        self.calendar_id = 'primary'
        
    def create_habit_reminder(self, habit_data: Dict, prediction_result: Dict) -> Dict:
        """
        Create calendar reminders based on ML prediction results
        High-risk habits get more frequent reminders
        """
        
        # Determine reminder frequency based on ML confidence
        if prediction_result['confidence'] == 'low':
            reminder_frequency = 'daily'
            reminder_count = 7  # Daily for a week
            motivational_message = "⚠️ Focus needed: This habit needs extra attention"
        elif prediction_result['confidence'] == 'medium':
            reminder_frequency = 'every_other_day'
            reminder_count = 4  # Every other day for a week
            motivational_message = "📈 Building momentum: You're on the right track"
        else:  # high confidence
            reminder_frequency = 'weekly'
            reminder_count = 2  # Weekly check-ins
            motivational_message = "🎯 Success likely: Keep up the great work"
        
        # Create calendar event structure
        event_data = {
            'summary': f"🏆 Habit: {habit_data['title']}",
            'description': f"""
ML Prediction Analysis:
• Success Probability: {prediction_result['percentage']}
• Confidence Level: {prediction_result['confidence'].title()}
• {motivational_message}

Habit Details:
• Category: {habit_data.get('category', 'General')}
• Target: {habit_data.get('target_value', 1)} {habit_data.get('unit', 'times')}
• Difficulty: {habit_data.get('difficulty_score', 0.5)}/1.0

Tips for Success:
{self._get_success_tips(prediction_result)}
            """.strip(),
            'start': {
                'dateTime': datetime.now().isoformat(),
                'timeZone': 'UTC'
            },
            'end': {
                'dateTime': (datetime.now() + timedelta(minutes=15)).isoformat(),
                'timeZone': 'UTC'
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 10},
                    {'method': 'email', 'minutes': 60}
                ]
            }
        }
        
        # Add recurrence based on prediction
        if reminder_frequency == 'daily':
            event_data['recurrence'] = [f'RRULE:FREQ=DAILY;COUNT={reminder_count}']
        elif reminder_frequency == 'every_other_day':
            event_data['recurrence'] = [f'RRULE:FREQ=DAILY;INTERVAL=2;COUNT={reminder_count}']
        else:  # weekly
            event_data['recurrence'] = [f'RRULE:FREQ=WEEKLY;COUNT={reminder_count}']
        
        return {
            'event_created': True,
            'event_id': f"habit_{habit_data.get('id', 'new')}_{datetime.now().timestamp()}",
            'reminder_frequency': reminder_frequency,
            'calendar_data': event_data,
            'integration_type': 'google_calendar'
        }
    
    def create_milestone_celebration(self, habit_data: Dict, streak_days: int) -> Dict:
        """Create celebration events for habit milestones"""
        
        milestone_titles = {
            7: "🎉 One Week Streak!",
            14: "🔥 Two Week Momentum!",
            30: "⭐ One Month Champion!",
            100: "🏆 100-Day Legend!"
        }
        
        if streak_days in milestone_titles:
            event_data = {
                'summary': milestone_titles[streak_days],
                'description': f"""
🎊 Congratulations on your {streak_days}-day streak with "{habit_data['title']}"!

This is a significant achievement that deserves celebration. Research shows:
• {streak_days} days represents strong habit formation
• You've built neural pathways that support automatic behavior
• Your success probability for future habits has increased

Keep up the amazing work!
                """.strip(),
                'start': {
                    'dateTime': datetime.now().isoformat(),
                    'timeZone': 'UTC'
                },
                'end': {
                    'dateTime': (datetime.now() + timedelta(hours=1)).isoformat(),
                    'timeZone': 'UTC'
                }
            }
            
            return {
                'celebration_created': True,
                'milestone': streak_days,
                'event_data': event_data
            }
        
        return {'celebration_created': False}
    
    def _get_success_tips(self, prediction_result: Dict) -> str:
        """Generate personalized tips based on ML prediction confidence"""
        
        if prediction_result['confidence'] == 'low':
            return """
• Start with just 2-3 minutes per day
• Set multiple phone reminders
• Link to an existing strong habit
• Find an accountability partner
• Track progress visually (calendar, app)
            """.strip()
        
        elif prediction_result['confidence'] == 'medium':
            return """
• Maintain consistent timing each day
• Prepare your environment in advance
• Celebrate small wins weekly
• Adjust difficulty if needed
• Review progress monthly
            """.strip()
        
        else:  # high confidence
            return """
• You're set up for success!
• Consider gradually increasing difficulty
• Help others with similar habits
• Document your success strategies
• Plan your next habit challenge
            """.strip()

# Example usage and integration with Express API
def integrate_with_habitflow_api():
    """Demonstrate API integration patterns"""
    
    # Simulated Express.js route integration
    api_integration_example = """
    // Express.js route example
    app.post('/api/integrations/google-calendar', async (req, res) => {
      const { habit_data, prediction_result } = req.body;
      
      try {
        const calendar = new GoogleCalendarIntegration();
        const result = await calendar.create_habit_reminder(habit_data, prediction_result);
        
        res.json({
          success: true,
          calendar_event_created: result.event_created,
          reminder_frequency: result.reminder_frequency,
          message: `Calendar reminders set based on ${prediction_result.confidence} confidence prediction`
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    """
    
    # React frontend integration
    react_integration_example = """
    // React component integration
    const handleHabitCreation = async (habitData) => {
      // Get ML prediction first
      const prediction = await fetch('/api/ml/predict', {
        method: 'POST',
        body: JSON.stringify(habitData)
      }).then(res => res.json());
      
      // Create calendar integration based on prediction
      if (prediction.success) {
        await fetch('/api/integrations/google-calendar', {
          method: 'POST',
          body: JSON.stringify({
            habit_data: habitData,
            prediction_result: prediction
          })
        });
        
        toast({
          title: "Smart Reminders Set!",
          description: `Calendar reminders created based on ${prediction.confidence} success probability`
        });
      }
    };
    """
    
    return {
        'express_integration': api_integration_example,
        'react_integration': react_integration_example
    }

def demonstrate_ml_calendar_flow():
    """Complete demonstration of ML-driven calendar integration"""
    
    print("="*60)
    print("GOOGLE CALENDAR + ML INTEGRATION DEMONSTRATION")
    print("="*60)
    
    calendar = GoogleCalendarIntegration()
    
    # Test scenarios with different ML predictions
    test_scenarios = [
        {
            'name': 'High-Risk Habit (Needs Support)',
            'habit': {
                'id': 1,
                'title': 'Morning Meditation',
                'category': 'mindfulness',
                'target_value': 20,
                'unit': 'minutes',
                'difficulty_score': 0.8
            },
            'prediction': {
                'success_probability': 0.25,
                'confidence': 'low',
                'percentage': '25.0%'
            }
        },
        {
            'name': 'Medium Success Habit',
            'habit': {
                'id': 2,
                'title': 'Read 10 Pages',
                'category': 'learning',
                'target_value': 10,
                'unit': 'pages',
                'difficulty_score': 0.5
            },
            'prediction': {
                'success_probability': 0.65,
                'confidence': 'medium',
                'percentage': '65.0%'
            }
        },
        {
            'name': 'High Success Habit',
            'habit': {
                'id': 3,
                'title': 'Drink Water',
                'category': 'health',
                'target_value': 1,
                'unit': 'glass',
                'difficulty_score': 0.2
            },
            'prediction': {
                'success_probability': 0.85,
                'confidence': 'high',
                'percentage': '85.0%'
            }
        }
    ]
    
    for scenario in test_scenarios:
        print(f"\n{scenario['name']}:")
        print(f"Habit: {scenario['habit']['title']}")
        print(f"ML Prediction: {scenario['prediction']['percentage']} ({scenario['prediction']['confidence']} confidence)")
        
        # Create calendar integration
        result = calendar.create_habit_reminder(scenario['habit'], scenario['prediction'])
        
        print(f"Calendar Integration:")
        print(f"  ✓ Reminder Frequency: {result['reminder_frequency']}")
        print(f"  ✓ Event Created: {result['event_created']}")
        print(f"  ✓ Smart Scheduling: Based on {scenario['prediction']['confidence']} confidence")
        
        # Test milestone celebration
        if scenario['name'] == 'High Success Habit':
            milestone = calendar.create_milestone_celebration(scenario['habit'], 7)
            if milestone['celebration_created']:
                print(f"  ✓ 7-day milestone celebration scheduled")
    
    print(f"\n{'='*60}")
    print("INTEGRATION BENEFITS DEMONSTRATED")
    print("="*60)
    print("✓ ML predictions drive calendar automation")
    print("✓ High-risk habits get intensive daily reminders")
    print("✓ Low-risk habits get minimal weekly check-ins")
    print("✓ Personalized motivational messages included")
    print("✓ Milestone celebrations automatically scheduled")
    print("✓ Integration ready for Google Calendar API")

if __name__ == "__main__":
    demonstrate_ml_calendar_flow()
    
    # Show integration examples
    print(f"\n{'='*60}")
    print("API INTEGRATION EXAMPLES")
    print("="*60)
    
    examples = integrate_with_habitflow_api()
    print("Express.js Backend Integration:")
    print(examples['express_integration'])
    
    print("\nReact Frontend Integration:")
    print(examples['react_integration'])