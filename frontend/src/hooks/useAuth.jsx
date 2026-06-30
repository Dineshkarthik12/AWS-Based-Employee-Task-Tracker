import { createContext, useContext, useState, useEffect } from 'react';
import { signIn as cognitoSignIn, signOut as cognitoSignOut, isAuthenticated } from '../services/auth';
import { getProfile } from '../services/taskService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (isAuthenticated()) {
      try {
        const res = await getProfile();
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        console.error('Auth check failed:', err);
        cognitoSignOut();
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    await cognitoSignIn(email, password);
    const res = await getProfile();
    const userData = res.data.data;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    cognitoSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
