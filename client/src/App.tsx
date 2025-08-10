// import { Switch, Route } from "wouter";
// import { queryClient } from "./lib/queryClient";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { useAuth } from "@/hooks/useAuth";
// import Landing from "@/pages/Landing";
// import Home from "@/pages/Home";
// import Stats from "@/pages/Stats";
// import Habits from "@/pages/Habits";
// import Challenges from "@/pages/Challenges";
// import Profile from "@/pages/Profile";
// import Settings from "@/pages/Settings";
// import { LoginPage } from "@/pages/LoginPage";
// import NotFound from "@/pages/not-found";

// function Router() {
//   const { isAuthenticated, isLoading } = useAuth();

//   return (
//     <Switch>
//       {isLoading || !isAuthenticated ? (
//         <Route path="/" component={Landing} />
//       ) : (
//         <>
//           <Route path="/" component={Home} />
//           <Route path="/stats" component={Stats} />
//           <Route path="/habits" component={Habits} />
//           <Route path="/challenges" component={Challenges} />
//           <Route path="/profile" component={Profile} />
//           <Route path="/settings" component={Settings} />
//           <Route path="/login" component={LoginPage} />
//         </>
//       )}
//       <Route component={NotFound} />
//     </Switch>
//   );
// }

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Router />
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }

// export default App;

// App.tsx
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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
    return <div>Loading...</div>; // Add proper loading component
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}