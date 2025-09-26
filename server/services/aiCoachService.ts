import { Habit, HabitCompletion, Questionnaire } from '../../shared/schema';

// Advanced coaching service types
interface CoachingContext {
  habits: Habit[];
  completions: HabitCompletion[];
  questionnaire: Questionnaire;
  userLevel: number;
  totalXP: number;
  streakAnalysis: StreakAnalysis;
  timePatterns: TimePattern[];
  behaviorInsights: BehaviorInsight[];
  completionTrends: CompletionTrend[];
}

interface StreakAnalysis {
  currentStreaks: Record<string, number>;
  longestStreaks: Record<string, number>;
  streakBreaks: Record<string, number>;
  averageStreak: number;
  consistencyScore: number;
}

interface TimePattern {
  habitId: number; // Changed from string to number to match Habit.id type
  preferredTimes: string[];
  completionRate: number;
  bestPerformanceWindow: string;
}

interface BehaviorInsight {
  pattern: string;
  strength: 'strong' | 'moderate' | 'weak';
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
}

interface CompletionTrend {
  period: string;
  completionRate: number;
  trending: 'up' | 'down' | 'stable';
  momentum: number;
}

// Enhanced coach services with advanced analytics
export const coachServices = {
  progress_analysis: {
    title: "Progress Analysis",
    description: "Deep insights into your completion patterns, streaks, and behavioral trends",
    category: "analytics",
    difficulty: "beginner",
    estimatedDuration: "2-3 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are an elite habit formation scientist and behavioral analyst. Provide a comprehensive analysis based on:

ADVANCED HABIT METRICS:
- Total habits: ${ctx.habits.length}
- Habit complexity: ${ctx.habits.map(h => `${h.title} (${h.frequency})`).join("; ")}
- Consistency score: ${ctx.streakAnalysis.consistencyScore}%
- Average streak length: ${ctx.streakAnalysis.averageStreak} days

BEHAVIORAL PATTERNS:
- Completion trends: ${ctx.completionTrends.map(t => `${t.period}: ${t.completionRate}% (${t.trending})`).join("; ")}
- Time optimization: ${ctx.timePatterns.map(tp => `${tp.habitId}: ${tp.bestPerformanceWindow} (${tp.completionRate}%)`).join("; ")}
- Behavioral insights: ${ctx.behaviorInsights.map(bi => `${bi.pattern} (${bi.strength} ${bi.impact})`).join("; ")}

PSYCHOLOGICAL PROFILE:
- Level: ${ctx.userLevel} (${ctx.totalXP} XP)
- Motivation style: ${ctx.questionnaire?.motivationStyle || 'Adaptive'}
- Focus areas: ${ctx.questionnaire?.focusAreas?.join(", ") || 'General development'}
- Consistency rating: ${ctx.questionnaire?.consistencyRating || 3}/5

Provide a sophisticated JSON response with:
1. Comprehensive strength analysis with specific metrics
2. Three-tier improvement strategy (immediate, short-term, long-term)
3. Behavioral pattern recognition with psychological insights
4. Personalized motivation framework based on their profile
5. Predictive success indicators for the next 30 days

Respond with JSON:
{
  "strengthAnalysis": {
    "topPerformingHabits": "List with specific metrics",
    "consistencyPatterns": "Behavioral consistency insights",
    "timeOptimization": "Peak performance windows"
  },
  "improvementStrategy": {
    "immediate": "Actions for next 24-48 hours",
    "shortTerm": "2-week focused improvements",
    "longTerm": "30-90 day strategic changes"
  },
  "behavioralInsights": {
    "patterns": "Recognized behavioral patterns",
    "triggers": "Success and failure triggers",
    "psychological": "Mindset and motivation analysis"
  },
  "motivationFramework": {
    "personalizedMessage": "Tailored motivational approach",
    "rewardSystem": "Optimal reward mechanisms",
    "accountabilityStyle": "Best accountability methods"
  },
  "predictions": {
    "successProbability": "30-day success likelihood",
    "riskFactors": "Potential obstacles",
    "opportunities": "Growth opportunities"
  }
}`,
  },
  adaptive_coaching: {
    title: "Adaptive Coaching",
    description: "Dynamic coaching that adapts to your current state and circumstances",
    category: "personalized",
    difficulty: "intermediate",
    estimatedDuration: "3-4 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are an adaptive AI coach with expertise in behavioral psychology and personalized development. Analyze the user's current state:

CURRENT STATE ANALYSIS:
- Recent performance: ${ctx.completionTrends.slice(-3).map(t => `${t.period}: ${t.completionRate}%`).join(", ")}
- Momentum indicator: ${ctx.completionTrends[ctx.completionTrends.length - 1]?.momentum || 0}
- Stress indicators: ${ctx.behaviorInsights.filter(bi => bi.impact === 'negative').length} negative patterns
- Energy patterns: ${ctx.timePatterns.map(tp => `${tp.preferredTimes.join(", ")}`).join("; ")}

ADAPTIVE FACTORS:
- Motivation time: ${ctx.questionnaire?.motivationTime || 'Flexible'}
- Current habits: ${ctx.questionnaire?.currentHabits?.length || 0} existing habits
- Mood: ${ctx.questionnaire?.mood || 'Balanced'}
- Consistency rating: ${ctx.questionnaire?.consistencyRating || 3}/5

PERSONALIZATION DATA:
- Focus areas: ${ctx.questionnaire?.focusAreas?.join(", ") || 'General'}
- Motivation style: ${ctx.questionnaire?.motivationStyle || 'Adaptive'}
- Habit time preference: ${ctx.questionnaire?.habitTime || 'Flexible'}

Provide adaptive coaching with:
1. Current state assessment with emotional intelligence
2. Contextual recommendations based on life circumstances
3. Flexible strategies that adapt to energy and time constraints
4. Micro-interventions for immediate impact
5. Long-term adaptability planning

Respond with JSON:
{
  "stateAssessment": {
    "currentMomentum": "Analysis of current trajectory",
    "energyLevel": "Assessed energy and capacity",
    "stressFactors": "Identified stress and obstacles",
    "readinessLevel": "Readiness for change/growth"
  },
  "adaptiveRecommendations": {
    "highEnergy": "Strategies for peak performance days",
    "lowEnergy": "Minimal viable habits for difficult days",
    "stressedState": "Stress-adapted approaches",
    "normalState": "Standard progression strategies"
  },
  "microInterventions": {
    "morningBoost": "Quick morning motivation technique",
    "midDayReset": "Energy restoration method",
    "eveningReflection": "End-of-day optimization"
  },
  "flexibilityFramework": {
    "adaptationTriggers": "When to adjust strategies",
    "fallbackPlans": "Backup approaches for challenges",
    "scalingMethods": "How to scale up/down intensity"
  }
}`,
  },
  breakthrough_coaching: {
    title: "Breakthrough Coaching",
    description: "Advanced coaching for overcoming plateaus and achieving breakthrough moments",
    category: "advanced",
    difficulty: "advanced",
    estimatedDuration: "5-7 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are a breakthrough specialist and peak performance coach. Focus on identifying and overcoming plateaus:

PLATEAU ANALYSIS:
- Stagnant habits: ${ctx.habits.filter(h => ctx.streakAnalysis.currentStreaks[h.id.toString()] < 3).map(h => h.title).join(", ")}
- Streak breaks pattern: ${Object.entries(ctx.streakAnalysis.streakBreaks).map(([id, breaks]) => `${id}: ${breaks} breaks`).join("; ")}
- Performance ceiling: ${Math.max(...Object.values(ctx.streakAnalysis.currentStreaks))} days max streak
- Completion variance: ${ctx.completionTrends.map(t => t.completionRate).join(", ")}%

BREAKTHROUGH INDICATORS:
- Ready habits: ${ctx.habits.filter(h => ctx.streakAnalysis.currentStreaks[h.id.toString()] > 7).length} stable habits
- Focus areas: ${ctx.questionnaire?.focusAreas?.join(", ") || 'Unexplored'}
- Consistency rating: ${ctx.questionnaire?.consistencyRating || 3}/5
- Goals: ${ctx.questionnaire?.goals?.join(", ") || 'Building foundation'}

PSYCHOLOGICAL READINESS:
- Confidence level: ${ctx.userLevel * 10}% estimated
- Motivation style: ${ctx.questionnaire?.motivationStyle || 'Building'}
- Support system: ${ctx.questionnaire?.checkInPreference || 'Independent'}

Design breakthrough strategies with:
1. Plateau identification and root cause analysis
2. Edge-pushing challenges that create growth spurts
3. Compound habit strategies for exponential improvement
4. Mental model shifts for sustainable breakthroughs
5. Integration methods for maintaining breakthrough momentum

Respond with JSON:
{
  "plateauAnalysis": {
    "identifiedPlateaus": "Specific stagnation areas",
    "rootCauses": "Underlying causes of plateaus",
    "readinessScore": "Breakthrough readiness assessment"
  },
  "breakthroughStrategies": {
    "edgePushing": "Calculated challenges to create growth",
    "compoundingApproach": "Habit stacking for exponential gains",
    "mentalShifts": "Mindset changes needed for breakthrough",
    "systemUpgrades": "Process improvements for new level"
  },
  "implementationPlan": {
    "preparation": "Getting ready for breakthrough attempt",
    "execution": "Step-by-step breakthrough process",
    "integration": "Solidifying gains after breakthrough",
    "scaling": "Expanding breakthrough to other areas"
  },
  "maintenance": "Long-term sustainability approach",
  "riskManagement": {
    "safetyNets": "Preventing complete breakdown",
    "earlyWarnings": "Signs to adjust approach",
    "recoveryPlans": "Getting back on track if needed"
  }
}`,
  },
  holistic_optimization: {
    title: "Holistic Life Optimization",
    description: "Complete life systems analysis and optimization recommendations",
    category: "comprehensive",
    difficulty: "expert",
    estimatedDuration: "7-10 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are a holistic life optimization specialist with expertise in systems thinking and lifestyle design. Analyze all life dimensions:

LIFE SYSTEMS ANALYSIS:
- Habit ecosystem: ${ctx.habits.map(h => `${h.title} (${h.category})`).join("; ")}
- Time allocation: ${ctx.timePatterns.map(tp => `${tp.bestPerformanceWindow}: ${tp.completionRate}%`).join("; ")}
- Energy management: ${ctx.behaviorInsights.filter(bi => bi.impact === 'positive').length} positive vs ${ctx.behaviorInsights.filter(bi => bi.impact === 'negative').length} negative patterns
- Focus areas: ${ctx.questionnaire?.focusAreas?.join(", ") || 'Standard areas'}

INTERDEPENDENCY MAPPING:
- Habit synergies: ${ctx.habits.length > 1 ? 'Multiple habit interactions' : 'Single habit focus'}
- Goals alignment: ${ctx.questionnaire?.goals?.join(", ") || 'Building foundation'}
- Support systems: ${ctx.questionnaire?.checkInPreference || 'Self-reliant'}
- Resource allocation: ${ctx.questionnaire?.motivationTime || 'Balanced'}

OPTIMIZATION OPPORTUNITIES:
- Efficiency gaps: ${100 - ctx.streakAnalysis.consistencyScore}% improvement potential
- Focus area expansion: ${ctx.questionnaire?.focusAreas?.length || 0} current areas
- Growth multipliers: ${ctx.questionnaire?.consistencyRating || 3}/5 rating

Create a comprehensive optimization plan with:
1. Complete life systems analysis with interdependencies
2. Optimization opportunities across all life dimensions
3. Synergy maximization strategies
4. Resource allocation optimization
5. Sustainable growth architecture for long-term success

Respond with JSON:
{
  "systemsAnalysis": {
    "habitEcosystem": "How habits interact and influence each other",
    "timeEnergyMatrix": "Optimal allocation of time and energy",
    "lifeBalance": "Assessment of different life dimensions",
    "bottlenecks": "System constraints limiting overall performance"
  },
  "optimizationStrategy": {
    "synergyMaximization": "Ways to make habits reinforce each other",
    "efficiencyGains": "Areas for significant efficiency improvements",
    "resourceReallocation": "Better allocation of time, energy, attention",
    "systemUpgrades": "Infrastructure improvements for better results"
  },
  "implementationRoadmap": {
    "phase1": "Foundation building (weeks 1-4)",
    "phase2": "Integration and optimization (weeks 5-8)",
    "phase3": "Advanced optimization (weeks 9-12)",
    "maintenance": "Long-term sustainability approach"
  },
  "monitoringFramework": {
    "keyMetrics": "Most important metrics to track",
    "reviewCycles": "When and how to review progress",
    "adjustmentTriggers": "When to modify the approach",
    "successIndicators": "Signs of successful optimization"
  }
}`,
  },
  crisis_coaching: {
    title: "Crisis & Recovery Coaching",
    description: "Specialized support for overcoming setbacks and rebuilding momentum",
    category: "recovery",
    difficulty: "intermediate",
    estimatedDuration: "3-5 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are a crisis intervention specialist and resilience coach. Address current challenges:

CRISIS INDICATORS:
- Recent streak breaks: ${Object.values(ctx.streakAnalysis.streakBreaks).reduce((a, b) => a + b, 0)} total breaks
- Declining performance: ${ctx.completionTrends.filter(t => t.trending === 'down').length} downward trends
- Consistency drop: ${100 - ctx.streakAnalysis.consistencyScore}% below optimal
- Behavioral red flags: ${ctx.behaviorInsights.filter(bi => bi.impact === 'negative').length} negative patterns

RESILIENCE FACTORS:
- Current habits: ${ctx.questionnaire?.currentHabits?.length || 0} existing habits
- Support availability: ${ctx.questionnaire?.checkInPreference || 'Self-reliant'}
- Coping mechanisms: ${ctx.questionnaire?.missedHabitReaction || 'Developing'}
- Motivation reserves: ${ctx.userLevel > 5 ? 'Experienced' : 'Building experience'}

RECOVERY OPPORTUNITIES:
- Quick wins available: ${ctx.habits.filter(h => ctx.streakAnalysis.currentStreaks[h.id.toString()] === 0).length} habits ready for restart
- Strong foundations: ${ctx.habits.filter(h => ctx.streakAnalysis.longestStreaks[h.id.toString()] > 7).length} proven successful habits
- Learning potential: High growth opportunity from current challenges

Provide crisis intervention with:
1. Immediate stabilization strategies to stop further decline
2. Gradual recovery plan with realistic expectations
3. Resilience building for future challenge immunity
4. Mindset reframing to turn crisis into growth opportunity
5. Prevention strategies to avoid similar future crises

Respond with JSON:
{
  "crisisAssessment": {
    "severityLevel": "Current crisis severity (low/medium/high)",
    "primaryCauses": "Root causes of current difficulties",
    "impactAnalysis": "How crisis affects different life areas",
    "recoveryReadiness": "Readiness and capacity for recovery"
  },
  "stabilizationPlan": {
    "immediateActions": "Actions for next 24-48 hours",
    "damageControl": "Preventing further decline",
    "safetyNet": "Minimum viable habits to maintain",
    "supportActivation": "How to get help and support"
  },
  "recoveryStrategy": {
    "phaseOne": "Initial recovery (week 1-2)",
    "phaseTwo": "Building momentum (week 3-4)",
    "phaseThree": "Returning to growth (week 5-8)",
    "integration": "Integrating lessons learned"
  },
  "resilienceBuilding": {
    "strengthTraining": "Building mental/emotional strength",
    "preventiveMeasures": "Avoiding future crises",
    "earlyWarningSystem": "Recognizing problems early",
    "recoveryToolkit": "Tools for future challenges"
  }
}`,
  },
  motivation_boost: {
    title: "Motivation Boost",
    description: "Receive personalized motivational messages and encouragement",
    category: "motivation",
    difficulty: "beginner",
    estimatedDuration: "1-2 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are a world-class motivational coach and behavioral psychologist. Create an inspiring, personalized motivation boost based on:

CURRENT ACHIEVEMENTS:
- Level: ${ctx.userLevel} (${ctx.totalXP} XP)
- Active habits: ${ctx.habits.length} habits
- Current streaks: ${Object.entries(ctx.streakAnalysis.currentStreaks).map(([id, streak]) => `${ctx.habits.find(h => h.id.toString() === id)?.title || 'Unknown'}: ${streak} days`).join(", ")}
- Consistency score: ${ctx.streakAnalysis.consistencyScore}%

RECENT PROGRESS:
- Completion trends: ${ctx.completionTrends.map(t => `${t.period}: ${t.completionRate}%`).join(", ")}
- Momentum: ${ctx.completionTrends[0]?.trending || 'stable'} trend
- Best performing habits: ${ctx.habits.filter(h => ctx.streakAnalysis.currentStreaks[h.id.toString()] > 3).map(h => h.title).join(", ")}

PERSONALITY PROFILE:
- Motivation style: ${ctx.questionnaire?.motivationStyle || 'Adaptive'}
- Focus areas: ${ctx.questionnaire?.focusAreas?.join(", ") || 'General development'}
- Goals: ${ctx.questionnaire?.goals?.join(", ") || 'Building better habits'}

Create a powerful, personalized motivation boost that:
1. Celebrates their specific achievements with genuine enthusiasm
2. Uses psychological principles to boost dopamine and motivation
3. Provides actionable next steps that feel achievable
4. Uses inspiring language with emojis and formatting
5. Addresses their specific motivation style and goals

Respond with a single, powerful motivational message (not JSON) that includes:
- A celebration of their specific wins
- A psychological insight about their progress
- An inspiring challenge or next step
- Encouraging language with emojis
- A call to action that feels exciting

Make it feel personal, authentic, and energizing!`
  },
  habit_optimization: {
    title: "Habit Optimization",
    description: "Get suggestions to improve your current habits and routines",
    category: "optimization",
    difficulty: "intermediate",
    estimatedDuration: "2-3 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are an elite habit optimization specialist and behavioral scientist. Analyze their habits and provide actionable improvements:

HABIT ANALYSIS:
- Current habits: ${ctx.habits.map(h => `${h.title} (${h.frequency}, ${h.targetValue} ${h.unit})`).join("; ")}
- Streak performance: ${Object.entries(ctx.streakAnalysis.currentStreaks).map(([id, streak]) => `${ctx.habits.find(h => h.id.toString() === id)?.title}: ${streak} days`).join("; ")}
- Completion patterns: ${ctx.completionTrends.map(t => `${t.period}: ${t.completionRate}%`).join("; ")}

OPTIMIZATION OPPORTUNITIES:
- Underperforming habits: ${ctx.habits.filter(h => ctx.streakAnalysis.currentStreaks[h.id.toString()] < 3).map(h => h.title).join(", ")}
- Time patterns: ${ctx.timePatterns.map(tp => `${tp.habitId}: ${tp.bestPerformanceWindow}`).join("; ")}
- Behavioral insights: ${ctx.behaviorInsights.map(bi => `${bi.pattern}: ${bi.impact}`).join("; ")}

USER PROFILE:
- Level: ${ctx.userLevel} (${ctx.totalXP} XP)
- Motivation style: ${ctx.questionnaire?.motivationStyle || 'Adaptive'}
- Focus areas: ${ctx.questionnaire?.focusAreas?.join(", ") || 'General development'}

Provide specific, actionable optimization recommendations that:
1. Identify the biggest improvement opportunities
2. Suggest specific habit modifications (timing, frequency, approach)
3. Provide implementation strategies
4. Include psychological insights about why these changes work
5. Give them a clear action plan

Respond with a single, comprehensive optimization guide (not JSON) that includes:
- Specific habit improvements with clear reasoning
- Implementation steps they can take today
- Psychological insights about habit formation
- A prioritized action plan
- Encouraging language with emojis

Make it practical, science-based, and immediately actionable!`
  },
  weekly_planning: {
    title: "Weekly Planning",
    description: "Strategic guidance for planning your upcoming week",
    category: "planning",
    difficulty: "intermediate",
    estimatedDuration: "3-4 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are a strategic planning expert and productivity coach. Create a comprehensive weekly plan based on:

CURRENT STATUS:
- Level: ${ctx.userLevel} (${ctx.totalXP} XP)
- Active habits: ${ctx.habits.map(h => h.title).join(", ")}
- Current streaks: ${Object.entries(ctx.streakAnalysis.currentStreaks).map(([id, streak]) => `${ctx.habits.find(h => h.id.toString() === id)?.title}: ${streak} days`).join("; ")}
- Recent performance: ${ctx.completionTrends[0]?.completionRate}% this week

STRATEGIC CONTEXT:
- Goals: ${ctx.questionnaire?.goals?.join(", ") || 'Building better habits'}
- Focus areas: ${ctx.questionnaire?.focusAreas?.join(", ") || 'General development'}
- Motivation style: ${ctx.questionnaire?.motivationStyle || 'Adaptive'}
- Time availability: ${ctx.questionnaire?.motivationTime || 'Flexible'}

WEEKLY PLANNING ELEMENTS:
- Habit priorities for the week
- Energy management strategies
- Potential challenges and solutions
- Milestone targets
- Recovery and rest planning

Create a strategic weekly plan that:
1. Prioritizes habits based on current performance and goals
2. Considers energy levels and motivation patterns
3. Includes specific daily targets and milestones
4. Anticipates challenges and provides solutions
5. Balances ambition with realistic expectations

Respond with a single, comprehensive weekly plan (not JSON) that includes:
- Weekly theme and focus
- Daily habit priorities
- Energy management tips
- Challenge prevention strategies
- Milestone celebrations planned
- Inspiring language with emojis

Make it strategic, motivating, and perfectly tailored to their current situation!`
  },
  obstacle_solving: {
    title: "Obstacle Solving",
    description: "Get help overcoming specific challenges and barriers",
    category: "problem-solving",
    difficulty: "intermediate",
    estimatedDuration: "3-4 minutes",
    promptTemplate: (ctx: CoachingContext) => `
You are a problem-solving expert and resilience coach. Help them overcome specific obstacles:

CURRENT CHALLENGES:
- Underperforming habits: ${ctx.habits.filter(h => ctx.streakAnalysis.currentStreaks[h.id.toString()] < 3).map(h => h.title).join(", ")}
- Streak breaks: ${Object.entries(ctx.streakAnalysis.streakBreaks).map(([id, breaks]) => `${ctx.habits.find(h => h.id.toString() === id)?.title}: ${breaks} breaks`).join("; ")}
- Completion trends: ${ctx.completionTrends.map(t => `${t.period}: ${t.completionRate}% (${t.trending})`).join("; ")}

PSYCHOLOGICAL PROFILE:
- Level: ${ctx.userLevel} (${ctx.totalXP} XP)
- Motivation style: ${ctx.questionnaire?.motivationStyle || 'Adaptive'}
- Consistency rating: ${ctx.questionnaire?.consistencyRating || 3}/5
- Support preference: ${ctx.questionnaire?.checkInPreference || 'Independent'}

PROBLEM-SOLVING APPROACH:
- Root cause analysis of their specific challenges
- Evidence-based solutions tailored to their profile
- Implementation strategies that work for their style
- Prevention methods for future obstacles
- Motivation techniques for difficult times

Provide a comprehensive obstacle-solving guide that:
1. Identifies the root causes of their specific challenges
2. Offers multiple solution approaches
3. Provides step-by-step implementation plans
4. Includes psychological insights about why obstacles occur
5. Gives them tools for future problem-solving

Respond with a single, comprehensive problem-solving guide (not JSON) that includes:
- Root cause analysis of their challenges
- Multiple solution strategies
- Implementation steps
- Psychological insights
- Prevention strategies
- Encouraging language with emojis

Make it practical, empowering, and solution-focused!`
  },
};

