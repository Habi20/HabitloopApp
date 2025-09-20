
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { useAuth } from './contexts/AuthContext';
import { useEnhancedSessionMonitor } from './hooks/useEnhancedSessionMonitor';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { ConnectionStatus } from './components/ConnectionStatus';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Stats from './pages/Stats';
import Habits from './pages/Habits';
import Challenges from './pages/Challenges';
import { GoogleCalendarCallback } from './pages/GoogleCalendarCallback';
import { DebugRoute } from './pages/DebugRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated } = useAuth();
  
  // Session monitoring
  const {
    showTimeoutModal,
    showMultiDeviceModal,
    showExpiredModal,
    modalType,
    timeRemaining,
    extendSession,
    handleLogout,
    handleModalClose,
  } = useEnhancedSessionMonitor();

  // Determine which modal to show
  const isModalOpen = showTimeoutModal || showMultiDeviceModal || showExpiredModal;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Switch>
          {/* OAuth2 callback routes - use simpler path */}
          <Route path="/google-callback" component={GoogleCalendarCallback} />
          <Route path="/callback" component={GoogleCalendarCallback} />
          <Route path="/auth/google/callback" component={GoogleCalendarCallback} />
          
          {/* Test route for debugging */}
          <Route path="/test-callback" component={GoogleCalendarCallback} />
          <Route path="/debug-route" component={DebugRoute} />
          
          {/* Public routes */}
          <Route path="/" component={Landing} />
          
          {/* Admin routes - always accessible */}
          <Route path="/admin" component={Admin} />
          
          {/* Protected routes */}
          {isAuthenticated ? (
            <>
              <Route path="/home" component={Home} />
              <Route path="/stats" component={Stats} />
              <Route path="/habits" component={Habits} />
              <Route path="/challenges" component={Challenges} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
            </>
          ) : (
            // Fallback routes for unauthenticated users
            <>
              <Route path="/home" component={Landing} />
              <Route path="/stats" component={Landing} />
              <Route path="/habits" component={Landing} />
              <Route path="/challenges" component={Landing} />
              <Route path="/profile" component={Landing} />
              <Route path="/settings" component={Landing} />
            </>
          )}
          
          {/* Catch-all route - but exclude OAuth2 callbacks */}
          <Route path="/:rest*" component={Landing} />
        </Switch>

        {/* Session timeout modal */}
        <SessionTimeoutModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onExtend={extendSession}
          onLogout={handleLogout}
          type={modalType}
          timeRemaining={timeRemaining}
        />

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Connection Status Indicator */}
        <ConnectionStatus />

        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;