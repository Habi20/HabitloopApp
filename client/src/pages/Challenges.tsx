// client/src/pages/Challenges.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { ChallengesSystem } from "@/components/ChallengesSystem";

export default function Challenges() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Challenges & Achievements
            </h1>
            <p className="text-gray-600">
              Complete challenges to earn XP and unlock achievements. Track your progress and claim rewards!
            </p>
          </div>

          <ChallengesSystem />
        </div>
      </main>
    </div>
  );
}
