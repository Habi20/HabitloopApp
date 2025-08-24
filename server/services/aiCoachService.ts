import { Habit, HabitCompletion, Questionnaire } from '../../shared/schema';

// Enhanced coach services with context-aware prompts
export const coachServices = {
  progress_analysis: {
    title: "Progress Analysis",
    description: "Insight on your completion patterns and streaks",
    promptTemplate: (ctx: any) => `
You are an experienced habit coach analyzing user data. Provide personalized insights based on:

HABIT DATA:
- Total habits: ${ctx.habits.length}
- Habit details: ${ctx.habits.map((h: any) => `${h.title} (${h.frequency})`).join(", ")}

COMPLETION PATTERNS:
- Completions in last 7 days: ${ctx.recentCompletions.length}
- Current streaks: ${ctx.habits.map((h: any) => `${h.title}: ${ctx.streaks[h.id] || 0} days`).join("; ")}
- Completion rate: ${ctx.completionRate}%

USER PROFILE:
- Level: ${ctx.userLevel}
- Total XP: ${ctx.totalXP}
- Motivation type: ${ctx.questionnaire?.motivationType || 'Not specified'}

Provide a JSON response with:
1. A clear summary of their strongest habits and patterns
2. One specific, actionable suggestion to improve weaker habits
3. A motivational insight based on their overall consistency
4. A personalized tip based on their motivation type

Respond with JSON:
{
  "summary": "Brief analysis of their progress patterns",
  "suggestion": "One specific actionable improvement",
  "insight": "Motivational insight based on consistency",
  "tip": "Personalized tip based on motivation type"
}
`
  },

  motivation_boost: {
    title: "Motivation Boost",
    description: "Personalized motivation based on your goals",
    promptTemplate: (ctx: any) => `
You are a motivational coach. Based on the user's data:

CURRENT STATUS:
- Level: ${ctx.userLevel} (${ctx.totalXP} XP)
- Active habits: ${ctx.habits.length}
- Current streak: ${Math.max(...Object.values(ctx.streaks) as number[])} days
- Recent completions: ${ctx.recentCompletions.length} in last 7 days

GOALS & MOTIVATION:
- Primary goal: ${ctx.questionnaire?.primaryGoal || 'Not specified'}
- Motivation type: ${ctx.questionnaire?.motivationType || 'Not specified'}
- Biggest challenge: ${ctx.questionnaire?.biggestChallenge || 'Not specified'}

Provide a JSON response with:
1. A personalized motivational message
2. A specific reason why they should continue
3. A small, achievable next step
4. A reminder of their progress so far

Respond with JSON:
{
  "motivation": "Personalized motivational message",
  "reason": "Specific reason to continue",
  "nextStep": "Small, achievable next step",
  "progress": "Reminder of their progress"
}
`
  },

  habit_optimization: {
    title: "Habit Optimization",
    description: "Suggestions to improve your habit formation",
    promptTemplate: (ctx: any) => `
You are a habit optimization expert. Analyze the user's habit data:

HABIT ANALYSIS:
- Habit details: ${ctx.habits.map((h: any) => `${h.title} (${h.frequency})`).join("; ")}
- Completion patterns: ${ctx.completionPatterns}
- Streak data: ${ctx.habits.map((h: any) => `${h.title}: ${ctx.streaks[h.id] || 0} days`).join("; ")}
- Time of day patterns: ${ctx.timePatterns}

ENVIRONMENT:
- Schedule type: ${ctx.questionnaire?.scheduleType || 'Not specified'}
- Available time: ${ctx.questionnaire?.availableTime || 'Not specified'}
- Preferred time: ${ctx.questionnaire?.preferredTime || 'Not specified'}

Provide a JSON response with:
1. Analysis of which habits are working well
2. Specific optimization suggestions for struggling habits
3. Timing recommendations based on their schedule
4. One habit to focus on improving first

Respond with JSON:
{
  "workingHabits": "Analysis of successful habits",
  "optimizations": "Specific suggestions for improvement",
  "timing": "Timing recommendations",
  "focusHabit": "Which habit to prioritize"
}
`
  },

  weekly_planning: {
    title: "Weekly Planning",
    description: "Strategic planning for the week ahead",
    promptTemplate: (ctx: any) => `
You are a weekly planning coach. Based on the user's data:

CURRENT WEEK:
- Habits to maintain: ${ctx.habits.map((h: any) => h.title).join(", ")}
- Current streaks to protect: ${ctx.habits.filter((h: any) => (ctx.streaks[h.id] || 0) > 0).map((h: any) => `${h.title} (${ctx.streaks[h.id]} days)`).join(", ")}
- Recent challenges: ${ctx.recentChallenges}

UPCOMING WEEK:
- Schedule: ${ctx.questionnaire?.scheduleType || 'Not specified'}
- Available time: ${ctx.questionnaire?.availableTime || 'Not specified'}
- Goals: ${ctx.questionnaire?.primaryGoal || 'Not specified'}

Provide a JSON response with:
1. Weekly habit priorities
2. Specific daily targets
3. Potential obstacles and solutions
4. Weekly success metrics to track

Respond with JSON:
{
  "priorities": "Weekly habit priorities",
  "dailyTargets": "Specific daily targets",
  "obstacles": "Potential obstacles and solutions",
  "metrics": "Weekly success metrics to track"
}
`
  },

  obstacle_solving: {
    title: "Obstacle Solving",
    description: "Help overcome specific habit challenges",
    promptTemplate: (ctx: any) => `
You are an obstacle-solving coach. Analyze the user's challenges:

CURRENT CHALLENGES:
- Recent missed completions: ${ctx.recentMissedCompletions}
- Habit details: ${ctx.habits.map((h: any) => `${h.title} (${h.frequency})`).join("; ")}
- Streak breaks: ${ctx.streakBreaks}
- Time constraints: ${ctx.questionnaire?.availableTime || 'Not specified'}

CONTEXT:
- Motivation type: ${ctx.questionnaire?.motivationType || 'Not specified'}
- Biggest challenge: ${ctx.questionnaire?.biggestChallenge || 'Not specified'}
- Schedule type: ${ctx.questionnaire?.scheduleType || 'Not specified'}

Provide a JSON response with:
1. Root cause analysis of the obstacle
2. Three specific solutions to try
3. A mindset shift or perspective change
4. A small win to focus on

Respond with JSON:
{
  "rootCause": "Analysis of the obstacle",
  "solutions": "Three specific solutions to try",
  "mindset": "Mindset shift or perspective change",
  "smallWin": "A small win to focus on"
}
`
  }
};

