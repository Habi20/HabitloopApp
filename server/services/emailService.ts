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
      from: 'habitloop-report@em6056.techversehublk.site', // Domain authenticated sender (RECOMMENDED)
      // from: 'akeel.lithan@gmail.com', // Single sender verification (fallback)
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

  static async sendWeeklyReport(to: string, stats: any, userData?: any) {
    if (!this.isConfigured()) {
      console.log('📧 Email simulation: Weekly report to', to, 'with stats:', stats);
      return { success: true, simulated: true };
    }

    // Try to generate AI-powered report
    let emailContent = '';
    let emailSubject = 'Your Weekly Habit Report';
    
    try {
      const { generateEmailReport } = await import('../openaiService');
      
      const reportData = {
        name: userData?.firstName || 'there',
        level: stats.level || 1,
        xp: stats.xp || 0,
        totalHabits: stats.totalHabits || 0,
        totalCompletions: stats.totalCompletions || 0,
        currentStreak: stats.currentStreak || 0,
        longestStreak: stats.longestStreak || 0,
        completionRate: stats.totalHabits > 0 ? Math.round((stats.totalCompletions / stats.totalHabits) * 100) : 0,
        recentHabits: stats.recentHabits || [],
        difficulty: stats.difficulty || userData?.difficulty || 'medium',
        role: stats.role || userData?.role || 'habitloop_user',
        emailSettings: stats.emailSettings || userData?.emailSettings || {}
      };

      console.log('📊 Email Report Data for AI:', JSON.stringify(reportData, null, 2));

      const aiReport = await generateEmailReport(reportData, 'weekly');
      emailSubject = aiReport.subject;
      emailContent = aiReport.content;
      
      console.log('🤖 AI-generated weekly report created successfully');
    } catch (error) {
      console.error('⚠️ AI report generation failed:', error);
      console.log('📊 Stats that caused failure:', JSON.stringify(stats, null, 2));
      console.log('👤 User data that caused failure:', JSON.stringify(userData, null, 2));
      
      // Fallback to original template
      emailContent = `
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
      `;
    }

    const msg = {
      to,
      from: 'habitloop-report@em6056.techversehublk.site', // Domain authenticated sender (RECOMMENDED)
      // from: 'akeel.lithan@gmail.com', // Single sender verification (fallback)
      subject: emailSubject,
      html: emailContent
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
      from: 'habitloop-report@em6056.techversehublk.site', // Domain authenticated sender (RECOMMENDED)
      // from: 'akeel.lithan@gmail.com', // Single sender verification (fallback)
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

  static async sendTestEmail(to: string, userData?: any) {
    if (!this.isConfigured()) {
      console.log('📧 Email simulation: Test email to', to);
      return { success: true, simulated: true, message: 'Email simulation mode - SendGrid not configured' };
    }

    // Try to generate AI-powered test email
    let emailContent = '';
    let emailSubject = 'HabitLoop Email Integration Test';
    
    try {
      const { generateEmailReport } = await import('../openaiService');
      
      const reportData = {
        name: userData?.firstName || 'there',
        level: userData?.level || 1,
        xp: userData?.xp || 0,
        totalHabits: userData?.totalHabits || 0,
        totalCompletions: userData?.totalCompletions || 0,
        currentStreak: userData?.currentStreak || 0,
        longestStreak: userData?.longestStreak || 0,
        completionRate: userData?.completionRate || 0,
        recentHabits: userData?.recentHabits?.map((h: string) => ({ title: h, category: 'General', completed: true })) || [],
        emailSettings: userData?.emailSettings || {}
      };

      console.log('📊 Email Test Data for AI:', JSON.stringify(reportData, null, 2));

      const aiReport = await generateEmailReport(reportData, 'weekly');
      emailSubject = aiReport.subject;
      emailContent = aiReport.content;
      
      console.log('🤖 AI-generated test email created successfully');
    } catch (error) {
      console.log('⚠️ AI test email generation failed, using fallback template:', (error as Error).message);
      console.log('📊 Email Test Data:', JSON.stringify({
        name: userData?.firstName,
        level: userData?.level,
        xp: userData?.xp,
        totalHabits: userData?.totalHabits,
        totalCompletions: userData?.totalCompletions,
        currentStreak: userData?.currentStreak,
        longestStreak: userData?.longestStreak,
        completionRate: userData?.completionRate
      }, null, 2));
      
      // Fallback to personalized template with real data
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366F1;">🎉 Welcome to HabitLoop, ${userData?.firstName || 'there'}!</h2>
          <p>Great! Your email integration is working perfectly. 🎉</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Current Progress:</h3>
            <p><strong>Level:</strong> ${userData?.level || 1} | <strong>XP:</strong> ${userData?.xp || 0}</p>
            <p><strong>Active Habits:</strong> ${userData?.totalHabits || 0}</p>
            <p><strong>Total Completions:</strong> ${userData?.totalCompletions || 0}</p>
            <p><strong>Current Streak:</strong> ${userData?.currentStreak || 0} days</p>
            <p><strong>Longest Streak:</strong> ${userData?.longestStreak || 0} days</p>
            <p><strong>Completion Rate:</strong> ${userData?.completionRate || 0}%</p>
            ${userData?.recentHabits?.length > 0 ? `<p><strong>Recent Habits:</strong> ${userData.recentHabits.join(', ')}</p>` : ''}
          </div>
          
          <div style="background-color: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">What You'll Receive:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>📅 <strong>Daily habit reminders</strong> at your preferred time</li>
              <li>📊 <strong>Weekly progress reports</strong> with detailed insights</li>
              <li>💪 <strong>Motivational messages</strong> to keep you inspired</li>
              <li>🤖 <strong>AI coaching insights</strong> personalized just for you</li>
              <li>🏆 <strong>Streak milestone celebrations</strong> when you achieve goals</li>
            </ul>
          </div>
          
          <p>Keep building those amazing habits! 💪</p>
        </div>
      `;
    }

    const msg = {
      to,
      from: 'habitloop-report@em6056.techversehublk.site', // Domain authenticated sender (RECOMMENDED)
      // from: 'akeel.lithan@gmail.com', // Single sender verification (fallback)
      subject: emailSubject,
      html: emailContent
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