import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    return await authService.login(email, password);
  };

  const register = async (email, password, fullName) => {
    return await authService.register(email, password, fullName);
  };

  const logout = async () => {
    return await authService.logout();
  };

  const role = user?.user_metadata?.role || 'user';
  const isAdmin = role === 'admin';

  const value = {
    user,
    session,
    loading,
    role,
    isAdmin,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
