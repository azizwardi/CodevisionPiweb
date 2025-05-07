import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface DecodedToken {
  id?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  exp?: number;
  iat?: number;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded.exp) return true;
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  // Function to extract user info from token
  const extractUserFromToken = (token: string): User | null => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);

      // Handle different token formats
      if (decoded.id) {
        // Format 1: { id: "...", email: "...", role: "..." }
        return {
          id: decoded.id,
          username: decoded.name || decoded.email || 'User',
          email: decoded.email || '',
          role: decoded.role || '',
          firstName: decoded.name?.split(' ')[0],
          lastName: decoded.name?.split(' ').slice(1).join(' '),
          avatarUrl: localStorage.getItem('userAvatarUrl') || undefined
        };
      } else if (decoded.user && decoded.user.id) {
        // Format 2: { user: { id: "...", email: "...", role: "..." } }
        return {
          id: decoded.user.id,
          username: decoded.user.email.split('@')[0],
          email: decoded.user.email,
          role: decoded.user.role,
          avatarUrl: localStorage.getItem('userAvatarUrl') || undefined
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');

        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log('Token is expired, but not removing it');
          // Ne pas supprimer le token expiré pour éviter les redirections
          // Nous le garderons pour permettre à l'utilisateur de rester sur la page
          // mais nous marquerons l'utilisateur comme non authentifié
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        // Extract user info from token
        const extractedUser = extractUserFromToken(token);
        if (extractedUser) {
          setUser(extractedUser);
          setIsAuthenticated(true);

          // Store role in localStorage for compatibility with existing code
          if (extractedUser.role) {
            localStorage.setItem('userRole', extractedUser.role);
          }

          // Essayer de récupérer des informations utilisateur supplémentaires depuis le backend
          try {
            const response = await axios.get(`http://localhost:5000/api/user/showByid/${extractedUser.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.data) {
              // Mettre à jour l'utilisateur avec les données complètes
              setUser(prev => ({
                ...prev,
                ...response.data,
                id: extractedUser.id // Garder l'ID original
              }));
            }
          } catch (fetchError) {
            console.error('Error fetching additional user data:', fetchError);
            // Continuer avec les données extraites du token
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for storage events (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        if (e.newValue) {
          const extractedUser = extractUserFromToken(e.newValue);
          if (extractedUser) {
            setUser(extractedUser);
            setIsAuthenticated(true);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom auth change events
    const handleAuthChange = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const extractedUser = extractUserFromToken(token);
        if (extractedUser) {
          setUser(extractedUser);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, role } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);

      const extractedUser = extractUserFromToken(token);
      if (extractedUser) {
        setUser(extractedUser);
        setIsAuthenticated(true);
      }

      // Notify other components about the login
      window.dispatchEvent(new Event('authChange'));
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');

      if (token) {
        // Essayer d'appeler l'API de déconnexion, mais ne pas bloquer si ça échoue
        try {
          await axios.post(
            "http://localhost:5000/api/auth/logout",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (logoutError) {
          console.error("Error during API logout:", logoutError);
          // Continuer même si l'API échoue
        }
      }

      // Toujours nettoyer le localStorage et l'état local
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      setUser(null);
      setIsAuthenticated(false);

      // Notify other components about the logout
      window.dispatchEvent(new Event('authChange'));
    } catch (error) {
      console.error("Error during logout:", error);
      // Même en cas d'erreur, essayer de nettoyer l'état
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    if (isTokenExpired(token)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    const extractedUser = extractUserFromToken(token);
    if (extractedUser) {
      setUser(extractedUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
