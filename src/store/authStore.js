import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      refreshToken: null,
      justLoggedIn: false,

      setAuth: ({ user, refreshToken }) =>
        set({ user, refreshToken, justLoggedIn: true }),

      clearLoginFlag: () => set({ justLoggedIn: false }),

      updateUser: (userData) =>
        set((state) => ({ user: { ...state.user, ...userData } })),

      logout: () => set({ user: null, refreshToken: null, justLoggedIn: false }),
    }),
    {
      name: "auth-storage",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          return { user: null, refreshToken: null, justLoggedIn: false };
        }
        return persistedState;
      },
    }
  )
);