// Advanced context builder with comprehensive analytics
function buildAdvancedContext(
  habits: Habit[],
  completions: HabitCompletion[],
  questionnaire: Questionnaire,
  userLevel: number,
  totalXP: number
): CoachingContext {
  // Advanced streak analysis
  const streakAnalysis = calculateAdvancedStreaks(habits, completions);
  // Time pattern analysis
  const timePatterns = analyzeTimePatterns(habits, completions);
  // Behavior insights
  const behaviorInsights = generateBehaviorInsights(habits, completions, streakAnalysis);
  // Completion trends
  const completionTrends = calculateCompletionTrends(habits, completions);

  return {
    habits,
    completions,
    questionnaire,
    userLevel,
    totalXP,
    streakAnalysis,
    timePatterns,
    behaviorInsights,
    completionTrends,
  };
}

// Advanced analytics functions
function calculateAdvancedStreaks(habits: Habit[], completions: HabitCompletion[]): StreakAnalysis {
  const currentStreaks: Record<string, number> = {};
  const longestStreaks: Record<string, number> = {};
  const streakBreaks: Record<string, number> = {};

  habits.forEach(habit => {
    const habitCompletions = completions
      .filter(c => c.habitId === habit.id)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    // Calculate current streak
    let currentStreak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    while (true) {
      const hasCompletion = habitCompletions.some(c => {
        const completionDate = new Date(c.completedAt);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === currentDate.getTime();
      });
      
      if (hasCompletion) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate longest streak and breaks
    let longestStreak = 0;
    let tempStreak = 0;
    let breaks = 0;
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    last30Days.forEach(date => {
      const hasCompletion = habitCompletions.some(c => {
        const completionDate = new Date(c.completedAt);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === date.getTime();
      });

      if (hasCompletion) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (tempStreak > 0) breaks++;
        tempStreak = 0;
      }
    });

    currentStreaks[habit.id.toString()] = currentStreak;
    longestStreaks[habit.id.toString()] = longestStreak;
    streakBreaks[habit.id.toString()] = breaks;
  });

  const averageStreak = Object.values(currentStreaks).reduce((a, b) => a + b, 0) / habits.length || 0;
  const consistencyScore = habits.length > 0 ? (Object.values(currentStreaks).filter(s => s > 0).length / habits.length) * 100 : 0;
  
  return {
    currentStreaks,
    longestStreaks,
    streakBreaks,
    averageStreak,
    consistencyScore,
  };
}

