// server/routes/emailRoutes.ts
import { Router } from "express";
import { requireAuth } from "./middlewareRoutes";
import { storage } from "../storage";

// Define proper types for email settings
interface EmailSettings {
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  preferences?: EmailPreferences;
}

interface EmailPreferences {
  dailyReminders: boolean;
  weeklyProgress: boolean;
  aiInsights: boolean;
  streakMilestones: boolean;
  motivationalMessages: boolean;
}

export function emailRoutes() {
  const router = Router();
  const getUserId = (req: any) => req.user.id;

  // Email integration status
  router.get('/status', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Fixed: Add null check for user
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const emailSettings = user.emailSettings as EmailSettings | undefined;
      
      if (emailSettings?.accessToken) {
        res.json({ 
          connected: true, 
          email: user.email || emailSettings.email 
        });
      } else {
        res.json({ connected: false });
      }
    } catch (error) {
      console.error("Error checking email status:", error);
      res.status(500).json({ message: "Failed to check email status" });
    }
  });

  // Get email settings
  router.get('/settings', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Fixed: Add null check for user
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const emailSettings = user.emailSettings as EmailSettings | undefined;
      
      res.json(emailSettings?.preferences || {
        dailyReminders: false,
        weeklyProgress: false,
        aiInsights: false,
        streakMilestones: false,
        motivationalMessages: false,
      });
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  // Connect email
  router.post('/connect', requireAuth, async (_req: any, res) => {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({
          message: "Gmail integration requires Google OAuth credentials. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        });
      }

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email/callback')}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email')}&` +
        `access_type=offline&` +
        `prompt=consent`;

      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({ message: "Failed to generate authorization URL" });
    }
  });

  // Update email settings
  router.put('/settings', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const settings = req.body;
      
      const user = await storage.getUser(userId);
      if (user) {
        const currentEmailSettings = (user.emailSettings as EmailSettings) || {};
        const updatedEmailSettings: EmailSettings = {
          ...currentEmailSettings,
          preferences: {
            ...currentEmailSettings.preferences,
            ...settings
          }
        };
        
        await storage.upsertUser({
          id: userId,
          emailSettings: updatedEmailSettings
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  // Send test email
  router.post('/test', requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      // Fixed: Add null check for user
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const emailSettings = user.emailSettings as EmailSettings | undefined;
      
      if (!emailSettings?.accessToken) {
        return res.status(400).json({ message: "Email not connected" });
      }

      const { emailService } = await import('../emailService');
      
      // Fixed: Removed unused testEmailContent variable
      // Send test email using existing sendWelcomeEmail method
      if (user.email || emailSettings.email) {
        await emailService.sendWelcomeEmail(
          user.email || emailSettings.email!,
          user.firstName || 'User'
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Email callback
  router.get('/callback', requireAuth, async (req: any, res) => {
    try {
      const { code } = req.query;
      const userId = getUserId(req);

      if (!code) {
        return res.status(400).send('Authorization code not provided');
      }

      // Direct OAuth token exchange
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email/callback'
        })
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        throw new Error('Failed to get access token');
      }

      // Direct email fetching
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      const userInfo = await userInfoResponse.json();
      const email = userInfo.email;

      // Store tokens in user's email settings
      const emailSettings: EmailSettings = {
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        preferences: {
          dailyReminders: false,
          weeklyProgress: false,
          aiInsights: false,
          streakMilestones: false,
          motivationalMessages: false,
        }
      };

      await storage.upsertUser({
        id: userId,
        emailSettings
      });

      res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Email Connected</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .success { color: #28a745; }
  </style>
</head>
<body>
  <h1 class="success">✅ Email Connected Successfully!</h1>
  <p>Your Gmail account <strong>${email}</strong> has been connected.</p>
  <p>You can now close this window and return to the app.</p>
</body>
</html>`);
    } catch (error) {
      console.error("Error in email callback:", error);
      res.status(500).send(`<!DOCTYPE html>
<html>
<head>
  <title>Connection Error</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <h1 class="error">❌ Connection Failed</h1>
  <p>There was an error connecting your Gmail account.</p>
  <p>Please try again or contact support if the issue persists.</p>
</body>
</html>`);
    }
  });

  return router;
}
