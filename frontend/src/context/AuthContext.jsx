import { createContext, useContext, useEffect, useState } from 'react';
import { beginGoogleAuth, getSession, signOutSession } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    try {
      const session = await getSession();
      setUser(session?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    await beginGoogleAuth(window.location.origin);
  }

  async function logout() {
    await signOutSession(`${window.location.origin}/login`);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refreshUser: loadCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
