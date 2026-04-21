import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react';
import { tokenService } from '../services/tokenService';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [lookupData, setLookupData] = useState(null);

  useEffect(() => {
    checkAuth();
    loadLookupData();
  }, []);

  const loadLookupData = () => {
    try {
      const storedData = localStorage.getItem('lookupTables');
      if (storedData) {
        setLookupData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Failed to load lookup data:', error);
    }
  };

  const checkAuth = () => {
    try {
      setIsLoading(true);
      const authenticated = tokenService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const role = tokenService.getUserRole();
        setUserRole(role);

        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }

      return authenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = (accessToken, refreshToken, userData) => {
    tokenService.setTokens(accessToken, refreshToken);

    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }

    const role = tokenService.getUserRole();
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    tokenService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
  };

  const updateLookupData = (data) => {
    setLookupData(data);
    localStorage.setItem('lookupTables', JSON.stringify(data));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        userRole,
        lookupData,
        login,
        logout,
        checkAuth,
        setLookupData: updateLookupData,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
