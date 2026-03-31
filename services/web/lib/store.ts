import { create } from "zustand";

interface User {
  id: string;
  email: string;
  role: string;
  displayName: string;
  privileges: string[];
  totpEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  hasPrivilege: (priv: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  hasPrivilege: (priv) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === "superadmin") return true;
    return user.privileges.includes(priv);
  },
  isAdmin: () => {
    const { user } = get();
    return user?.role === "admin" || user?.role === "superadmin";
  },
}));
