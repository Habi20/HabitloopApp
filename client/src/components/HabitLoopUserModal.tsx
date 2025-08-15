import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface HabitLoopUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface HabitLoopUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  level: number;
  xp: number;
  difficulty: string;
  avatar: string;
  description: string;
}

const HABITLOOP_USERS: HabitLoopUser[] = [
  {
    id: "user-001",
    username: "user-001",
    firstName: "Alex",
    lastName: "Chen",
    level: 15,
    xp: 2840,
    difficulty: "medium",
    avatar: "👨‍💻",
    description: "Productivity enthusiast with 15-day streak"
  },
  {
    id: "user-002",
    username: "user-002",
    firstName: "Sarah",
    lastName: "Johnson",
    level: 8,
    xp: 1240,
    difficulty: "easy",
    avatar: "👩‍🎨",
    description: "Creative habits builder, 8-day streak"
  },
  {
    id: "user-003",
    username: "user-003",
    firstName: "Marcus",
    lastName: "Rodriguez",
    level: 22,
    xp: 4560,
    difficulty: "hard",
    avatar: "🏃‍♂️",
    description: "Fitness champion, 30-day streak"
  },
  {
    id: "user-004",
    username: "user-004",
    firstName: "Emma",
    lastName: "Thompson",
    level: 12,
    xp: 1980,
    difficulty: "medium",
    avatar: "🧘‍♀️",
    description: "Mindfulness advocate, 12-day streak"
  },
  {
    id: "user-005",
    username: "user-005",
    firstName: "David",
    lastName: "Kim",
    level: 18,
    xp: 3420,
    difficulty: "hard",
    avatar: "📚",
    description: "Learning machine, 25-day streak"
  },
  {
    id: "user-006",
    username: "user-006",
    firstName: "Lisa",
    lastName: "Wang",
    level: 6,
    xp: 890,
    difficulty: "easy",
    avatar: "🌱",
    description: "New habit builder, 6-day streak"
  },
  {
    id: "user-007",
    username: "user-007",
    firstName: "New",
    lastName: "User",
    level: 1,
    xp: 0,
    difficulty: "easy",
    avatar: "🆕",
    description: "Fresh start, no habits yet"
  },
  {
    id: "user-008",
    username: "user-008",
    firstName: "Fresh",
    lastName: "Start",
    level: 1,
    xp: 0,
    difficulty: "easy",
    avatar: "🌟",
    description: "Beginner with zero experience"
  },
  {
    id: "user-009",
    username: "user-009",
    firstName: "Beginner",
    lastName: "Tester",
    level: 1,
    xp: 0,
    difficulty: "easy",
    avatar: "🎯",
    description: "Testing from ground zero"
  }
];

export function HabitLoopUserModal({ open, onClose, onSuccess }: HabitLoopUserModalProps) {
  const [selectedUser, setSelectedUser] = useState<HabitLoopUser | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { loginAsHabitLoopUser } = useAuth();

  const handleUserSelect = async (user: HabitLoopUser) => {
    setLoading(true);
    try {
      await loginAsHabitLoopUser(user);
      
      toast({
        title: "Welcome to HabitLoop! 🎉",
        description: `Logged in as ${user.firstName} ${user.lastName}`,
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-users text-white text-2xl"></i>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              Try as a HabitLoop User
            </DialogTitle>
            <DialogDescription className="text-gray-600 mb-6">
              Experience HabitLoop with pre-configured user profiles. Each user has different habits, 
              streaks, and progress to demonstrate the full range of features.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HABITLOOP_USERS.map((user) => (
            <Card 
              key={user.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 ${
                selectedUser?.id === user.id 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-3">{user.avatar}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{user.username}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Level:</span>
                      <span className="font-semibold text-indigo-600">{user.level}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">XP:</span>
                      <span className="font-semibold text-purple-600">{user.xp.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(user.difficulty)}`}>
                        {user.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-4">{user.description}</p>
                  
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserSelect(user);
                    }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Logging in...
                      </div>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        Login as {user.firstName}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            These are demo accounts with pre-configured data to showcase HabitLoop's features.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
