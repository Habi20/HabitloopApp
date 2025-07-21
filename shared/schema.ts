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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User authentication table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  isGuest: boolean("is_guest").default(false),
  questionnaire: jsonb("questionnaire"),
  emailSettings: jsonb("email_settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User sessions table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const habitCompletions = pgTable("habit_completions", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  completedAt: date("completed_at").notNull(),
  value: integer("value").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streaks = pgTable("streaks", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastCompletedAt: date("last_completed_at"),
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
