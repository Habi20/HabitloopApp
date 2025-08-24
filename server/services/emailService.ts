import sgMail from '@sendgrid/mail';
import { env } from '../env';

// Initialize SendGrid with API key (handle missing key gracefully)
const apiKey = env.SENDGRID_API_KEY;
if (apiKey && apiKey.startsWith('SG.') && apiKey !== 'SG.placeholder-key-for-development') {
  sgMail.setApiKey(apiKey);
} else {
  console.warn('⚠️ SendGrid API key not configured properly. Email features will be disabled.');
}

export class EmailService {
  private static isConfigured(): boolean {
    return !!(apiKey && apiKey.startsWith('SG.') && apiKey !== 'SG.placeholder-key-for-development');
  }

  static async sendHabitReminder(to: string, habitName: string) {
    if (!this.isConfigured()) {
      console.log('📧 Email simulation: Habit reminder for', habitName, 'to', to);
      return { success: true, simulated: true };
    }

    const msg = {
      to,
      from: 'akeel.lithan@gmail.com', // Always use verified sender
      subject: 'Habit Reminder - ' + habitName,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366F1;">Don't forget your habit!</h2>
          <p>Time to complete: <strong>${habitName}</strong></p>
          <p>Keep up the great work! 🚀</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280;">
              "The only bad workout is the one that didn't happen."
            </p>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }
  }

  static async sendWeeklyReport(to: string, stats: any) {
    if (!this.isConfigured()) {
      console.log('📧 Email simulation: Weekly report to', to, 'with stats:', stats);
      return { success: true, simulated: true };
    }

    const msg = {
      to,
      from: 'akeel.lithan@gmail.com', // Always use verified sender
      subject: 'Your Weekly Habit Report',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366F1;">Weekly Habit Report</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Progress This Week</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h4 style="margin: 0; color: #6b7280;">Total Habits</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #6366F1;">${stats.totalHabits}</p>
              </div>
              <div>
                <h4 style="margin: 0; color: #6b7280;">Completions</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #10B981;">${stats.totalCompletions}</p>
              </div>
              <div>
                <h4 style="margin: 0; color: #6b7280;">Current Streak</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #F59E0B;">${stats.currentStreak}</p>
              </div>
              <div>
                <h4 style="margin: 0; color: #6b7280;">Level</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 5px 0; color: #8B5CF6;">${stats.level}</p>
              </div>
            </div>
          </div>
          <p>Keep up the amazing work! Every small step counts towards your goals. 💪</p>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Weekly report send error:', error);
      return { success: false, error };
    }
  }

  static async sendMotivationalMessage(to: string, message: string) {
    if (!this.isConfigured()) {
      console.log('📧 Email simulation: Motivational message to', to, ':', message);
      return { success: true, simulated: true };
    }

    const msg = {
      to,
      from: 'akeel.lithan@gmail.com', // Always use verified sender
      subject: 'Your Daily Motivation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366F1;">Daily Motivation</h2>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 0; font-style: italic; color: #92400E;">"${message}"</p>
          </div>
          <p>You've got this! 🌟</p>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Motivational message send error:', error);
      return { success: false, error };
    }
  }

  static async sendTestEmail(to: string) {
    if (!this.isConfigured()) {
      console.log('📧 Email simulation: Test email to', to);
      return { success: true, simulated: true, message: 'Email simulation mode - SendGrid not configured' };
    }

    const msg = {
      to,
      from: 'akeel.lithan@gmail.com', // Always use verified sender
              subject: 'HabitLoop Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366F1;">Email Integration Test</h2>
          <p>Great! Your email integration is working perfectly. 🎉</p>
          <p>You'll now receive:</p>
          <ul>
            <li>Daily habit reminders</li>
            <li>Weekly progress reports</li>
            <li>Motivational messages</li>
            <li>AI coaching insights</li>
          </ul>
          <p>Keep building those amazing habits! 💪</p>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Test email send error:', error);
      return { success: false, error };
    }
  }
}