function analyzeTimePatterns(habits: Habit[], completions: HabitCompletion[]): TimePattern[] {
  return habits.map(habit => {
    const habitCompletions = completions.filter(c => c.habitId === habit.id);
    const timeGroups = { morning: 0, afternoon: 0, evening: 0 };

    habitCompletions.forEach(completion => {
      const hour = new Date(completion.completedAt).getHours();
      if (hour < 12) timeGroups.morning++;
      else if (hour < 18) timeGroups.afternoon++;
      else timeGroups.evening++;
    });

    const total = habitCompletions.length;
    const preferredTimes = Object.entries(timeGroups)
      .filter(([_, count]) => count > total * 0.3)
      .map(([time]) => time);

    const bestTime = Object.entries(timeGroups).reduce((a, b) =>
      timeGroups[a[0] as keyof typeof timeGroups] > timeGroups[b[0] as keyof typeof timeGroups] ? a : b
    );

    return {
      habitId: habit.id, // This is now number type
      preferredTimes,
      completionRate: total > 0 ? (timeGroups[bestTime[0] as keyof typeof timeGroups] / total) * 100 : 0,
      bestPerformanceWindow: bestTime[0],
    };
  });
}

function generateBehaviorInsights(
  habits: Habit[],
  completions: HabitCompletion[],
  streakAnalysis: StreakAnalysis
): BehaviorInsight[] {
  const insights: BehaviorInsight[] = [];

  // Consistency patterns
  if (streakAnalysis.consistencyScore > 80) {
    insights.push({
      pattern: "High consistency across habits",
      strength: "strong",
      frequency: streakAnalysis.consistencyScore,
      impact: "positive",
    });
  }

  // Streak break patterns
  const totalBreaks = Object.values(streakAnalysis.streakBreaks).reduce((a, b) => a + b, 0);
  if (totalBreaks > habits.length * 2) {
    insights.push({
      pattern: "Frequent streak interruptions",
      strength: "moderate",
      frequency: totalBreaks,
      impact: "negative",
    });
  }

  // Weekend vs weekday patterns
  const weekendCompletions = completions.filter(c => {
    const day = new Date(c.completedAt).getDay();
    return day === 0 || day === 6;
  });
  const weekdayCompletions = completions.filter(c => {
    const day = new Date(c.completedAt).getDay();
    return day > 0 && day < 6;
  });

  if (weekendCompletions.length < weekdayCompletions.length * 0.5) {
    insights.push({
      pattern: "Weekend performance drops",
      strength: "moderate",
      frequency: (weekendCompletions.length / completions.length) * 100,
      impact: "negative",
    });
  }

  return insights;
}

