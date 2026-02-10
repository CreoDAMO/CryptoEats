import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo/fetch';
import { getApiUrl } from './query-client';

interface User {
  id: string;
  email: string;
  role: string;
}

interface CustomerProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  idVerified?: boolean;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: User | null;
  customer: CustomerProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, phone: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('cryptoeats_auth_token');
        const storedUser = await AsyncStorage.getItem('cryptoeats_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Validate token by fetching profile
          try {
            const baseUrl = getApiUrl();
            const profileUrl = new URL('/api/customers/profile', baseUrl);
            const res = await fetch(profileUrl.toString(), {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${storedToken}`,
              },
              credentials: 'include',
            });

            if (res.ok) {
              const profile = await res.json();
              setCustomer(profile);
            } else {
              // Token is invalid or expired, clear stored data
              await AsyncStorage.removeItem('cryptoeats_auth_token');
              await AsyncStorage.removeItem('cryptoeats_user');
              setToken(null);
              setUser(null);
              setCustomer(null);
            }
          } catch (error) {
            // Error validating token, clear stored data
            await AsyncStorage.removeItem('cryptoeats_auth_token');
            await AsyncStorage.removeItem('cryptoeats_user');
            setToken(null);
            setUser(null);
            setCustomer(null);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const baseUrl = getApiUrl();
      const loginUrl = new URL('/api/auth/login', baseUrl);

      const res = await fetch(loginUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Login failed: ${res.status} ${errorText || res.statusText}`);
      }

      const data = await res.json();
      const { token: newToken, user: newUser } = data;

      if (!newToken || !newUser) {
        throw new Error('Invalid login response format');
      }

      // Store token and user
      await AsyncStorage.setItem('cryptoeats_auth_token', newToken);
      await AsyncStorage.setItem('cryptoeats_user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      // Fetch customer profile
      try {
        const profileUrl = new URL('/api/customers/profile', baseUrl);
        const profileRes = await fetch(profileUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
          credentials: 'include',
        });

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setCustomer(profile);
        }
      } catch (error) {
        console.error('Failed to fetch customer profile:', error);
      }
    } catch (error) {
      // Clear state on error
      setToken(null);
      setUser(null);
      setCustomer(null);
      await AsyncStorage.removeItem('cryptoeats_auth_token');
      await AsyncStorage.removeItem('cryptoeats_user');
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, phone: string, role: string) => {
    try {
      const baseUrl = getApiUrl();
      const registerUrl = new URL('/api/auth/register', baseUrl);

      const res = await fetch(registerUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName, phone, role }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Registration failed: ${res.status} ${errorText || res.statusText}`);
      }

      const data = await res.json();
      const { token: newToken, user: newUser } = data;

      if (!newToken || !newUser) {
        throw new Error('Invalid registration response format');
      }

      // Store token and user
      await AsyncStorage.setItem('cryptoeats_auth_token', newToken);
      await AsyncStorage.setItem('cryptoeats_user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      // Fetch customer profile
      try {
        const profileUrl = new URL('/api/customers/profile', baseUrl);
        const profileRes = await fetch(profileUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
          credentials: 'include',
        });

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setCustomer(profile);
        }
      } catch (error) {
        console.error('Failed to fetch customer profile:', error);
      }
    } catch (error) {
      // Clear state on error
      setToken(null);
      setUser(null);
      setCustomer(null);
      await AsyncStorage.removeItem('cryptoeats_auth_token');
      await AsyncStorage.removeItem('cryptoeats_user');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('cryptoeats_auth_token');
      await AsyncStorage.removeItem('cryptoeats_user');
      setToken(null);
      setUser(null);
      setCustomer(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }, []);

  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

  const value = useMemo(
    () => ({
      user,
      customer,
      token,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, customer, token, isAuthenticated, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
