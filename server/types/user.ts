export interface AuthenticatedUser {
    id: string;
    email: string | null;
    passwordHash?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
    role?: string | null;  // ← Fixed: Allow null instead of undefined
    level?: number | null;
    xp?: number | null;
    isGuest?: boolean | null;
    questionnaire?: any;
    emailSettings?: any;
    difficulty?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }
  
  declare global {
    namespace Express {
      interface Request {
        user?: AuthenticatedUser;
        userId?: string;
      }
    }
  }