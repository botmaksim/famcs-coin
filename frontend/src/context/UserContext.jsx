import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

export const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    balance: 0,
    energy: 1000,
    maxEnergy: 1000,
    passiveIncome: 0,
    role: 'user',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const tg = window.Telegram?.WebApp;
      const tgUser = tg?.initDataUnsafe?.user || {};
      
      const payload = {
        first_name: tgUser.first_name || '',
        last_name: tgUser.last_name || '',
        username: tgUser.username || '',
        photo_url: tgUser.photo_url || ''
      };

      const response = await apiClient.post('/user/profile', payload);
      // Assume backend returns the user object directly
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update user state locally (e.g., after clicking)
  const updateLocalUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ user, loading, error, fetchProfile, updateLocalUser }}>
      {children}
    </UserContext.Provider>
  );
};
