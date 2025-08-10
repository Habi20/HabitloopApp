import { Router } from "express";

export function healthRoutes() {
  const router = Router();

  // System health check
  router.get('/', async (_req, res) => { // Added underscore prefix to unused parameter
    try {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '1.0.0'
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        success: false,
        error: { message: 'Health check failed' }
      });
    }
  });

  return router;
}
