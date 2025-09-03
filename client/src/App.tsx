
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { useAuth } from './contexts/AuthContext';
import { useEnhancedSessionMonitor } from './hooks/useEnhancedSessionMonitor';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';

// Pages
import Landing from './pages/Landing';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Stats from './pages/Stats';
import Habits from './pages/Habits';
import Challenges from './pages/Challenges';

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
          
          {/* Catch-all route */}
          <Route component={Landing} />
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

        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;