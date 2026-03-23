import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    if (token && role) {
      setUser({ token, role, username, email });
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', data.username);
    if (data.email) localStorage.setItem('email', data.email);
    setUser({ token: data.access, role: data.role, username: data.username, email: data.email });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
