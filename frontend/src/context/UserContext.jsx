import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserService } from '../api/services/UserService';
import { useUserStore } from '../store/useUserStore';

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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    throw new Error('useUser must be used within UserProvider');
  }
  return ctx;
};
