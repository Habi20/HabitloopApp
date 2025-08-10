## Project Folder Structure with Functions

Note: Only project source files are listed (node_modules and build artifacts are excluded). Functions were auto-discovered across TypeScript/TSX/JavaScript/Python and listed after each file as markdown tags (#Name). Some typed/forwardRef component declarations may not surface as plain functions.

### Root

- `README.md`
- `README (copy).md`
- `package.json`
- `package-lock.json`
- `tailwind.config.ts`
- `tsconfig.json`
- `vite.config.ts`
- `generated-icon.png`
- `install_ml_dependencies.py` # install_package, check_package, main
- `migrations/`
- `docs/`
- `client/`
- `server/`
- `shared/`
- `test_ml_integration.py` # test_ml_endpoints, test_typescript_fallback, main

### docs/

- `docs/COMPLETE_ML_ARCHITECTURE_DOCUMENTATION.md`
- `docs/HABITLOOP COMPREHENSIVE_DOC.md`
- `docs/HABITLOOP_ML_SYSTEM_GUIDE.md`
- `docs/HABITMASTER_API_TESTING_GUIDE.md`
- `server/docs/scripts/SCRIPT_DOCUMENTATION.md`

### migrations/

- `migrations/supabase_production_schema.sql`

### shared/

- `shared/package.json`
- `shared/schema.ts`

### client/

- `client/index.html`
- `client/package.json`
- `client/postcss.config.js`
- `client/tailwind.config.ts`
- `client/tsconfig.json`
- `client/tsconfig.node.json`
- `client/vite.config.ts`
- `client/vitest.config.ts`
- `client/src/`

#### client/src/

- `client/src/main.tsx`
- `client/src/index.css`
- `client/src/App.tsx` # Router, App
- `client/src/test/setup.ts`
- `client/src/contexts/AuthContext.tsx` # AuthProvider, useAuth
- `client/src/hooks/useAuth.ts` # useAuth
- `client/src/hooks/use-mobile.tsx` # useIsMobile
- `client/src/hooks/use-toast.ts` # genId, addToRemoveQueue, dispatch, toast, useToast
- `client/src/lib/authUtils.ts` # isUnauthorizedError
- `client/src/lib/queryClient.ts` # throwIfResNotOk, apiRequest
- `client/src/lib/utils.ts` # cn
- `client/src/pages/Challenges.tsx` # Challenges
- `client/src/pages/Habits.tsx` # Habits, getCategoryIcon, getCategoryColor
- `client/src/pages/Home.tsx` # Home
- `client/src/pages/Landing.tsx` # Landing
- `client/src/pages/LoginPage.tsx` # LoginPage
- `client/src/pages/Profile.tsx` # Profile
- `client/src/pages/Settings.tsx` # Settings
- `client/src/pages/Stats.tsx` # Stats
- `client/src/pages/not-found.tsx` # NotFound
- `client/src/components/`
- `client/src/components/ui/`

##### client/src/components/

- `client/src/components/AddHabitModal.tsx` # AddHabitModal
- `client/src/components/AICoachAssistant.tsx` # AICoachAssistant
- `client/src/components/AIInsightCard.tsx` # AIInsightCard
- `client/src/components/AIQuestionnaireModal.tsx` # AIQuestionnaireModal
- `client/src/components/CoachingDashboard.tsx` # CoachingDashboard
- `client/src/components/EditHabitModal.tsx` # EditHabitModal
- `client/src/components/EmailIntegrationModal.tsx` # EmailIntegrationModal
- `client/src/components/GoogleCalendarIntegration.tsx` # GoogleCalendarIntegration
- `client/src/components/GoogleCalendarIntegrationSimple.tsx` # GoogleCalendarIntegrationSimple
- `client/src/components/GuestModeModal.tsx` # GuestModeModal
- `client/src/components/HabitCard.tsx` # HabitCard
- `client/src/components/HabitRecommendationCarousel.tsx` # HabitRecommendationCarousel
- `client/src/components/MLPredictionCard.tsx` # MLPredictionCard
- `client/src/components/Sidebar.tsx` # Sidebar

##### client/src/components/ui/

- `client/src/components/ui/accordion.tsx`
- `client/src/components/ui/alert-dialog.tsx`
- `client/src/components/ui/alert.tsx`
- `client/src/components/ui/aspect-ratio.tsx`
- `client/src/components/ui/avatar.tsx`
- `client/src/components/ui/badge.tsx` # Badge
- `client/src/components/ui/breadcrumb.tsx`
- `client/src/components/ui/button.tsx`
- `client/src/components/ui/calendar.tsx` # Calendar
- `client/src/components/ui/card.tsx`
- `client/src/components/ui/carousel.tsx` # useCarousel
- `client/src/components/ui/chart.tsx` # useChart, ChartStyle, getPayloadConfigFromPayload
- `client/src/components/ui/checkbox.tsx`
- `client/src/components/ui/collapsible.tsx`
- `client/src/components/ui/command.tsx` # CommandDialog
- `client/src/components/ui/context-menu.tsx`
- `client/src/components/ui/dialog.tsx`
- `client/src/components/ui/drawer.tsx`
- `client/src/components/ui/dropdown-menu.tsx`
- `client/src/components/ui/form.tsx` # useFormField
- `client/src/components/ui/hover-card.tsx`
- `client/src/components/ui/index.ts`
- `client/src/components/ui/input-otp.tsx`
- `client/src/components/ui/input.tsx`
- `client/src/components/ui/label.tsx`
- `client/src/components/ui/menubar.tsx` # MenubarMenu, MenubarGroup, MenubarPortal, MenubarRadioGroup, MenubarSub
- `client/src/components/ui/navigation-menu.tsx`
- `client/src/components/ui/pagination.tsx` # Pagination
- `client/src/components/ui/popover.tsx`
- `client/src/components/ui/progress.tsx`
- `client/src/components/ui/radio-group.tsx`
- `client/src/components/ui/resizable.tsx`
- `client/src/components/ui/scroll-area.tsx`
- `client/src/components/ui/select.tsx`
- `client/src/components/ui/separator.tsx`
- `client/src/components/ui/sheet.tsx`
- `client/src/components/ui/sidebar.tsx` # useSidebar
- `client/src/components/ui/skeleton.tsx` # Skeleton
- `client/src/components/ui/slider.tsx`
- `client/src/components/ui/switch.tsx`
- `client/src/components/ui/table.tsx`
- `client/src/components/ui/tabs.tsx`
- `client/src/components/ui/textarea.tsx`
- `client/src/components/ui/toast.tsx`
- `client/src/components/ui/toaster.tsx` # Toaster
- `client/src/components/ui/toggle-group.tsx`
- `client/src/components/ui/toggle.tsx`
- `client/src/components/ui/tooltip.tsx`

### server/

- `server/package.json`
- `server/jest.config.js`
- `server/tsconfig.json`
- `server/vite.ts`
- `server/drizzle.config.ts`
- `server/schema-lock.json`
- `server/schema-lock 1.0.0.json`
- `server/schema-lock 1.1.0.json`
- `server/index.ts` # startServer
- `server/env.ts` # validateSupabaseUrl
- `server/db.ts` # gracefulShutdown
- `server/storage.ts`
- `server/openai.ts` # generateHabitRecommendations, generateAIRecommendations, enhanceRecommendationsWithAI, generatePersonalizedInsight
- `server/emailService.ts`
- `server/recommendationEngine.ts`
- `server/coachingEngine.ts`
- `server/supabaseAuth.ts` # testSupabaseConnection
- `server/syntheticDatabase.ts` # filterHabitsByProfile, generatePersonalizedHabits
- `server/routes.ts` # registerRoutes
- `server/routes/`
- `server/ml/`
- `server/migrations/`
- `server/scripts/`
- `server/demo/`
- `server/__tests__/`
- `server/types/`
- `server/docs/`

#### server/routes/

- `server/routes/index.ts` # registerRoutes
- `server/routes/middlewareRoutes.ts` # setupSession, requireAuth, validateHabitInput, validateZodSchema, requireRole, requestLogger, rateLimit, errorHandler
- `server/routes/aiRoutes.ts` # aiRoutes
- `server/routes/analyticsRoutes.ts` # analyticsRoutes
- `server/routes/adminRoutes.ts` # adminRoutes
- `server/routes/authRoutes.ts` # authRoutes
- `server/routes/emailRoutes.ts` # emailRoutes
- `server/routes/guestRoutes.ts` # guestRoutes
- `server/routes/healthRoutes.ts` # healthRoutes
- `server/routes/habitRoutes.ts` # habitRoutes
- `server/routes/mlPredictionRoutes.ts` # mlPredictionRoutes, calculateTimeAlignment, getTimeFromPeriod, generateTimingRecommendations

#### server/ml/

- `server/ml/services/mlAdvancedService.ts`
- `server/ml/services/mlInferenceService.py` # **init**, \_load_models, \_user_has_category, \_get_category_habit_suggestion, \_calculate_category_difficulty, \_calculate_overall_completion_rate, \_find_best_completion_day, \_analyze_consistency_trend, \_analyze_streak_performance, \_analyze_category_performance, \_generate_pattern_insights, \_generate_pattern_recommendations, \_assess_habit_difficulty
- `server/ml/pipelines/featureEngineering.py` # **init**, extract_user_profile_features, extract_habit_features, extract_temporal_features, extract_contextual_features, create_feature_vector, \_process_questionnaire_features, \_calculate_account_age, \_calculate_habit_complexity, \_calculate_streaks, \_calculate_consistency_score, \_calculate_weekend_rate, \_analyze_time_preferences, \_calculate_motivation_score, \_calculate_resilience_score
- `server/ml/models/habitPredictor.py` # **init**, prepare_features, \_calculate_derived_features, generate_synthetic_data, train_models, predict_habit_success, \_generate_recommendations, save_models, load_models
- `server/ml/models/trained/metadata.json`

#### server/migrations/

- `server/migrations/001_initial_schema.sql`
- `server/migrations/002_add_rbac_roles.sql`
- `server/migrations/20250730_add_missing_columns_simple.sql`
- `server/migrations/20250730_add_missing_rbac_columns.sql`
- `server/migrations/migration-tracker.ts`
- `server/migrations/run-migrations.ts` # main
- `server/migrations/rollbacks/001_initial_schema_rollback.sql`
- `server/migrations/rollbacks/002_add_rbac_roles_rollback.sql`

#### server/scripts/

- `server/scripts/create-migration.ts`
- `server/scripts/migration-status.ts` # showMigrationStatus
- `server/scripts/database/check-migrations.ts` # checkMigrations
- `server/scripts/database/test-db-connection.ts` # testConnection
- `server/scripts/database/verify-current-schema.ts` # verifyCurrentSchema
- `server/scripts/migration/check-migration-records.ts` # checkMigrationRecords
- `server/scripts/migration/cleanup-failed-migration.ts` # cleanupFailedMigration
- `server/scripts/migration/record-manual-migration.ts` # recordManualMigration
- `server/scripts/utilities/` (empty or helpers)

#### server/demo/

- `server/demo/api-testing-framework.ts`
- `server/demo/ml-visualization.ts`
- `server/demo/thesis-presentation.ts`
- `server/demo/visual-dashboard.ts`
- `server/demo/visual-testing-framework.ts`

#### server/**tests**/

- `server/__tests__/mlAdvancedService.test.ts`
- `server/__tests__/recommendationEngine.test.ts`
- `server/__tests__/routes.test.ts`

#### server/types/

- `server/types/express.d.ts`
- `server/types/user.ts`

#### server/docs/

- `server/docs/scripts/SCRIPT_DOCUMENTATION.md`

### notUsed/

- `notUsed/assets/`
- `notUsed/build-configs/`
- `notUsed/config-extra/components.json`
- `notUsed/config-extra/drizzle.config.ts`
- `notUsed/config-extra/postcss.config.js`
- `notUsed/config-old/docker-compose.yml`
- `notUsed/config-old/init-database.sql`
- `notUsed/config-old/tsconfig.local.json`
- `notUsed/config-old/uv.lock`
- `notUsed/documentation/BEGINNER_VIVA_EXPLANATION.md`
- `notUsed/documentation/COMPLETE_ML_VIVA_DEMONSTRATION.md`
- `notUsed/documentation/DAY-3-COMMIT-SUMMARY.md`
- `notUsed/documentation/ENHANCEMENT_IMPLEMENTATION_REPORT.md`
- `notUsed/documentation/ML_DEMONSTRATION_RESULTS.md`
- `notUsed/documentation/PROJECT_DOCUMENTATION.md`
- `notUsed/documentation/README.md`
- `notUsed/documentation/system-design-documentation.md`
- `notUsed/documentation/TESTING_DOCUMENTATION.md`
- `notUsed/documentation/VIVA_ML_EXPLANATION_GUIDE.md`
- `notUsed/documentation/VIVA_PREPARATION_GUIDE.md`
- `notUsed/documentation/WEEK-3.md`
- `notUsed/legacy-auth/localAuth.ts` # getSession, setupLocalAuth, setupAuth
- `notUsed/legacy-auth/productionAuth.ts`
- `notUsed/legacy-auth/simpleAuth.ts` # setupSimpleAuth
- `notUsed/legacy-auth/superbaseAuth.ts` # getSession, setupAuth
- `notUsed/ml-experiments/google_calendar_integration.py` # **init**, create_habit_reminder, create_milestone_celebration, \_get_success_tips, integrate_with_habitflow_api, demonstrate_ml_calendar_flow
- `notUsed/ml-experiments/ml_demo_working.py` # **init**, generate_training_data, train_model, predict_success, main
- `notUsed/ml-experiments/ml_model.py` # **init**, connect_to_database, create_training_table, load_training_data, preprocess_data, train_model, predict_success_probability, save_model, load_model, main
- `notUsed/ml-experiments/test_ml_advanced_demo.py` # create_sample_questionnaire_data, create_sample_habits, demonstrate_basic_ml_prediction, demonstrate_feature_engineering, demonstrate_recommendation_engine, demonstrate_pattern_analysis, main
- `notUsed/ml-experiments/test_ml_functionality.py` # **init**, generate_synthetic_data, preprocess_data, train_model, predict_success_probability, test_ml_functionality
