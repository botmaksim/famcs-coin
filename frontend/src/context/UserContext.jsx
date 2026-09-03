import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserService } from '../api/services/UserService';
import { useUserStore } from '../store/useUserStore';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { soundEnabled, toggleSound, localUser, setLocalUser, updateLocalUser } = useUserStore();
  const [loading, setLoading] = useState(!localUser);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await UserService.getProfile();
      if (response.data) {
        setLocalUser(response.data);
      }
      return response.data;
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setLocalUser]);

  // Automatically refresh profile on mount, route/tab switch, and window/app focus
  useAutoRefresh(fetchProfile);

  // Smooth real-time energy refill (+3 per second) up to max_energy
  useEffect(() => {
    const timer = setInterval(() => {
      if (localUser) {
        const max = localUser.max_energy || localUser.maxEnergy || 1000;
        if (localUser.energy < max) {
          updateLocalUser({
            energy: Math.min(max, localUser.energy + 3),
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [localUser, updateLocalUser]);

  const user = localUser || {
    balance: 0,
    energy: 1000,
    max_energy: 1000,
    maxEnergy: 1000,
    passive_income: 0,
    passiveIncome: 0,
    role: 'user',
  };

  const value = {
    user,
    loading,
    error,
    fetchProfile,
    updateLocalUser,
    soundEnabled,
    toggleSound,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      error: null,
      fetchProfile: async () => {},
      updateLocalUser: () => {},
      soundEnabled: true,
      toggleSound: () => {},
    };
  }
  return ctx;
};
