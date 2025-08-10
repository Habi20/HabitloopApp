
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import type { User } from '@shared/schema';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class ProductionAuth {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET!;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET or SESSION_SECRET must be provided');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  verifyToken(token: string): AuthTokenPayload {
    return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
  }

  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return null;
      }

      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }): Promise<{ user: User; token: string }> {
    const passwordHash = await this.hashPassword(userData.password);
    
    const user = await storage.upsertUser({
      id: crypto.randomUUID(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      passwordHash,
      level: 1,
      xp: 0,
      isGuest: false
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async createGuestUser(): Promise<{ user: User; token: string }> {
    const user = await storage.upsertUser({
      id: crypto.randomUUID(),
      email: `guest-${Date.now()}@example.com`,
      firstName: 'Guest',
      lastName: 'User',
      level: 1,
      xp: 0,
      isGuest: true
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async validateTokenAndGetUser(token: string): Promise<User | null> {
    try {
      const payload = this.verifyToken(token);
      const user = await storage.getUser(payload.userId);
      return user || null;
    } catch (error) {
      return null;
    }
  }
}

export const productionAuth = new ProductionAuth();
