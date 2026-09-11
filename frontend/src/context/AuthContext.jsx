import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to extract role from user object or profile
  const getRoleFromUser = (userObj) => {
    if (!userObj) return 'user';
    return (
      userObj.role ||
      userObj.user_metadata?.role ||
      userObj.app_metadata?.role ||
      'user'
    );
  };

  const role = getRoleFromUser(user);
  const isAdmin = role === 'admin';

  // Check initial session & listen to state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Error fetching Supabase auth session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data?.session) {
        setSession(data.session);
        setUser(data.user || data.session.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    setLoading(true);
    try {
      const data = await authService.register(email, password, fullName);
      if (data?.session) {
        setSession(data.session);
        setUser(data.user || data.session.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const { data, error } = await supabase.auth.updateUser({
      data: profileData,
    });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const value = {
    user,
    session,
    loading,
    role,
    isAdmin,
    login,
    register,
    logout,
    updateProfile,
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