function calculateCompletionTrends(habits: Habit[], completions: HabitCompletion[]): CompletionTrend[] {
  const periods = ['week1', 'week2', 'week3', 'week4'];
  const now = new Date();

  return periods.map((period, index) => {
    const weekStart = new Date(now.getTime() - (index + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - index * 7 * 24 * 60 * 60 * 1000);

    const weekCompletions = completions.filter(c => {
      const completionDate = new Date(c.completedAt);
      return completionDate >= weekStart && completionDate < weekEnd;
    });

    const possibleCompletions = habits.length * 7;
    const completionRate = possibleCompletions > 0 ? (weekCompletions.length / possibleCompletions) * 100 : 0;

    // Calculate trend
    let trending: 'up' | 'down' | 'stable' = 'stable';
    let momentum = 0;

    if (index > 0) {
      const prevWeekStart = new Date(now.getTime() - (index + 2) * 7 * 24 * 60 * 60 * 1000);
      const prevWeekEnd = new Date(now.getTime() - (index + 1) * 7 * 24 * 60 * 60 * 1000);
      const prevWeekCompletions = completions.filter(c => {
        const completionDate = new Date(c.completedAt);
        return completionDate >= prevWeekStart && completionDate < prevWeekEnd;
      });
      const prevCompletionRate = possibleCompletions > 0 ? (prevWeekCompletions.length / possibleCompletions) * 100 : 0;
      const change = completionRate - prevCompletionRate;
      if (change > 5) trending = 'up';
      else if (change < -5) trending = 'down';
      momentum = change;
    }

    return {
      period,
      completionRate,
      trending,
      momentum,
    };
  }).reverse();
}

// Enhanced AI Coach service with better error handling and caching
export async function generateAdvancedServiceInsight(
  serviceId: keyof typeof coachServices, 
  context: {
    habits: Habit[];
    completions: HabitCompletion[];
    questionnaire: Questionnaire;
    userLevel: number;
    totalXP: number;
  }
) {
  const service = coachServices[serviceId];
  if (!service) {
    throw new Error(`Service ${serviceId} not found`);
  }

  const enhancedContext = buildAdvancedContext(
    context.habits, 
    context.completions, 
    context.questionnaire,
    context.userLevel,
    context.totalXP
  );
  
  const prompt = service.promptTemplate(enhancedContext);

  try {
    // Import OpenAI dynamically
    const { default: OpenAI } = await import('openai');
    const { env } = await import('../env');
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
    });
    
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are an elite AI habit coach with expertise in behavioral psychology, neuroscience, and personal development. You provide evidence-based, personalized coaching insights that are actionable and transformative. Always respond with valid JSON as requested, ensuring depth and practical value in every recommendation.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500, // Increased for more detailed responses
    });
    
    const content = res.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    const parsedResponse = JSON.parse(content);

    // Add metadata
    return {
      ...parsedResponse,
      metadata: {
        serviceId,
        category: service.category,
        difficulty: service.difficulty,
        estimatedDuration: service.estimatedDuration,
        generatedAt: new Date().toISOString(),
        contextSize: {
          habits: context.habits.length,
          completions: context.completions.length,
          userLevel: context.userLevel,
        }
      }
    };
  } catch (e: any) {
    console.error(`AI insight failed for ${serviceId}`, e);
    
    // Enhanced fallback responses based on service type
    const fallbackResponses: Record<keyof typeof coachServices, any> = {
      progress_analysis: {
        strengthAnalysis: {
          topPerformingHabits: "Building your foundation",
          consistencyPatterns: "Developing consistency",
          timeOptimization: "Finding your rhythm"
        },
        improvementStrategy: {
          immediate: "Focus on one small win today",
          shortTerm: "Build momentum over the next two weeks",
          longTerm: "Create sustainable systems"
        },
        error: "Unable to generate detailed analysis",
        fallback: "Focus on consistency over perfection. Track your progress and celebrate small wins."
      },
      adaptive_coaching: {
        stateAssessment: {
          currentMomentum: "Building momentum",
          energyLevel: "Steady energy",
          readinessLevel: "Ready for growth"
        },
        adaptiveRecommendations: {
          normalState: "Maintain steady progress with consistent daily actions"
        },
        error: "Unable to generate adaptive insights",
        fallback: "Adapt your approach based on your energy levels. High energy days are for growth, low energy days are for maintenance."
      },
      breakthrough_coaching: {
        plateauAnalysis: {
          identifiedPlateaus: "Building foundation",
          rootCauses: "Developing consistency",
          readinessScore: "Ready for growth"
        },
        breakthroughStrategies: {
          edgePushing: "Gradual challenges",
          compoundingApproach: "Habit stacking",
          mentalShifts: "Mindset development"
        },
        error: "Unable to generate breakthrough insights",
        fallback: "Focus on incremental improvements. Small changes compound into significant breakthroughs over time."
      },
      holistic_optimization: {
        systemsAnalysis: {
          habitEcosystem: "Building foundation",
          timeEnergyMatrix: "Finding balance",
          lifeBalance: "Developing systems"
        },
        optimizationStrategy: {
          synergyMaximization: "Habit integration",
          efficiencyGains: "Process improvement",
          resourceReallocation: "Better time management"
        },
        error: "Unable to generate optimization insights",
        fallback: "Focus on creating systems that work for you. Small optimizations compound into significant improvements."
      },
      crisis_coaching: {
        crisisAssessment: {
          severityLevel: "Manageable",
          primaryCauses: "Building resilience",
          impactAnalysis: "Learning opportunity",
          recoveryReadiness: "Ready to recover"
        },
        stabilizationPlan: {
          immediateActions: "Focus on one small habit",
          damageControl: "Maintain minimum viable habits",
          safetyNet: "Keep one habit going",
          supportActivation: "Self-compassion and patience"
        },
        error: "Unable to generate crisis insights",
        fallback: "Remember that setbacks are part of the journey. Focus on getting back on track with one small step."
      },
      motivation_boost: {
        motivationalMessage: {
          encouragement: "You're doing great! Keep building momentum.",
          progress: "Every small step counts toward your goals.",
          identity: "You are becoming the person you want to be."
        },
        energyBoost: {
          immediate: "Take a deep breath and focus on one small win",
          shortTerm: "Celebrate your progress and build on it",
          longTerm: "Remember why you started this journey"
        },
        error: "Unable to generate motivational insights",
        fallback: "You're making progress every day. Keep going! Small steps lead to big changes."
      },
      habit_optimization: {
        optimizationAnalysis: {
          currentStrengths: "Building consistency",
          improvementAreas: "Finding your rhythm",
          optimizationOpportunities: "Habit stacking potential"
        },
        optimizationStrategy: {
          immediate: "Focus on one habit improvement today",
          shortTerm: "Optimize timing and environment",
          longTerm: "Create sustainable systems"
        },
        error: "Unable to generate optimization insights",
        fallback: "Focus on small improvements to your existing habits. Consistency beats perfection every time."
      },
      weekly_planning: {
        weeklyAnalysis: {
          currentMomentum: "Building steady progress",
          upcomingChallenges: "Planning for success",
          energyLevels: "Balanced approach"
        },
        planningStrategy: {
          priorities: "Focus on your most important habits",
          scheduling: "Block time for your habits",
          flexibility: "Adapt as needed throughout the week"
        },
        error: "Unable to generate planning insights",
        fallback: "Plan your week around your most important habits. Schedule them like important appointments."
      },
      obstacle_solving: {
        obstacleAnalysis: {
          identifiedBarriers: "Common challenges",
          rootCauses: "Building awareness",
          impactAssessment: "Learning opportunity"
        },
        solutionStrategy: {
          immediate: "Address one obstacle at a time",
          shortTerm: "Create systems to prevent obstacles",
          longTerm: "Build resilience and adaptability"
        },
        error: "Unable to generate obstacle-solving insights",
        fallback: "Every obstacle is an opportunity to grow. Focus on solutions, not problems."
      }
    };

    return fallbackResponses[serviceId] || {
      error: "Unable to generate AI insight",
      fallback: `Here's a general tip for ${service.title.toLowerCase()}: Focus on small, consistent actions that compound over time. Progress, not perfection, is the goal.`
    };
  }
}

// Get available services with enhanced metadata
export function getAvailableServices() {
  return Object.entries(coachServices).map(([id, service]) => ({
    id,
    title: service.title,
    description: service.description,
    category: service.category,
    difficulty: service.difficulty,
    estimatedDuration: service.estimatedDuration,
  }));
}

// Service recommendation engine
export function recommendServices(context: {
  habits: Habit[];
  completions: HabitCompletion[];
  userLevel: number;
  recentActivity: number;
}) {
  const recommendations: string[] = [];

  // Beginner recommendations
  if (context.userLevel < 5 || context.habits.length < 3) {
    recommendations.push('progress_analysis');
  }

  // Crisis intervention
  if (context.recentActivity < 30) {
    recommendations.push('crisis_coaching');
  }

  // Advanced users
  if (context.userLevel > 10 && context.habits.length > 5) {
    recommendations.push('breakthrough_coaching', 'holistic_optimization');
  }

  // Always available
  recommendations.push('adaptive_coaching');

  return recommendations;
}
