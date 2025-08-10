// server/emailService.ts
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { storage } from './storage';

interface EmailIntegrationConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
}

export class EmailService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async setupEmailIntegration(userId: string, config: EmailIntegrationConfig): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: config.refreshToken,
        access_token: config.accessToken
      });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.getProfile({ userId: 'me' });

      // Fixed: Use upsertUser instead of updateUser
      await storage.upsertUser({
        id: userId,
        emailSettings: config
      });

      return true;
    } catch (error) {
      console.error('Email integration setup failed:', error);
      return false;
    }
  }

  async sendDailyHabitReminder(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return false;
      }

      // Fixed: Add proper type checking and validation for emailSettings
      if (!user.emailSettings || typeof user.emailSettings !== 'object') {
        console.log('User email settings not configured');
        return false;
      }

      // Type assertion with runtime validation
      const emailSettings = user.emailSettings as EmailIntegrationConfig;
      if (!emailSettings.clientId || !emailSettings.clientSecret || !emailSettings.refreshToken) {
        console.log('Incomplete email settings configuration');
        return false;
      }

      const habits = await storage.getUserHabits(userId);
      const today = new Date().toISOString().split('T')[0];
      const completions = await storage.getHabitCompletions(userId);
      const todayCompletions = completions.filter(c => c.completedAt === today);

      const pendingHabits = habits.filter(habit => 
        !todayCompletions.some(completion => completion.habitId === habit.id)
      );

      if (pendingHabits.length === 0) {
        return true;
      }

      const habitList = pendingHabits.map(habit => 
        `• ${habit.title} (${habit.category})`
      ).join('\n');

      const emailContent = `Hi there! Here's your daily habit checklist:

${habitList}

Remember: Small consistent actions lead to extraordinary results! 💪

You're receiving this because you enabled daily reminders in your habit tracker.`;

      // Fixed: Add null check for user.email
      if (user.email) {
        await this.sendEmail(user.email, 'Daily Habit Reminder', emailContent, emailSettings);
      }
      return true;
    } catch (error) {
      console.error('Failed to send daily reminder:', error);
      return false;
    }
  }

  async sendWeeklyProgressReport(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return false;
      }

      // Fixed: Add proper type checking and validation for emailSettings
      if (!user.emailSettings || typeof user.emailSettings !== 'object') {
        console.log('User email settings not configured');
        return false;
      }

      const emailSettings = user.emailSettings as EmailIntegrationConfig;
      if (!emailSettings.clientId || !emailSettings.clientSecret || !emailSettings.refreshToken) {
        console.log('Incomplete email settings configuration');
        return false;
      }

      const habits = await storage.getUserHabits(userId);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const completions = await storage.getHabitCompletions(userId);
      const weeklyCompletions = completions.filter(c => 
        new Date(c.completedAt) >= oneWeekAgo
      );

      const habitStats = habits.map(habit => {
        const habitCompletions = weeklyCompletions.filter(c => c.habitId === habit.id);
        return {
          title: habit.title,
          completions: habitCompletions.length,
          percentage: Math.round((habitCompletions.length / 7) * 100)
        };
      });

      const totalCompletions = weeklyCompletions.length;
      const totalPossible = habits.length * 7;
      const overallPercentage = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

      const reportContent = `Weekly Habit Progress Report

Overall Progress: ${overallPercentage}% (${totalCompletions}/${totalPossible} habits completed)

Individual Habit Performance:
${habitStats.map(stat => 
  `• ${stat.title} - ${stat.completions} completions (${stat.percentage}%)`).join('\n')}

Keep up the great work! Consistency is the key to building lasting habits.`;

      if (user.email) {
        await this.sendEmail(user.email, 'Weekly Habit Progress Report', reportContent, emailSettings);
      }
      return true;
    } catch (error) {
      console.error('Failed to send weekly report:', error);
      return false;
    }
  }

  async sendPersonalizedInsight(userId: string, insight: any): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return false;
      }

      // Fixed: Add proper type checking for emailSettings
      if (!user.emailSettings || typeof user.emailSettings !== 'object') {
        return false;
      }

      const emailSettings = user.emailSettings as EmailIntegrationConfig;
      if (!emailSettings.clientId || !emailSettings.clientSecret || !emailSettings.refreshToken) {
        return false;
      }

      const insightContent = `${insight.title}

${insight.content}

This personalized insight was generated based on your habit patterns and progress.`;

      if (user.email) {
        await this.sendEmail(user.email, `Habit Insight: ${insight.title}`, insightContent, emailSettings);
      }
      return true;
    } catch (error) {
      console.error('Failed to send insight:', error);
      return false;
    }
  }

  async sendStreakCelebration(userId: string, habitTitle: string, streakDays: number): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return false;
      }

      // Fixed: Add proper type checking for emailSettings
      if (!user.emailSettings || typeof user.emailSettings !== 'object') {
        return false;
      }

      const emailSettings = user.emailSettings as EmailIntegrationConfig;
      if (!emailSettings.clientId || !emailSettings.clientSecret || !emailSettings.refreshToken) {
        return false;
      }

      const celebrationContent = `🎉 Congratulations on Your ${streakDays}-Day Streak! 🎉

${habitTitle}

You've maintained this habit for ${streakDays} consecutive days! This is the power of consistency in action.

"Success is the sum of small efforts repeated day in and day out."`;

      if (user.email) {
        await this.sendEmail(user.email, `🎉 ${streakDays}-Day Streak Achievement!`, celebrationContent, emailSettings);
      }
      return true;
    } catch (error) {
      console.error('Failed to send streak celebration:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    try {
      const welcomeContent = `Welcome to HabitLoop, ${userName}!

Great news! Your Gmail integration is working perfectly. You'll now receive:

• Daily habit reminders
• Weekly progress reports  
• Personalized insights and tips
• Streak celebrations and achievements

You can manage your email preferences anytime in the app settings.`;

      // Fixed: Use createTransport instead of createTransporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userEmail,
        subject: 'Welcome to HabitLoop!',
        text: welcomeContent
      });

      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  private async sendEmail(to: string, subject: string, content: string, emailSettings: EmailIntegrationConfig): Promise<void> {
    this.oauth2Client.setCredentials({
      refresh_token: emailSettings.refreshToken,
      access_token: emailSettings.accessToken
    });

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const emailLines = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      content
    ];

    const email = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
  }
}

export const emailService = new EmailService();
