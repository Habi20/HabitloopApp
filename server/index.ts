// server/index.ts
import './env';
import './utils/adminLogger'; // Initialize admin logging control

import express, { type Express } from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index";

// Supabase authentication setup
const setupAuth = async (app: Express) => {
  const { setupAuth: setupSupabaseAuth } = await import("./supabaseAuth");
  await setupSupabaseAuth(app);
};

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'https://techversehublk.site',
    'http://localhost:5173', // For local development
    'http://localhost:3000'  // Alternative local port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Only override res.json if it exists and is a function
  if (res.json && typeof res.json === 'function') {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Backend-only setup for testing
(async () => {
  await setupAuth(app);
  const server = await registerRoutes(app);

  // Add default route handler for root path
  app.get('/', (_req, res) => {
    res.json({
      message: "🚀 HabitLoop Backend API",
      status: "operational",
      services: {
        ml_system: "✅ Ready for testing",
        rbac_system: "✅ Active", 
        database: "✅ Connected",
        python_models: "📊 Fallback mode"
      },
      endpoints: {
        ml_training: "POST /api/ml/train",
        ml_prediction: "POST /api/ml/predict", 
        ml_status: "GET /api/ml/status",
        authentication: "POST /api/auth/signin",
        habits: "GET /api/habits",
        admin: "GET /api/admin/users",
        completions: "GET /api/completions",
        insights: "GET /api/insights",
        coaching: "GET /api/coaching/messages"
      },
      documentation: "Backend-only mode - Frontend disabled for testing",
      timestamp: new Date().toISOString()
    });
  });

  const PORT = parseInt(process.env.PORT || "5000");
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
    console.log(`📊 ML System: Ready for testing`);
    console.log(`🔐 RBAC System: Active`);
    console.log(`🔧 Admin Log Control: Initialized`);
  });

  // Error handling middleware
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
})();
