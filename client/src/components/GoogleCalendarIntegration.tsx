import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CalendarIntegration {
  habit_id: number;
  habit_title: string;
  success_probability: string;
  confidence: string;
  reminder_frequency: string;
  calendar_event_created: boolean;
  next_reminder: string;
}

export function GoogleCalendarIntegration() {
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [integrationResults, setIntegrationResults] = useState<CalendarIntegration[]>([]);

  // Fetch user habits for integration
  const { data: habits = [] } = useQuery({
    queryKey: ['/api/habits'],
  });

  // Calendar integration mutation
  const calendarMutation = useMutation({
    mutationFn: async (habitData: any) => {
      // First get ML prediction
      const prediction = await apiRequest('/api/ml/predict', 'POST', {
        user_level: 5,
        user_xp: 1200,
        target_value: habitData.targetValue || 1,
        existing_habits_count: habits.length,
        difficulty_score: habitData.difficulty || 0.5,
        reminder_set: 1,
        category: habitData.category || 'general',
        frequency: habitData.frequency || 'daily'
      });

      // Create calendar integration
      const calendarResult = await apiRequest('/api/integrations/google-calendar', 'POST', {
        habit_data: habitData,
        prediction_result: prediction
      });

      return { ...calendarResult, habit_data: habitData, prediction };
    },
    onSuccess: (data) => {
      const newIntegration: CalendarIntegration = {
        habit_id: data.habit_data.id,
        habit_title: data.habit_data.title,
        success_probability: data.prediction.percentage || '0%',
        confidence: data.prediction.confidence || 'medium',
        reminder_frequency: data.reminder_frequency || 'daily',
        calendar_event_created: data.calendar_event_created || true,
        next_reminder: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()
      };
      
      setIntegrationResults(prev => [...prev, newIntegration]);
      setSelectedHabit(null);
    }
  });

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-red-100 text-red-800';
      case 'every_other_day': return 'bg-yellow-100 text-yellow-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          AI-powered calendar reminders based on habit success predictions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Habit Selection */}
        <div>
          <h4 className="font-medium mb-3">Select Habit for Calendar Integration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {habits.map((habit: any) => (
              <div
                key={habit.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedHabit?.id === habit.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedHabit(habit)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{habit.title}</span>
                  <Badge variant="secondary">{habit.category}</Badge>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Target: {habit.targetValue} {habit.unit} {habit.frequency}
                </div>
              </div>
            ))}
          </div>
          
          {selectedHabit && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => calendarMutation.mutate(selectedHabit)}
                disabled={calendarMutation.isPending}
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {calendarMutation.isPending ? 'Creating Integration...' : 'Create Smart Reminders'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedHabit(null)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Integration Results */}
        {integrationResults.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Active Calendar Integrations</h4>
            <div className="space-y-3">
              {integrationResults.map((integration, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{integration.habit_title}</h5>
                    <div className="flex items-center gap-2">
                      {getConfidenceIcon(integration.confidence)}
                      <span className="text-sm font-medium">
                        {integration.success_probability}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <Badge className={getFrequencyColor(integration.reminder_frequency)}>
                        {integration.reminder_frequency.replace('_', ' ')} reminders
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Next: {integration.next_reminder}
                    </div>
                    
                    {integration.calendar_event_created && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ✓ Calendar Events Created
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    ML Confidence: {integration.confidence} - 
                    {integration.confidence === 'low' && ' High-intensity daily support'}
                    {integration.confidence === 'medium' && ' Moderate every-other-day reminders'}
                    {integration.confidence === 'high' && ' Light weekly check-ins'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integration Benefits */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Smart Integration Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium">High-Risk Habits</div>
                <div className="text-gray-600">Daily reminders with motivational messages</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">High-Success Habits</div>
                <div className="text-gray-600">Weekly check-ins to maintain momentum</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <div className="font-medium">Milestone Celebrations</div>
                <div className="text-gray-600">Automatic events for 7, 30, 100-day streaks</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
              <div>
                <div className="font-medium">Adaptive Scheduling</div>
                <div className="text-gray-600">AI adjusts frequency based on success patterns</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}