// This file now uses the existing routes structure in server/routes/
import express from "express";
import { createServer } from "http";
import { setupSession } from "./routes/middlewareRoutes";
import authRoutes from "./routes/authRoutes";
import { habitRoutes } from "./routes/habitRoutes";
// import { aiRoutes } from "./routes/aiRoutes";
import { mlPredictionRoutes } from "./routes/mlPredictionRoutes";
import emailRoutes from "./routes/emailRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { analyticsRoutes } from "./routes/analyticsRoutes";
import { guestRoutes } from "./routes/guestRoutes";
import { healthRoutes } from "./routes/healthRoutes";

export function registerRoutes(app: express.Application) {
  setupSession(app);

  // Mount all route modules
  app.use('/api', authRoutes);
  app.use('/api/habits', habitRoutes());
  // app.use('/api/ai', aiRoutes());
  app.use('/api/ml', mlPredictionRoutes());
  app.use('/api/email', emailRoutes);
  app.use('/api/guest', guestRoutes());
  app.use('/api/admin', adminRoutes);
  app.use('/api/analytics', analyticsRoutes());
  app.use('/api/health', healthRoutes());

  // Global error handler
  app.use((err: any, _req: any, res: any) => {
    console.error('API Error:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  });

  return createServer(app);
}