import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

type Habit = {
  id: string;
  name: string;
  frequency: string;
};

type Completion = {
  id: string;
  date: string;
  habitId: string;
};

// Supabase user structure
type SupabaseUser = {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmation_sent_at: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    email: string;
    email_verified: boolean;
    first_name: string;
    last_name: string;
    phone_verified: boolean;
    sub: string;
  };
  identities: Array<{
    identity_id: string;
    id: string;
    user_id: string;
    identity_data: any;
    provider: string;
    last_sign_in_at: string;
    created_at: string;
    updated_at: string;
    email: string;
  }>;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
};

// Guest user structure
type GuestUser = {
  id: string;
  email?: string;
  name: string;
  isGuest: boolean;
  habits: Habit[];
  completions: Completion[];
};

type User = SupabaseUser | GuestUser;

export function useAuth() {
  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn<User | null>({ on401: "returnNull" }),
    retry: false,
    initialData: localStorage.getItem("guestUser")
      ? JSON.parse(localStorage.getItem("guestUser")!)
      : null,
  });

  const loginAsGuest = async (): Promise<User> => {
    const guestUser: User = {
      id: `guest-${Date.now()}`,
      name: "Guest",
      isGuest: true,
      habits: [],
      completions: [],
    };
    localStorage.setItem("guestUser", JSON.stringify(guestUser));
    return guestUser;
  };

  // Helper function to check if user is guest
  const isGuestUser = (user: User | null): user is GuestUser => {
    return user !== null && "isGuest" in user && user.isGuest === true;
  };

  // Helper function to get user display name
  const getUserDisplayName = (user: User | null): string => {
    if (!user) return "User";

    if (isGuestUser(user)) {
      return user.name;
    }

    // Supabase user
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    return `${firstName} ${lastName}`.trim() || "User";
  };

  // Helper function to get user email
  const getUserEmail = (user: User | null): string => {
    if (!user) return "";

    if (isGuestUser(user)) {
      return user.email || "";
    }

    // Supabase user
    return user.email || "";
  };

  // Helper function to get user initials
  const getUserInitials = (user: User | null): string => {
    if (!user) return "U";

    if (isGuestUser(user)) {
      return user.name.charAt(0).toUpperCase();
    }

    // Supabase user
    const firstName = user.user_metadata?.first_name || "";
    const lastName = user.user_metadata?.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isGuest: isGuestUser(user),
    getUserDisplayName,
    getUserEmail,
    getUserInitials,
    loginAsGuest,
    refetch,
  };
}
