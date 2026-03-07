import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    // Axios interceptor to attach Bearer token
    const interceptor = axios.interceptors.request.use(config => {
      const t = localStorage.getItem('token');
      if (t) {
        config.headers.Authorization = `Bearer ${t}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  useEffect(() => {
    if (token) {
      axios.get('/api/auth/me')
        .then(res => setAdmin(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setAdmin(null);
        });
    }
  }, [token]);

  const login = (tokenValue, memberData) => {
    localStorage.setItem('token', tokenValue);
    setToken(tokenValue);
    setAdmin(memberData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
