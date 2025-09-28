# HabitLoop Title System Documentation

## Overview
The title system in HabitLoop provides motivational achievement titles based on user level and progress. Titles are displayed in the Profile page and serve as gamification elements to encourage user engagement.

## Title Determination Logic

### Current Implementation (Profile.tsx)
```typescript
{user?.level >= 5 ? 'Habit Master!' : 
 user?.level >= 3 ? 'Leveling Up!' : 
 'Getting Started!'}
```

### Title Tiers

| Level Range | Title | Description |
|-------------|-------|-------------|
| 1-2 | "Getting Started!" | New users beginning their habit journey |
| 3-4 | "Leveling Up!" | Users showing consistent progress |
| 5+ | "Habit Master!" | Experienced users with strong habit formation |

## How Levels Are Calculated

### XP System
- **Base XP per completion**: 10 XP
- **Streak bonus**: +2 XP per consecutive day
- **Level requirements**: 100 XP per level
- **Formula**: `Level = Math.floor(totalXP / 100) + 1`

### Level Progression
- **Level 1**: 0-99 XP (Getting Started!)
- **Level 2**: 100-199 XP (Getting Started!)
- **Level 3**: 200-299 XP (Leveling Up!)
- **Level 4**: 300-399 XP (Leveling Up!)
- **Level 5**: 400+ XP (Habit Master!)

## Visual Design

### Display Location
- **Primary**: Profile page achievement section
- **Secondary**: User dashboard (if implemented)

### Styling
```css
.text-green-600.text-xl /* Star emoji */
.text-green-800.font-semibold.text-lg /* Title text */
.text-green-700.font-medium.text-sm /* Description */
```

## Future Enhancement Ideas

### Additional Title Tiers
- **Level 10+**: "Habit Legend!" 
- **Level 15+**: "Habit Champion!"
- **Level 20+**: "Habit Guru!"

### Special Achievement Titles
- **Perfect Week**: Complete all habits for 7 consecutive days
- **Streak Master**: Maintain 30+ day streak
- **Category Expert**: Excel in specific habit categories
- **Consistency King**: 90%+ completion rate for 30 days

### Dynamic Titles
- **Time-based**: "Morning Warrior" (completes habits before 9 AM)
- **Category-based**: "Health Hero" (excels in health habits)
- **Consistency-based**: "Steady Eddie" (maintains consistent progress)

## Implementation Notes

### Data Sources
- **User Level**: From `user.level` (calculated from XP)
- **XP Points**: From `user.xp` (accumulated from completions)
- **Streak Data**: From analytics API for additional context

### Performance Considerations
- Titles are calculated client-side for immediate display
- No additional API calls required
- Cached with user data for efficiency

## VIVA Presentation Points

### Key Features to Highlight
1. **Gamification**: Level-based progression system
2. **Motivation**: Achievement titles encourage continued engagement
3. **Visual Feedback**: Clear visual indicators of progress
4. **Scalable Design**: Easy to add new title tiers

### Demo Flow
1. Show Profile page with current title
2. Explain level calculation (XP system)
3. Demonstrate how titles change with level progression
4. Highlight the motivational aspect for user retention

## Technical Implementation

### Files Modified
- `client/src/pages/Profile.tsx` (lines 250-252)
- `server/routes/authRoutes.ts` (XP calculation logic)
- `server/routes/habitRoutes.ts` (XP awarding on completion)

### Dependencies
- User authentication context
- XP calculation system
- Level progression logic
- Analytics data for additional context
