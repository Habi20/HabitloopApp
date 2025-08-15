import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { queryClient } from "./lib/queryClient";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Stats from "@/pages/Stats";
import Habits from "@/pages/Habits";
import Challenges from "@/pages/Challenges";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import { LoginPage } from "@/pages/LoginPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={LoginPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/stats" component={Stats} />
          <Route path="/habits" component={Habits} />
          <Route path="/challenges" component={Challenges} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}