// Enhanced context builder
function buildContext(habits: Habit[], completions: HabitCompletion[], questionnaire: Questionnaire, userLevel: number, totalXP: number) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentCompletions = completions.filter(c => new Date(c.completedAt) >= sevenDaysAgo);
  const streaks: Record<string, number> = {};
  
  // Calculate streaks for each habit
  habits.forEach(habit => {
    const habitCompletions = completions.filter(c => c.habitId === habit.id);
    let currentStreak = 0;
    let currentDate = new Date(now);
    
    while (true) {
      const hasCompletion = habitCompletions.some(c => {
        const completionDate = new Date(c.completedAt);
        return completionDate.toDateString() === currentDate.toDateString();
      });
      
      if (hasCompletion) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    streaks[habit.id] = currentStreak;
  });
  
  const completionRate = habits.length > 0 ? (recentCompletions.length / (habits.length * 7)) * 100 : 0;
  
  return {
    habits,
    completions,
    recentCompletions,
    streaks,
    completionRate: Math.round(completionRate),
    userLevel,
    totalXP,
    questionnaire,
    completionPatterns: recentCompletions.length > 0 ? 'Active' : 'Inactive',
    timePatterns: 'Morning focus', // Could be calculated from actual data
    recentChallenges: recentCompletions.length < habits.length * 3 ? 'Low completion rate' : 'Good progress',
    recentMissedCompletions: habits.length * 7 - recentCompletions.length,
    streakBreaks: Object.values(streaks).filter(s => s === 0).length
  };
}

// Enhanced AI Coach service
export async function generateServiceInsight(
  serviceId: keyof typeof coachServices, 
  context: {
    habits: Habit[];
    completions: HabitCompletion[];
    questionnaire: Questionnaire;
    userLevel: number;
    totalXP: number;
  }
) {
  const { promptTemplate } = coachServices[serviceId];
  const enhancedContext = buildContext(
    context.habits, 
    context.completions, 
    context.questionnaire,
    context.userLevel,
    context.totalXP
  );
  
  const prompt = promptTemplate(enhancedContext);

  try {
    // Import OpenAI dynamically to avoid circular dependencies
    const { default: OpenAI } = await import('openai');
    const { env } = await import('../env');
    
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
    });
    
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful AI habit coach. Always respond with valid JSON as requested." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });
    
    const content = res.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    return JSON.parse(content);
  } catch (e: any) {
    console.error(`AI insight failed for ${serviceId}`, e);
    
    // Fallback response
    return {
      error: "Unable to generate AI insight",
      fallback: `Here's a general tip for ${coachServices[serviceId].title.toLowerCase()}: Focus on consistency over perfection. Small daily actions compound into significant results.`
    };
  }
}

// Get available services
export function getAvailableServices() {
  return Object.entries(coachServices).map(([id, service]) => ({
    id,
    title: service.title,
    description: service.description
  }));
}
