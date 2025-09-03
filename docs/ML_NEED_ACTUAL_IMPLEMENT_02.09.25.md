Title: ML Analytics – Wire Real Models (Plan)
Date: 02.09.25

Goal
- Replace current heuristic ML analytics with real model inference.
- Serve outputs from trained artifacts under server/ml/models/trained/.

Models & Roles
- motivation_clusterer.pkl: assigns Motivation Level cluster.
- habit_regressor.joblib: predicts weekly success probability (Weekly Forecast) and per-habit adherence score.
- habit_classifier.joblib: binary propensity for success; acts as guardrail/confidence.
- timing_regressor.pkl: predicts optimal completion time(s), e.g., 14:30.
- scaler.pkl: shared preprocessor for numeric features.

Feature Pipeline
- Inputs (normalized via scaler.pkl):
  - User: level, xp, activeDays, daysSinceLastCompletion, averageConsistency7/30.
  - Habit: frequency, difficulty, category one-hot/embedding, streakLength, lastNCompletionRate, variance.
  - Temporal: hourOfDay histogram, weekday distribution, recent completion time windows.
  - Questionnaire-derived: motivationStyle flags; goals count; self-rated consistency.

Service Architecture
- Node (Express) route remains: /api/ml/analytics
- New Python microservice (FastAPI) loads .pkl/.joblib models once at startup.
- Node → Python over HTTP (localhost only) with JSON payload:
  {
    userId,
    features: { user, habits[], temporal, questionnaire }
  }
- Python returns:
  {
    consistencyScore: number (0-100),
    motivationLevel: 'Low'|'Medium'|'High',
    engagementLevel: number (0-100),
    optimalTimes: string[],   // e.g., ['08:30','14:30']
    weeklyForecast: number (0-100),
    performanceCategories: string[],
    confidenceLevel: 'Low'|'Medium'|'High',
    perHabit: [{ habitId, successProbability: number }]
  }

Node API Changes
- server/routes/mlPredictionRoutes.ts (/analytics):
  1) Gather user, habits, completions from storage.
  2) Build feature payload.
  3) POST to Python service /v1/infer/analytics.
  4) Map response 1:1 to frontend.
  5) Fallback: return current heuristic if Python is unavailable.

Python API (FastAPI)
- Endpoints:
  - POST /v1/infer/analytics
  - POST /v1/infer/habit (optional single-habit scoring)
- Loads: scaler.pkl, motivation_clusterer.pkl, habit_regressor.joblib, habit_classifier.joblib, timing_regressor.pkl.
- Inference:
  - Motivation Level: clusterer.predict(userFeatureVector).
  - Weekly Forecast: regressor.predict(userAggregateFeatures).
  - Per Habit Scores: regressor.predict(habitFeatureVectors) + classifier for thresholding.
  - Optimal Times: timing_regressor.predict(userTemporalFeatures) → one or more HH:mm.
  - Consistency Score: combine classifier propensity, recent adherence, and uncertainty.
  - Confidence: calibrated from classifier margin/variance and data volume.

Frontend Integration
- MLAnalyticsCard.tsx: no UI change; values now come from Python via Node.
- Home.tsx habit list: show per-habit % (successProbability) next to each habit title.
  - Query: extend /api/ml/analytics to include perHabit[].
  - Render small badge e.g., "68%"; hide if data missing.

Data Contracts
- Versioned schema in Python response: { version: '1.0.0', ... }.
- metadata.json governs feature order, required fields, and model versions.

Security & Ops
- Python bound to 127.0.0.1 only; Node whitelists origin.
- Timeouts: 500–800ms target; circuit-breaker to heuristic fallback.
- Healthchecks: /v1/health from Python; expose /api/ml/status in Node.

Testing
- Golden tests with fixed fixtures for features → expected outputs.
- Drift checks comparing regressor vs classifier consistency.
- Load test to confirm 95p latency < 800ms.

Migration Plan
1) Build Python service container (poetry/requirements.txt).
2) Implement FastAPI endpoints + model load + inference.
3) Add Node proxy logic + graceful fallback.
4) Add per-habit % in Home.tsx.
5) E2E verify with seed users (user-001…user-010).

Rollout
- Phase 1: dark launch (compute but not display; compare with heuristics).
- Phase 2: enable display + kill switch via env flag (ML_ANALYTICS_ENABLE=true).
- Phase 3: remove heuristic path after stability window.

Notes
- Keep current TS heuristics as fallback until Phase 3.
- Ensure consistent scaler usage across all numeric features.


