// server/env.ts
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Emulate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root .env file
config({ path: path.resolve(__dirname, "../.env") });

// Validate required variables
const requiredVars = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY"];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

// Export typed environment variables
export const env = {
  dbUrl: process.env.DATABASE_URL!,
  dbUrlFallback: process.env.DATABASE_URL_FALLBACK, // ✅ ADDED: Fallback connection
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_ANON_KEY!,
  openaiApiKey:
    process.env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000"),
  jwtSecret:
    process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret",
  sessionSecret: process.env.SESSION_SECRET || "supabase-session-secret",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

export const isDevelopment = env.nodeEnv === "development";
export const isProduction = env.nodeEnv === "production";
export const isTest = env.nodeEnv === "test";

// OpenAI availability flag
export const isOpenAIEnabled =
  env.openaiApiKey &&
  env.openaiApiKey !== "sk-placeholder-key-for-development" &&
  env.openaiApiKey.startsWith("sk-");
