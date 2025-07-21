import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { storage } from './storage';

interface EmailSettings {
  dailyReminders: boolean;
  weeklyProgress: boolean;
  aiInsights: boolean;
  streakMilestones: boolean;
  motivationalMessages: boolean;
}

interface UserEmailData {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  settings: EmailSettings;
}

class EmailService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com/api/email/callback'
        : 'http://127.0.0.1:5000/api/email/callback'
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async exchangeCodeForTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      
      if (!tokens || !tokens.access_token) {
        throw new Error('No valid tokens received from Google');
      }
      
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  async getUserEmail(accessToken: string): Promise<string> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    return userInfo.data.email || '';
  }

  async createTransporter(accessToken: string, refreshToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: await this.getUserEmail(accessToken),
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: refreshToken,
        accessToken: accessToken
      }
    });

    return transporter;
  }

  async sendHabitReminder(userEmail: UserEmailData, habits: any[]) {
    try {
      const transporter = await this.createTransporter(userEmail.accessToken, userEmail.refreshToken);
      
      const habitList = habits.map(habit => 
        `• ${habit.title} (${habit.targetValue} ${habit.unit})`
      ).join('\n');

      const mailOptions = {
        from: userEmail.email,
        to: userEmail.email,
        subject: `🎯 Daily Habit Reminder - ${new Date().toLocaleDateString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366F1;">Time for Your Daily Habits!</h2>
            
            <p>Hi there! Here's your daily habit checklist:</p>
            
            <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Today's Habits:</h3>
              <pre style="font-family: inherit; white-space: pre-wrap;">${habitList}</pre>
            </div>
            
            <p>Remember: Small consistent actions lead to extraordinary results! 💪</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}" target="_blank" rel="noopener noreferrer" 
                 style="background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Complete Your Habits
              </a>
            </div>
            
            <p style="color: #6B7280; font-size: 14px;">
              You're receiving this because you enabled daily reminders in your habit tracker.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending habit reminder:', error);
      throw error;
    }
  }

  async sendWeeklyProgress(userEmail: UserEmailData, progressData: any) {
    try {
      const transporter = await this.createTransporter(userEmail.accessToken, userEmail.refreshToken);
      
      const { totalHabits, completedHabits, completionRate, topHabits, streaks } = progressData;

      const mailOptions = {
        from: userEmail.email,
        to: userEmail.email,
        subject: `📊 Weekly Progress Report - ${completionRate}% Completion`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Your Weekly Habit Progress 📈</h2>
            
            <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin-top: 0;">This Week's Summary</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;">🎯 Total Habits: ${totalHabits}</li>
                <li style="margin: 10px 0;">✅ Completed: ${completedHabits}</li>
                <li style="margin: 10px 0;">📊 Completion Rate: ${completionRate}%</li>
              </ul>
            </div>
            
            ${topHabits.length > 0 ? `
            <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #D97706; margin-top: 0;">🏆 Top Performing Habits</h3>
              ${topHabits.map((habit: any) => `<p>• ${habit.title} - ${habit.completions} completions</p>`).join('')}
            </div>
            ` : ''}
            
            <p>Keep up the great work! Consistency is the key to building lasting habits.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}" target="_blank" rel="noopener noreferrer" 
                 style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Full Stats
              </a>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending weekly progress:', error);
      throw error;
    }
  }

  async sendAIInsight(userEmail: UserEmailData, insight: any) {
    try {
      const transporter = await this.createTransporter(userEmail.accessToken, userEmail.refreshToken);

      const mailOptions = {
        from: userEmail.email,
        to: userEmail.email,
        subject: `🧠 AI Coaching Insight: ${insight.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B5CF6;">AI Coaching Insight 🧠</h2>
            
            <div style="background: #FAF5FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #7C3AED; margin-top: 0;">${insight.title}</h3>
              <div style="line-height: 1.6;">
                ${insight.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <p>This personalized insight was generated based on your habit patterns and progress.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}" target="_blank" rel="noopener noreferrer" 
                 style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Get More Insights
              </a>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending AI insight:', error);
      throw error;
    }
  }

  async sendStreakMilestone(userEmail: UserEmailData, habitTitle: string, streakDays: number) {
    try {
      const transporter = await this.createTransporter(userEmail.accessToken, userEmail.refreshToken);

      const milestoneEmoji = streakDays >= 100 ? '🏆' : streakDays >= 30 ? '🥇' : streakDays >= 14 ? '🥈' : '🥉';
      const celebrationMessage = streakDays >= 100 ? 'LEGENDARY' : streakDays >= 30 ? 'AMAZING' : streakDays >= 14 ? 'FANTASTIC' : 'GREAT';

      const mailOptions = {
        from: userEmail.email,
        to: userEmail.email,
        subject: `${milestoneEmoji} Streak Milestone: ${streakDays} Days!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
            <h1 style="color: #F59E0B; font-size: 36px;">${milestoneEmoji}</h1>
            <h2 style="color: #374151;">${celebrationMessage} ACHIEVEMENT!</h2>
            
            <div style="background: #FEF3C7; padding: 30px; border-radius: 12px; margin: 20px 0;">
              <h3 style="color: #D97706; margin-top: 0; font-size: 24px;">
                ${streakDays} Day Streak
              </h3>
              <p style="font-size: 18px; color: #92400E; margin: 0;">
                ${habitTitle}
              </p>
            </div>
            
            <p style="font-size: 16px;">
              You've maintained this habit for ${streakDays} consecutive days! This is the power of consistency in action.
            </p>
            
            <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #059669; font-weight: bold; margin: 0;">
                "Success is the sum of small efforts repeated day in and day out."
              </p>
            </div>
            
            <div style="margin: 30px 0;">
              <a href="${process.env.APP_URL}" target="_blank" rel="noopener noreferrer" 
                 style="background: #F59E0B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px;">
                Keep the Streak Going!
              </a>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending streak milestone:', error);
      throw error;
    }
  }

  async sendTestEmail(userEmail: UserEmailData) {
    try {
      const transporter = await this.createTransporter(userEmail.accessToken, userEmail.refreshToken);

      const mailOptions = {
        from: userEmail.email,
        to: userEmail.email,
        subject: '✅ Email Integration Test - Success!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Email Integration Working! ✅</h2>
            
            <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #059669; margin: 0;">
                Great news! Your Gmail integration is working perfectly. You'll now receive:
              </p>
              <ul style="color: #059669;">
                <li>Daily habit reminders</li>
                <li>Weekly progress reports</li>
                <li>AI coaching insights</li>
                <li>Streak milestone celebrations</li>
                <li>Motivational messages</li>
              </ul>
            </div>
            
            <p>You can manage your email preferences anytime in the app settings.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL}" target="_blank" rel="noopener noreferrer" 
                 style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Go to App
              </a>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();