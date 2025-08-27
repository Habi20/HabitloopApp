// client/src/pages/Challenges.tsx
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { ChallengesSystem } from "@/components/ChallengesSystem";

export default function Challenges() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
    return null;
  }

  return (
    <Layout
      showSidebar={true}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={setSidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      pageTitle="Challenges"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-gray-600 text-center">
            Complete challenges to earn XP and unlock achievements. Track your
            progress and claim rewards!
          </p>
        </div>

        <ChallengesSystem />
      </div>
    </Layout>
  );
}
