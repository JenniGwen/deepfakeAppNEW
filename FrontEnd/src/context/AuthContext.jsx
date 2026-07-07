import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

import { supabase } from '../supabase';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(() => !!sessionStorage.getItem('googleAuthPending'));
  const [authLoadingMessage, setAuthLoadingMessage] = useState(() =>
    sessionStorage.getItem('googleAuthPending') ? 'Signing in with Google...' : ''
  );

  useEffect(() => {
    // 1. Restore user dari localStorage saat app pertama kali load
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // 2. Listen to Supabase Auth State (Khusus Google OAuth)
    // Subscription dibuat SEKALI saja saat mount, bukan setiap token berubah
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            // Exchange Supabase session for a backend JWT so user_id is consistent
            // with email/password login (both map to the same row in `users` table)
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
            const response = await fetch(`${apiUrl}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: session.user.email,
                display_name: session.user.user_metadata?.full_name || session.user.email,
              }),
            });
            const data = await response.json();

            if (response.ok && data.status === 'success') {
              setToken(data.data.access_token);
              setUser(data.data.user);
              localStorage.setItem('token', data.data.access_token);
              localStorage.setItem('user', JSON.stringify(data.data.user));
            } else {
              // Fallback: pakai Supabase session langsung jika backend gagal
              const fallbackUser = {
                display_name: session.user.user_metadata?.full_name || session.user.email,
                email: session.user.email,
                role: 'user',
                user_id: session.user.id
              };
              setToken(session.access_token);
              setUser(fallbackUser);
              localStorage.setItem('token', session.access_token);
              localStorage.setItem('user', JSON.stringify(fallbackUser));
            }
          } catch {
            // Network error fallback
            const fallbackUser = {
              display_name: session.user.user_metadata?.full_name || session.user.email,
              email: session.user.email,
              role: 'user',
              user_id: session.user.id
            };
            setToken(session.access_token);
            setUser(fallbackUser);
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('user', JSON.stringify(fallbackUser));
          }

          // Clear Google auth pending flag & stop loading
          sessionStorage.removeItem('googleAuthPending');
          setAuthLoading(false);
          setAuthLoadingMessage('');
        }
        // SIGNED_OUT dari Supabase tidak kita handle di sini karena:
        // - Login email/password pakai JWT sendiri, bukan Supabase session
        // - Logout sudah ditangani langsung di fungsi logout()
      }
    );

    setLoading(false);

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // ← empty deps: subscription dibuat SEKALI saat mount

  const login = async (email, password) => {
    setAuthLoading(true);
    setAuthLoadingMessage('Signing in...');
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
    } finally {
      setAuthLoading(false);
      setAuthLoadingMessage('');
    }
  };

  const register = async (email, password, username, displayName) => {
    setAuthLoading(true);
    setAuthLoadingMessage('Creating your account...');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const payload = { email, password, username, display_name: displayName };
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network error or server down' };
    } finally {
      setAuthLoading(false);
      setAuthLoadingMessage('');
    }
  };

  const startGoogleLogin = async () => {
    try {
      sessionStorage.setItem('googleAuthPending', 'true');
      setAuthLoading(true);
      setAuthLoadingMessage('Signing in with Google...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/' }
      });
      if (error) {
        sessionStorage.removeItem('googleAuthPending');
        setAuthLoading(false);
        setAuthLoadingMessage('');
        return { success: false, message: error.message };
      }
      // After this, browser redirects to Google — state is preserved via sessionStorage
      return { success: true };
    } catch (error) {
      sessionStorage.removeItem('googleAuthPending');
      setAuthLoading(false);
      setAuthLoadingMessage('');
      return { success: false, message: 'Google authentication failed.' };
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
    setAuthLoading(true);
    setAuthLoadingMessage('Signing out...');
    try {
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        await fetch(`${apiUrl}/api/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      // Khusus untuk supabase oauth session state
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during logout call", error);
    } finally {
      setToken(null);
      setUser(null);
      
      // Simpan preferensi UI agar tidak hilang saat session dihapus
      const theme = localStorage.getItem('theme');
      const introPlayed = sessionStorage.getItem('introPlayed');
      
      // Sapu bersih semua data storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Kembalikan preferensi UI
      if (theme) localStorage.setItem('theme', theme);
      if (introPlayed) sessionStorage.setItem('introPlayed', introPlayed);

      setAuthLoading(false);
      setAuthLoadingMessage('');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authLoading, authLoadingMessage, login, startGoogleLogin, loginWithGoogle, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
