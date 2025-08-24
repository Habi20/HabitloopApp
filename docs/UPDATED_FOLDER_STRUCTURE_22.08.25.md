# Updated Project Folder Structure (22.08.25)

## Current Project Organization

```
HabitMaster2907251711PM-2 - HLRUN 10.08.25/
├── 📁 client/                                    # Frontend React application
│   ├── src/
│   │   ├── components/                           # Reusable UI components
│   │   │   ├── ui/                              # Shadcn/ui component library (40+ components)
│   │   │   ├── AICoachAssistant.tsx             # ML-powered coaching interface
│   │   │   ├── AIInsightCard.tsx                # ML insights display
│   │   │   ├── AIQuestionnaireModal.tsx         # ML data collection
│   │   │   ├── AddHabitModal.tsx                # Habit creation interface
│   │   │   ├── ChallengesSystem.tsx             # Challenge management system
│   │   │   ├── CoachingDashboard.tsx            # AI coaching dashboard
│   │   │   ├── EditHabitModal.tsx               # Habit modification
│   │   │   ├── EditProfileModal.tsx             # Profile editing interface
│   │   │   ├── EmailIntegrationModal.tsx        # Email service integration
│   │   │   ├── GoogleCalendarIntegration.tsx    # Calendar sync functionality
│   │   │   ├── GoogleCalendarIntegrationSimple.tsx # Simplified calendar integration
│   │   │   ├── GuestModeModal.tsx               # Demo mode interface
│   │   │   ├── HabitCard.tsx                    # Individual habit display
│   │   │   ├── HabitLoopLoginModal.tsx          # Unified authentication modal
│   │   │   ├── HabitLoopSignupModal.tsx         # HabitLoop user signup
│   │   │   ├── HabitLoopUserModal.tsx           # HabitLoop user management
│   │   │   ├── HabitRecommendationCarousel.tsx  # ML recommendations UI
│   │   │   ├── LoginForm.tsx                    # Login form component
│   │   │   ├── LoginModal.tsx                   # Supabase authentication modal
│   │   │   ├── MLPredictionCard.tsx             # ML prediction display
│   │   │   ├── MLAnalyticsCard.tsx              # ML analytics display
│   │   │   ├── NotificationPanel.tsx            # Notification system
│   │   │   ├── SimpleXPDisplay.tsx              # Clean XP display
│   │   │   ├── Sidebar.tsx                      # Navigation sidebar
│   │   │   ├── ThemePreview.tsx                 # Theme customization
│   │   │   └── XPBreakdownCard.tsx              # Detailed XP breakdown
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx                  # Authentication state management
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx                   # Mobile responsiveness
│   │   │   └── use-toast.ts                     # Toast notification hook
│   │   ├── lib/
│   │   │   ├── authUtils.ts                     # Authentication utilities
│   │   │   ├── queryClient.ts                   # React Query configuration
│   │   │   └── utils.ts                         # General utilities
│   │   ├── pages/
│   │   │   ├── Challenges.tsx                   # Challenges view
│   │   │   ├── Habits.tsx                       # Main habits interface
│   │   │   ├── Home.tsx                         # Dashboard homepage
│   │   │   ├── Landing.tsx                      # Landing page
│   │   │   ├── LoginPage.tsx                    # Authentication page
│   │   │   ├── Profile.tsx                      # User profile management
│   │   │   ├── Settings.tsx                     # Application settings
│   │   │   ├── Stats.tsx                        # Analytics and statistics
│   │   │   └── not-found.tsx                    # 404 error page
│   │   ├── services/                            # API service layer
│   │   ├── test/                                # Frontend test files
│   │   │   └── setup.ts                         # Test configuration
│   │   ├── types/                               # TypeScript type definitions
│   │   ├── App.tsx                              # Main application component
│   │   ├── index.css                            # Global styles
│   │   └── main.tsx                             # Application entry point
│   ├── index.html                               # HTML template
│   ├── package.json                             # Frontend dependencies
│   ├── postcss.config.js                       # PostCSS configuration
│   ├── tailwind.config.ts                      # Tailwind CSS config
│   ├── tsconfig.json                           # TypeScript configuration
│   ├── tsconfig.node.json                      # Node-specific TypeScript config
│   ├── vite.config.ts                          # Vite build configuration
│   └── vitest.config.ts                        # Testing configuration
├── 📁 server/                                   # Backend Express.js application
│   ├── __tests__/                              # Backend test suites
│   │   ├── mlAdvancedService.test.ts           # ML service testing
│   │   └── routes.test.ts                      # Route testing
│   ├── demo/                                   # Demo and presentation files
│   │   ├── api-testing-framework.ts            # API testing framework
│   │   ├── ml-visualization.ts                 # ML visualization tools
│   │   ├── thesis-presentation.ts              # Thesis presentation utilities
│   │   └── visual-dashboard.ts                 # Visual dashboard components
│   ├── docs/                                   # Server documentation
│   │   └── scripts/
│   │       └── SCRIPT_DOCUMENTATION.md         # Script documentation
│   ├── ml/                                     # Machine Learning components
│   │   ├── models/                             # ML model implementations
│   │   │   ├── trained/                        # Trained model storage
│   │   │   │   ├── habit_classifier.joblib     # Joblib format classifier
│   │   │   │   ├── habit_classifier.pkl        # Pickle format classifier
│   │   │   │   ├── habit_regressor.joblib      # Joblib format regressor
│   │   │   │   ├── metadata.json               # Model metadata
│   │   │   │   ├── motivation_clusterer.pkl    # Motivation clustering model
│   │   │   │   ├── scaler.pkl                  # Feature scaler
│   │   │   │   └── timing_regressor.pkl        # Timing prediction model
│   │   │   └── habitPredictor.py               # Core ML predictor
│   │   ├── pipelines/                          # Data processing pipelines
│   │   │   └── featureEngineering.py           # Feature extraction
│   │   └── services/                           # ML service layer
│   │       └── mlInferenceService.py           # ML inference engine
│   ├── migrations/                             # Database migrations
│   │   ├── manual/                             # Manual migration files
│   │   ├── rollbacks/                          # Migration rollback scripts
│   │   │   ├── 001_initial_schema_rollback.sql # Initial schema rollback
│   │   │   └── 002_add_rbac_roles_rollback.sql # RBAC rollback
│   │   ├── 001_initial_schema.sql              # Initial database schema
│   │   ├── 002_add_rbac_roles.sql              # Role-based access control
│   │   ├── 20250730_add_missing_columns_simple.sql # Missing columns fix
│   │   ├── 20250730_add_missing_rbac_columns.sql # RBAC columns fix
│   │   ├── migration-tracker.ts                # Migration tracking utility
│   │   └── run-migrations.ts                   # Migration runner
│   ├── routes/                                 # Express.js API routes
│   │   ├── adminRoutes.ts                      # Administration endpoints
│   │   ├── aiRoutes.ts                         # AI/ML integration routes
│   │   ├── analyticsRoutes.ts                  # Analytics endpoints
│   │   ├── authRoutes.ts                       # Authentication routes
│   │   ├── challengeRoutes.ts                  # Challenge management routes
│   │   ├── emailRoutes.ts                      # Email service routes
│   │   ├── guestRoutes.ts                      # Guest mode routes
│   │   ├── habitRoutes.ts                      # Habit CRUD operations
│   │   ├── healthRoutes.ts                     # Health check endpoints
│   │   ├── index.ts                            # Route aggregation
│   │   ├── middlewareRoutes.ts                 # Middleware configuration
│   │   ├── mlPredictionRoutes.ts               # ML prediction endpoints
│   │   └── notificationRoutes.ts               # Notification system routes
│   ├── scripts/                                # Utility scripts
│   │   ├── create-migration.ts                 # Migration creation utility
│   │   ├── database/                           # Database utilities
│   │   │   ├── check-migrations.ts             # Migration verification
│   │   │   ├── test-db-connection.ts           # Database connection test
│   │   │   └── verify-current-schema.ts        # Schema verification
│   │   ├── migration/                          # Migration utilities
│   │   │   ├── check-migration-records.ts      # Migration record checking
│   │   │   ├── cleanup-failed-migration.ts     # Failed migration cleanup
│   │   │   └── record-manual-migration.ts      # Manual migration recording
│   │   ├── migration-status.ts                 # Migration status checker
│   │   ├── rollback-migration.ts               # Migration rollback utility
│   │   └── utilities/                          # General utilities
│   ├── services/                               # Service layer
│   ├── tests/                                  # Additional test files
│   │   └── recommendationEngine.test.ts        # Recommendation testing
│   ├── types/                                  # TypeScript type definitions
│   │   └── user.ts                             # User type definitions
│   ├── utils/                                  # Utility functions
│   │   ├── habitCompletionManager.ts           # Habit completion logic
│   │   ├── notificationUtils.ts                # Notification system utilities
│   │   ├── timezone.ts                         # Timezone utilities
│   │   └── xpCalculator.ts                     # XP calculation logic
│   ├── coachingEngine.ts                       # AI coaching logic
│   ├── db.ts                                   # Database connection
│   ├── direct-test.cjs                         # Direct testing utility
│   ├── drizzle.config.ts                       # Drizzle ORM configuration
│   ├── emailService.ts                         # Email functionality
│   ├── env.ts                                  # Environment configuration
│   ├── index.ts                                # Server entry point
│   ├── jest.config.js                          # Jest testing configuration
│   ├── migration-debug.log                     # Migration debug log
│   ├── ml_demo_working.py                      # ML demo script
│   ├── openaiService.ts                        # OpenAI service integration
│   ├── package.json                            # Backend dependencies
│   ├── recommendationEngine.ts                 # Recommendation system
│   ├── retrain_ml_models.py                    # ML model retraining script
│   ├── routes.ts                               # Route registration
│   ├── schema-lock.json                        # Schema lock file
│   ├── schema-lock 1.0.0.json                  # Schema version 1.0.0 lock
│   ├── schema-lock 1.1.0.json                  # Schema version 1.1.0 lock
│   ├── storage.ts                              # Data storage layer
│   ├── supabaseAuth.ts                         # Supabase authentication
│   ├── syntheticDatabase.ts                    # Synthetic data generation
│   ├── test_ml_models.py                       # ML model testing script
│   ├── tsconfig.json                           # TypeScript configuration
│   └── vite.ts                                 # Vite configuration for server
├── 📁 shared/                                  # Shared utilities and types
│   ├── package.json                            # Shared package config
│   └── schema.ts                               # Shared type definitions
├── 📁 migrations/                              # Root level migrations
│   ├── fix_auth_integration.sql                # Authentication integration fix
│   └── supabase_production_schema.sql          # Production schema
├── 📁 notUsed/                                 # Archive/legacy code
│   ├── assets/                                 # Unused assets
│   ├── build-configs/                          # Build configurations
│   ├── config-extra/                           # Extra configurations
│   ├── config-old/                             # Old configurations
│   ├── documentation/                          # Archive documentation
│   ├── legacy-auth/                            # Old authentication
│   ├── ml-experiments/                         # ML prototypes
│   └── testing/                                # Legacy tests
├── 📁 docs/                                    # Project documentation
│   ├── COMPLETE_ML_ARCHITECTURE_DOCUMENTATION.md # Complete ML architecture
│   ├── GAMIFICATION_SYSTEM_GUIDE.md            # Gamification system guide
│   ├── GUEST_SYSTEM_IMPLEMENTATION.md          # Guest system implementation
│   ├── HABITLOOP COMPREHENSIVE_DOC copy.md     # Comprehensive doc copy
│   ├── HABITLOOP COMPREHENSIVE_DOC.md          # Comprehensive documentation
│   ├── HABITLOOP_ML_SYSTEM_GUIDE.md            # ML system guide
│   ├── HABITMASTER_API_TESTING_GUIDE.md        # API testing guide
│   └── UPDATED_FOLDER_STRUCTURE_22.08.25.md    # This updated folder structure
├── 📁 test/                                    # Test files and documentation
│   ├── AcceptanceCriteria/                     # Acceptance criteria documentation
│   │   └── bkl_accpt_criteria_21.08.25.md      # Updated acceptance criteria
│   ├── API/                                    # API testing files
│   ├── Guest/                                  # Guest system testing
│   ├── Integration/                            # Integration testing
│   ├── Level_Streak_Audit/                     # XP and streak auditing
│   ├── ML/                                     # ML system testing
│   ├── PageStatus/                             # Page status documentation
│   ├── XP/                                     # XP system testing
│   ├── 20.08.25_Backend_Fixes/                 # Backend fixes documentation
│   ├── 20.08.25_Database_Setup/                # Database setup documentation
│   ├── 20.08.25_Frontend_Fixes/                # Frontend fixes documentation
│   ├── 20.08.25_Implementation_Plan/           # Implementation planning
│   ├── 20.08.25_Testing_Documentation/         # Testing documentation
│   ├── 20.08.25_Project_Organization_Summary.md # Project organization summary
│   ├── 2_DAY_CRITICAL_FIXES_PLAN.md            # Critical fixes plan
│   ├── comprehensive-responsive-design.md       # Responsive design documentation
│   ├── comprehensive_testing_plan.md            # Comprehensive testing plan
│   ├── FINAL_IMPLEMENTATION_SUMMARY.md         # Final implementation summary
│   ├── FILE_ORGANIZATION_SUMMARY.md            # File organization summary
│   ├── habitloop-acceptance-test.cjs           # Acceptance test script
│   ├── IMPLEMENTATION_SUMMARY.md               # Implementation summary
│   ├── manual_testing_test_cases.md            # Manual testing test cases
│   ├── mobile-responsiveness-audit.md          # Mobile responsiveness audit
│   ├── present_sup_18.08.25.md                 # Presentation documentation
│   ├── README.md                               # Test documentation README
│   ├── SUPABASE_TABLES_SETUP.sql               # Supabase tables setup
│   ├── THESIS_TESTING_SUMMARY.md               # Thesis testing summary
│   ├── USER_PROFILE_VIEW_DOCUMENTATION.md      # User profile documentation
│   ├── complete_james_bond_cleanup.sql         # James Bond cleanup script
│   ├── complete_setup.bat                      # Complete setup script
│   ├── create_missing_user.sql                 # Missing user creation script
│   ├── fix_environment_setup.bat               # Environment setup fix
│   ├── generate_test_data.sql                  # Test data generation
│   ├── setup.sh                                # Setup script
│   └── testbackup1.sql                         # Test backup
├── 📁 thesis/                                  # Thesis documentation
│   ├── Chapter4_SystemDesign.md                # System design chapter
│   ├── Chapter5_TestingQualityAssurance.md     # Testing and QA chapter
│   ├── Chapter6_ResultsAnalysis.md             # Results analysis chapter
│   ├── Chapter6_ResultsAnalysis_Enhanced.md    # Enhanced results analysis
│   ├── Chapter7_DiscussionEvaluation.md        # Discussion and evaluation
│   ├── Chapter7_Conclusion_and_Future_Work.md  # Conclusion and future work
│   ├── Chapter8_ConclusionsFutureWork.md       # Conclusions and future work
│   ├── Chapter8_References_Appendices_and_Supplementary_Materials.md # References and appendices
│   ├── generate_testing_results.cjs            # Testing results generator
│   ├── testing_results_data.json               # Testing results data
│   ├── testing_results_output.txt              # Testing results output
│   └── testing_summary_table.md                # Testing summary table
├── 📄 Root Level Files                         # Configuration and documentation
│   ├── .git/                                   # Git repository
│   ├── .gitignore                              # Git ignore rules
│   ├── .eslintrc.cjs                           # ESLint configuration
│   ├── .cursorignore                           # Cursor ignore rules
│   ├── .cursorindexingignore                   # Cursor indexing ignore
│   ├── .specstory/                             # SpecStory configuration
│   ├── COMPLETE_ML_ARCHITECTURE_DOCUMENTATION.md # ML architecture documentation
│   ├── EMAIL_INTEGRATION_FIXES_SUMMARY.md      # Email integration fixes
│   ├── FAIR_XP_SYSTEM_DOCUMENTATION.md         # XP system documentation
│   ├── HABITLOOP COMPREHENSIVE_DOC.md          # Comprehensive documentation
│   ├── HABITLOOP_PROFESSIONAL_DOCUMENTATION.md # Professional documentation
│   ├── HABITLOOP_PROFESSIONAL_DOCUMENTATION copy.md # Professional doc copy
│   ├── HABITLOOP_ML_SYSTEM_GUIDE.md            # ML system guide
│   ├── HABITLOOP_SYSTEM_GUIDE.md               # System guide
│   ├── HABITMASTER_API_TESTING_GUIDE.md        # API testing guide
│   ├── IMPLEMENTATION_DOCUMENTATION.md         # Implementation documentation
│   ├── ML_SYSTEM_IMPLEMENTATION_AUDIT.md       # ML system audit
│   ├── PROJECT_STRUCTURE_WITH_FUNCTIONS.md     # Project structure documentation
│   ├── README.md                               # Project README
│   ├── README-1008.md                          # README version 1008
│   ├── README-15.md                            # README version 15
│   ├── README (copy).md                        # README copy
│   ├── THESIS_CONCISE.md                       # Concise thesis documentation
│   ├── THESIS_DOCUMENTATION.md                 # Thesis documentation
│   ├── THESIS_DOCUMENTATION_COMPREHENSIVE.md   # Comprehensive thesis documentation
│   ├── TIMEZONE_IMPLEMENTATION_GUIDE.md        # Timezone implementation guide
│   ├── THEME_IMPLEMENTATION_GUIDE.md           # Theme implementation guide
│   ├── THEME_IMPLEMENTATION_SUMMARY.md         # Theme implementation summary
│   ├── THEME_REDESIGN_DOCUMENTATION.md         # Theme redesign documentation
│   ├── package.json                            # Root package configuration
│   ├── package-lock.json                       # Package lock file
│   ├── requirements.txt                        # Python dependencies
│   ├── tailwind.config.ts                      # Tailwind CSS configuration
│   ├── tsconfig.json                           # Root TypeScript configuration
│   ├── vite.config.ts                          # Root Vite configuration
│   ├── generated-icon.png                      # Generated application icon
│   ├── install_ml_dependencies.py              # ML dependencies installer
│   ├── test_email_mode.cjs                     # Email mode testing
│   ├── test_ml_integration.py                  # ML integration testing
│   ├── test_ml_model.py                        # ML model testing
│   ├── test_sendgrid_config.cjs                # SendGrid configuration test
│   ├── test_sendgrid_config.js                 # SendGrid configuration test
│   └── Various SQL files                       # Database testing and debugging scripts
```

