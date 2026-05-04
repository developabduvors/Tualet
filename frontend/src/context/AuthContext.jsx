import { createContext, useContext, useEffect, useState } from 'react';
import { request } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('toilet_finder_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (token) {
      localStorage.setItem('toilet_finder_token', token);
      loadCurrentUser();
    } else {
      localStorage.removeItem('toilet_finder_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  async function loadCurrentUser() {
    try {
      const response = await request('/auth/me');
      setUser(response.data);
    } catch (error) {
      setToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function login(newToken) {
    setToken(newToken);
  }

  function logout() {
    setToken('');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
