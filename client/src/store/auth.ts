import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthPayload, AuthUser } from "../types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (payload: AuthPayload) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (payload: AuthPayload) => set({ user: payload.user, token: payload.token }),
      setUser: (user: AuthUser | null) => set({ user }),
      logout: () => set({ user: null, token: null })
    }),
    {
      name: "seabattle-auth",
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);
