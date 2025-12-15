import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useAuthStore = create()(persist((set) => ({
    user: null,
    token: null,
    setAuth: (payload) => set({ user: payload.user, token: payload.token }),
    logout: () => set({ user: null, token: null })
}), {
    name: "seabattle-auth",
    partialize: (state) => ({ user: state.user, token: state.token })
}));
