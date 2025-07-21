import passport from "passport";
import { Strategy as OIDCStrategy, Profile as PassportProfile, VerifyCallback } from "passport-openidconnect";
import { Request } from "express";
import type { User } from "../shared/schema";

type UserName = {
  familyName?: string;
  givenName?: string;
  middleName?: string;
};

type UserProfile = PassportProfile & {
  id: string;
  displayName?: string;
  emails?: Array<{ value: string; type?: string }>;
  name?: string | UserName;
};

type AuthConfig = {
  issuerURL: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  allowedDomains?: string[];
};

type PassportUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  [key: string]: any; // Allow additional properties
};

export function initializeAuth(config: AuthConfig) {
  passport.use(
    "oidc",
    new OIDCStrategy(
      {
        issuer: config.issuerURL,
        authorizationURL: `${config.issuerURL}/authorize`,
        tokenURL: `${config.issuerURL}/token`,
        userInfoURL: `${config.issuerURL}/userinfo`,
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackURL: config.callbackURL,
        scope: ["openid", "profile", "email"]
      },
      (issuer: string, profile: PassportProfile, done: VerifyCallback) => {
        const userProfile = profile as UserProfile;
        
        // Validate domain if configured
        if (config.allowedDomains?.length) {
          const email = userProfile.emails?.[0]?.value;
          const domain = email?.split('@')[1];
          
          if (!domain || !config.allowedDomains.includes(domain)) {
            return done(null, false, { message: 'Unauthorized domain' });
          }
        }
        
        // Handle name conversion
        let firstName: string | null = null;
        let lastName: string | null = null;
        
        if (typeof userProfile.name === 'string') {
          const names = userProfile.name.split(' ');
          firstName = names[0] || null;
          lastName = names.length > 1 ? names.slice(1).join(' ') : null;
        } else if (typeof userProfile.name === 'object') {
          firstName = userProfile.name?.givenName || null;
          lastName = userProfile.name?.familyName || null;
        }
        
        // Create complete User object
        const user: User = {
          id: userProfile.id,
          email: userProfile.emails?.[0]?.value || null,
          firstName,
          lastName,
          profileImageUrl: null,
          level: null,
          xp: null,
          isGuest: false,
          questionnaire: null,
          emailSettings: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return done(null, user);
      }
    )
  );

  passport.serializeUser<PassportUser>((user, done) => done(null, user as PassportUser));
  passport.deserializeUser<PassportUser>((user, done) => done(null, user as PassportUser));
}

export const authenticate = (req: Request) => {
  return passport.authenticate("oidc", {
    failureRedirect: "/login",
    successReturnToOrRedirect: "/",
    state: req.query.returnTo?.toString()
  });
};

export const authenticateCallback = (req: Request) => {
  return passport.authenticate("oidc", {
    failureRedirect: "/login",
    successReturnToOrRedirect: "/",
    failureMessage: true
  })(req);
};
