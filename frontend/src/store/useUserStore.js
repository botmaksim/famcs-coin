import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      
      // Local optimistic user state (can be merged with query data later if needed)
      localUser: null,
      setLocalUser: (user) => set({ localUser: user }),
      updateLocalUser: (updates) => set((state) => ({ 
        localUser: state.localUser ? { ...state.localUser, ...updates } : updates 
      })),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ soundEnabled: state.soundEnabled, localUser: state.localUser }),
    }
  )
);
