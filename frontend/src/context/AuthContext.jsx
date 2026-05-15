import { createContext, useContext, useEffect, useState } from 'react';
import {
  beginGoogleAuth,
  getSession,
  signOutSession,
  loginWithCredentials,
  registerWithCredentials,
} from '../lib/api';

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

  // Google bilan kirish
  async function loginGoogle() {
    await beginGoogleAuth(window.location.origin);
  }

  // Email/parol bilan kirish
  async function login(email, password) {
    const session = await loginWithCredentials(email, password);
    setUser(session.user);
    return session;
  }

  // Ro'yxatdan o'tish
  async function register(name, email, password) {
    await registerWithCredentials(name, email, password);
    // Avtomatik login
    const session = await loginWithCredentials(email, password);
    setUser(session.user);
    return session;
  }

  async function logout() {
    await signOutSession(`${window.location.origin}/login`);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginGoogle,
        register,
        logout,
        setUser,
        refreshUser: loadCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
