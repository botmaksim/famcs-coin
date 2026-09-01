import { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserService } from '../api/services/UserService';
import { useUserStore } from '../store/useUserStore';

export const UserContext = createContext();

export const useUser = () => {
  const queryClient = useQueryClient();
  const { soundEnabled, toggleSound, localUser, updateLocalUser, setLocalUser } = useUserStore();

  const { data: userQuery, isLoading: loading, error, refetch: fetchProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await UserService.getProfile();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (userQuery) {
      setLocalUser(userQuery);
    }
  }, [userQuery, setLocalUser]);

  // Merge local optimistic updates with server data
  const user = localUser || userQuery || {
    balance: 0,
    energy: 1000,
    maxEnergy: 1000,
    passiveIncome: 0,
    role: 'user',
  };

  return {
    user,
    loading,
    error: error ? error.message : null,
    fetchProfile,
    updateLocalUser,
    soundEnabled,
    toggleSound
  };
};

// Keep UserProvider to avoid breaking changes in main App tree, but it doesn't need to hold state anymore
export const UserProvider = ({ children }) => {
  // Can provide empty object or dummy since useUser no longer consumes the context directly
  return <UserContext.Provider value={{}}>{children}</UserContext.Provider>;
};
