// server/env.ts
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Emulate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3001"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  TIMEZONE: z.string().default("Asia/Colombo"),
  TZ: z.string().default("Asia/Colombo"),
  // Preserve existing environment variables
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  SENDGRID_API_KEY: z.string().optional(),
     // SENDGRID_FROM_EMAIL: z.string().default("noreply@habitloop.com"),
   SENDGRID_FROM_EMAIL: z.string().default("habitloop-report@em6056.techversehublk.site"), // Domain authenticated
   // GMAIL_TEST_EMAIL: z.string().default("habitloop-report@em6056.techversehublk.site"),
   GMAIL_TEST_EMAIL: z.string().default("habitloop-report@em6056.techversehublk.site"), // Domain authenticated
  GMAIL_TEST_PASSWORD: z.string().default("password123"),
});

export const env = envSchema.parse(process.env);

// Set timezone for the entire Node.js process
process.env.TZ = env.TIMEZONE;

console.log(`🌍 Timezone configured: ${env.TIMEZONE} (${process.env.TZ})`);

// Export typed environment variables (preserving existing structure)
export const typedEnv = {
  // Database
  dbUrl: env.DATABASE_URL,
  dbUrlFallback: process.env.DATABASE_URL_FALLBACK,
  
  // Supabase
  supabaseUrl: env.SUPABASE_URL || "",
  supabaseKey: env.SUPABASE_ANON_KEY || "",
  
  // OpenAI
  openaiApiKey: env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
  
  // Environment
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT),
  
  // JWT and Session
  jwtSecret: env.JWT_SECRET || env.SESSION_SECRET || "fallback-secret",
  sessionSecret: env.SESSION_SECRET || "supabase-session-secret",
  
  // Frontend URL
  frontendUrl: env.FRONTEND_URL,
  
     // SendGrid Email
   sendgridApiKey: env.SENDGRID_API_KEY || "",
   sendgridFromEmail: env.SENDGRID_FROM_EMAIL, // Now uses domain authenticated email
  
  // Test Email (for development)
  gmailTestEmail: env.GMAIL_TEST_EMAIL,
  gmailTestPassword: env.GMAIL_TEST_PASSWORD,
  
  // Timezone Configuration
  timezone: env.TIMEZONE,
};

export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// OpenAI availability flag
export const isOpenAIEnabled =
  env.OPENAI_API_KEY &&
  env.OPENAI_API_KEY !== "sk-placeholder-key-for-development" &&
  env.OPENAI_API_KEY.startsWith("sk-");