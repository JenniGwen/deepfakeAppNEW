import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

import { supabase } from '../supabase';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check existing normal token
    if (token) {
      localStorage.setItem('token', token);
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }

    // 2. Listen to Supabase Auth State (Khusus Google OAuth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Ketika Login Google Berhasil, extract data profil:
          const supabaseToken = session.access_token;
          const supabaseUser = {
            display_name: session.user.user_metadata?.full_name || session.user.email,
            email: session.user.email,
            role: 'user',
            user_id: session.user.id
          };
          
          setToken(supabaseToken);
          setUser(supabaseUser);
          
          // Simpan ke localStorage agar tidak ter-logout saat refresh
          localStorage.setItem('token', supabaseToken);
          localStorage.setItem('user', JSON.stringify(supabaseUser));
        } else if (event === 'SIGNED_OUT') {
           setToken(null);
           setUser(null);
           localStorage.removeItem('token');
           localStorage.removeItem('user');
        }
      }
    );

    setLoading(false);
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [token]);

  const login = async (email, password) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setToken(data.data.access_token);
        setUser(data.data.user);
        localStorage.setItem('token', data.data.access_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network error or server down' };
    }
  };

  const register = async (email, password, username, displayName) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      // Adjust payload based on backend needs
      const payload = { email, password, username, display_name: displayName };
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        // You generally redirect to login, or login automatically
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network error or server down' };
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken }),
      });
      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setToken(data.data.access_token);
        setUser(data.data.user);
        localStorage.setItem('token', data.data.access_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Google Auth failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network error or server down' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        await fetch(`${apiUrl}/api/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Error during logout call", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
