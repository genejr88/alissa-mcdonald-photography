import { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, getMe } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('amp_token'));

  useEffect(() => {
    if (!localStorage.getItem('amp_token')) return;
    getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('amp_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const data = await apiLogin(username, password);
    localStorage.setItem('amp_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('amp_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
