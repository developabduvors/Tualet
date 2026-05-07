import { createContext, useContext, useEffect, useState } from 'react';
import { request, setTokens, clearTokens, getAccessToken } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getAccessToken() || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!accessToken);

  useEffect(() => {
    if (accessToken) {
      loadCurrentUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [accessToken]);

  async function loadCurrentUser() {
    try {
      const response = await request('/auth/me');
      setUser(response.data);
    } catch (error) {
      // request() 401 da tokenlarni tozalab redirect qiladi — bu yerda
      // shunchaki state'ni tozalaymiz.
      setAccessToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function login(newAccessToken, newRefreshToken) {
    setTokens(newAccessToken, newRefreshToken);
    setAccessToken(newAccessToken);
  }

  function logout() {
    clearTokens();
    setAccessToken('');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ accessToken, user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
