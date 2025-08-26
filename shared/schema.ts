import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  date,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
// export const users = pgTable("users", {
//   id: varchar("id").primaryKey().notNull(),
//   email: varchar("email").unique(),
//   passwordHash: varchar("password_hash"),
//   firstName: varchar("first_name"),
//   lastName: varchar("last_name"),
//   profileImageUrl: varchar("profile_image_url"),
//   level: integer("level").default(1),
//   xp: integer("xp").default(0),
//   isGuest: boolean("is_guest").default(false),
//   questionnaire: jsonb("questionnaire"),
//   emailSettings: jsonb("email_settings"),
//   createdAt: timestamp("created_at").defaultNow(),
//   updatedAt: timestamp("updated_at").defaultNow(),
// });
export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  email: varchar('email').unique(),
  passwordHash: varchar('password_hash'), // ← Added
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  role: varchar('role').default('user'), // ← Added - This fixes the TypeScript errors
  level: integer('level').default(1),
  xp: integer('xp').default(0),
  isGuest: boolean('is_guest').default(false),
  questionnaire: jsonb('questionnaire'),
  aiRecommendations: jsonb('ai_recommendations'), // ← Added for AI recommendations
  emailSettings: jsonb('email_settings'),
  userSettings: jsonb('user_settings'), // ← Added for UI settings
  difficulty: varchar('difficulty').default('medium'), // ← Added
  supabaseAuthId: uuid('supabase_auth_id'), // ← Added for Supabase Auth integration
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  targetValue: integer("target_value").default(1),
  unit: varchar("unit").default("times"),
  reminderTime: varchar("reminder_time"),
  frequency: varchar("frequency").default("daily"), // daily, weekly, custom
  isActive: boolean("is_active").default(true),
  color: varchar("color").default("#6366F1"),
  icon: varchar("icon").default("fas fa-check"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  completedAt: date("completed_at").notNull(),
  value: integer("value").default(1),
  createdAt: timestamp("created_at"),
});

export const streaks = pgTable("streaks", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastCompletedAt: date("last_completed_at"),
  updatedAt: timestamp("updated_at"),
});

// Challenge completions table
export const challengeCompletions = pgTable("challenge_completions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeId: varchar("challenge_id").notNull(),
  xpAwarded: integer("xp_awarded").notNull(),
  completedAt: date("completed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  resetAt: date("reset_at"),
});

// Challenge progress tracking table
export const challengeProgress = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  challengeId: varchar("challenge_id").notNull(),
  progressValue: integer("progress_value").default(0),
  lastUpdated: date("last_updated").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ML predictions table
export const mlPredictions = pgTable("ml_predictions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  habitId: integer("habit_id").references(() => habits.id),
  predictionPercentage: integer("prediction_percentage").notNull(),
  confidenceLevel: varchar("confidence_level").default("low"),
  predictionDate: date("prediction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // suggestion, motivation, tip, coaching, celebration
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  priority: varchar("priority").default("normal"), // high, normal, low
  actionable: boolean("actionable").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coachingMessages = pgTable("coaching_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  habitId: integer("habit_id").references(() => habits.id),
  messageType: varchar("message_type").notNull(), // 'encouragement', 'streak_celebration', 'comeback', 'tip', 'milestone'
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  triggerData: jsonb("trigger_data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification system tables
export const notificationTypes = pgTable("notification_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  defaultPriority: integer("default_priority").default(2),
  icon: varchar("icon"),
  color: varchar("color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'inactivity', 'achievement', 'reminder', 'insight'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  severity: varchar("severity").notNull(), // 'low', 'medium', 'high'
  isRead: boolean("is_read").default(false),
  actionRequired: boolean("action_required").default(false),
  data: jsonb("data"),
  typeId: integer("type_id").references(() => notificationTypes.id),
  expiresAt: timestamp("expires_at"),
  priority: integer("priority").default(2),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  emailEnabled: boolean("email_enabled").default(true),
  pushEnabled: boolean("push_enabled").default(true),
  inAppEnabled: boolean("in_app_enabled").default(true),
  digestFrequency: varchar("digest_frequency").default("daily"), // never, daily, weekly
  mutedTypes: jsonb("muted_types").default([]),
  quietHoursStart: varchar("quiet_hours_start").default("22:00"),
  quietHoursEnd: varchar("quiet_hours_end").default("08:00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role: varchar('role').notNull(),
  permission: varchar('permission').notNull(),
});

export const userPermissions = pgTable('user_permissions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: varchar('permission').notNull(),
  grantedAt: timestamp('granted_at').defaultNow(),
  grantedBy: varchar('granted_by').references(() => users.id),
});



// Relations
export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
  habitCompletions: many(habitCompletions),
  streaks: many(streaks),
  aiInsights: many(aiInsights),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  completions: many(habitCompletions),
  streak: one(streaks),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [habitCompletions.userId],
    references: [users.id],
  }),
}));

export const streaksRelations = relations(streaks, ({ one }) => ({
  habit: one(habits, {
    fields: [streaks.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  user: one(users, {
    fields: [aiInsights.userId],
    references: [users.id],
  }),
}));

export const coachingMessagesRelations = relations(coachingMessages, ({ one }) => ({
  user: one(users, {
    fields: [coachingMessages.userId],
    references: [users.id],
  }),
  habit: one(habits, {
    fields: [coachingMessages.habitId],
    references: [habits.id],
  }),
}));

// Notification relations
export const notificationTypesRelations = relations(notificationTypes, ({ many }) => ({
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  type: one(notificationTypes, {
    fields: [notifications.typeId],
    references: [notificationTypes.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Add relations for RBAC
export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  grantedByUser: one(users, {
    fields: [userPermissions.grantedBy],
    references: [users.id],
  }),
}));


// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({
  id: true,
  createdAt: true,
});
export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;

export type Streak = typeof streaks.$inferSelect;
export type AIInsight = typeof aiInsights.$inferSelect;
export type CoachingMessage = typeof coachingMessages.$inferSelect;
export type InsertCoachingMessage = typeof coachingMessages.$inferInsert;

// Challenge types
export type ChallengeCompletion = typeof challengeCompletions.$inferSelect;
export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type MLPrediction = typeof mlPredictions.$inferSelect;

// Notification types
export type NotificationType = typeof notificationTypes.$inferSelect;
export type InsertNotificationType = typeof notificationTypes.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

export const questionnaireSchema = z.object({
  focusAreas: z.array(z.string()),
  motivationTime: z.string(),
  currentHabits: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  mood: z.string().optional(),
  motivationStyle: z.string().optional(),
  procrastinationTime: z.string().optional(),
  habitTime: z.string().optional(),
  missedHabitReaction: z.string().optional(),
  mainDistraction: z.string().optional(),
  checkInPreference: z.string().optional(),
  habitWhy: z.string().optional(),
  consistencyRating: z.number().min(1).max(5).optional(),
  habitDerailments: z.array(z.string()).optional(),
});
export type Questionnaire = z.infer<typeof questionnaireSchema>;