## Key Updates in Current Structure

### **🆕 New Components Added**
- `HabitLoopLoginModal.tsx` - Unified authentication modal
- `NotificationPanel.tsx` - Notification system interface
- `MLAnalyticsCard.tsx` - ML analytics display
- `SimpleXPDisplay.tsx` - Clean XP display component
- `ChallengesSystem.tsx` - Enhanced challenge management

### **🆕 New Server Files**
- `notificationRoutes.ts` - Notification system API routes
- `notificationUtils.ts` - Notification system utilities
- Enhanced `authRoutes.ts` - Improved authentication logic
- Enhanced `mlPredictionRoutes.ts` - Better ML validation

### **🆕 New Documentation**
- `thesis/` directory - Complete thesis documentation
- `test/AcceptanceCriteria/` - Updated acceptance criteria
- Enhanced testing documentation and scripts
- Professional documentation files

### **🆕 New Testing Infrastructure**
- Comprehensive manual testing documentation
- SQL debugging and testing scripts
- Page status documentation
- Implementation summaries

### **📊 File Count Summary**
- **Client Components**: 25+ UI components
- **Server Routes**: 13 API route files
- **ML Models**: 7 trained model files
- **Documentation**: 50+ documentation files
- **Testing**: 30+ test and debugging files
- **Total Files**: 200+ files across the project

This updated structure reflects the current state of the HabitLoop application with all recent implementations, testing infrastructure, and comprehensive documentation for thesis presentation.
