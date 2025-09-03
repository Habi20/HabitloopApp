import { db } from '../db';
import { sessions } from '../../shared/schema';
import { eq, lt } from 'drizzle-orm';
import { adminLog } from '../utils/adminLogger';

export interface SessionInfo {
  id: number;
  userId: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessionTimeoutMinutes: number = 1440; // 24 hours timeout
  private maxSessionsPerUser: number = 1; // Only one session per user

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Create a new session for a user
  async createSession(userId: string, token: string, deviceInfo?: string, ipAddress?: string, userAgent?: string): Promise<SessionInfo> {
    try {
      // Check if user already has an active session
      const existingSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sid, userId));

      if (existingSessions.length >= this.maxSessionsPerUser) {
        // Deactivate existing sessions
        await this.deactivateUserSessions(userId);
        adminLog.log(`Deactivated existing sessions for user ${userId} - new login detected`);
      }

      // Create new session
      const expiresAt = new Date(Date.now() + this.sessionTimeoutMinutes * 60 * 1000);
      
      const [newSession] = await db
        .insert(sessions)
        .values({
          sid: userId,
          sess: {
            token,
            deviceInfo: deviceInfo || 'Unknown Device',
            ipAddress: ipAddress || 'Unknown IP',
            userAgent: userAgent || 'Unknown User Agent',
            isActive: true
          },
          expire: expiresAt
        })
        .returning();

      adminLog.log(`Created new session for user ${userId}`);
      return {
        id: 0, // Sessions table doesn't have an id field
        userId: newSession.sid,
        token,
        expiresAt: newSession.expire,
        isActive: true,
        deviceInfo: deviceInfo || 'Unknown Device',
        ipAddress: ipAddress || 'Unknown IP',
        userAgent: userAgent || 'Unknown User Agent',
        createdAt: new Date()
      };
    } catch (error) {
      adminLog.error(`Error creating session for user ${userId}:`, error);
      throw error;
    }
  }

  // Validate session and check timeout
  async validateSession(token: string): Promise<{ valid: boolean; session?: SessionInfo; message?: string }> {
    try {
      // Get all sessions and filter in JavaScript
      const sessionResults = await db
        .select()
        .from(sessions);

      // Find session with matching token that hasn't expired
      const sessionInfo = sessionResults.find(session => {
        const sessionData = session.sess as any;
        return sessionData?.token === token && new Date() < session.expire;
      });

      if (!sessionInfo) {
        return { valid: false, message: 'Session not found or inactive' };
      }

      const sessionData = sessionInfo.sess as any;

      // Check if session has expired
      if (new Date() > sessionInfo.expire) {
        await this.deactivateSession(sessionInfo.sid);
        return { valid: false, message: 'Session has expired. Please log in again.' };
      }

      // Extend session timeout
      await this.extendSession(sessionInfo.sid);

      return { 
        valid: true, 
        session: {
          id: 0,
          userId: sessionInfo.sid,
          token,
          expiresAt: sessionInfo.expire,
          isActive: true,
          deviceInfo: sessionData?.deviceInfo,
          ipAddress: sessionData?.ipAddress,
          userAgent: sessionData?.userAgent,
          createdAt: new Date()
        }
      };
    } catch (error) {
      adminLog.error('Error validating session:', error);
      return { valid: false, message: 'Session validation error' };
    }
  }

  // Extend session timeout
  async extendSession(sessionId: string): Promise<void> {
    try {
      const newExpiresAt = new Date(Date.now() + this.sessionTimeoutMinutes * 60 * 1000);
      
      await db
        .update(sessions)
        .set({ expire: newExpiresAt })
        .where(eq(sessions.sid, sessionId));
    } catch (error) {
      adminLog.error(`Error extending session ${sessionId}:`, error);
    }
  }

  // Deactivate a specific session
  async deactivateSession(sessionId: string): Promise<void> {
    try {
      await db
        .delete(sessions)
        .where(eq(sessions.sid, sessionId));
      
      adminLog.log(`Deactivated session ${sessionId}`);
    } catch (error) {
      adminLog.error(`Error deactivating session ${sessionId}:`, error);
    }
  }

  // Deactivate all sessions for a user
  async deactivateUserSessions(userId: string): Promise<void> {
    try {
      await db
        .delete(sessions)
        .where(eq(sessions.sid, userId));
      
      adminLog.log(`Deactivated all sessions for user ${userId}`);
    } catch (error) {
      adminLog.error(`Error deactivating sessions for user ${userId}:`, error);
    }
  }

  // Get active sessions for a user
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const sessionResults = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sid, userId));

      return sessionResults.map(session => {
        const sessionData = session.sess as any;
        return {
          id: 0,
          userId: session.sid,
          token: sessionData?.token || '',
          expiresAt: session.expire,
          isActive: true,
          deviceInfo: sessionData?.deviceInfo,
          ipAddress: sessionData?.ipAddress,
          userAgent: sessionData?.userAgent,
          createdAt: new Date()
        };
      });
    } catch (error) {
      adminLog.error(`Error getting sessions for user ${userId}:`, error);
      return [];
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const expiredSessions = await db
        .select()
        .from(sessions)
        .where(lt(sessions.expire, new Date()));

      for (const session of expiredSessions) {
        await this.deactivateSession(session.sid);
      }

      if (expiredSessions.length > 0) {
        adminLog.log(`Cleaned up ${expiredSessions.length} expired sessions`);
      }
    } catch (error) {
      adminLog.error('Error cleaning up expired sessions:', error);
    }
  }

  // Check if user has active session on another device
  async hasActiveSessionOnOtherDevice(userId: string, currentToken: string): Promise<boolean> {
    try {
      const activeSessions = await this.getUserSessions(userId);
      return activeSessions.some(session => session.token !== currentToken);
    } catch (error) {
      adminLog.error(`Error checking active sessions for user ${userId}:`, error);
      return false;
    }
  }

  // Get session timeout in minutes
  getSessionTimeoutMinutes(): number {
    return this.sessionTimeoutMinutes;
  }

  // Set session timeout
  setSessionTimeoutMinutes(minutes: number): void {
    this.sessionTimeoutMinutes = minutes;
    adminLog.log(`Session timeout set to ${minutes} minutes`);
  }

  // Get max sessions per user
  getMaxSessionsPerUser(): number {
    return this.maxSessionsPerUser;
  }

  // Set max sessions per user
  setMaxSessionsPerUser(max: number): void {
    this.maxSessionsPerUser = max;
    adminLog.log(`Max sessions per user set to ${max}`);
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);
