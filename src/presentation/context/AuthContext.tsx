import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const checkingRef = useRef(false); // Ref para evitar múltiples llamadas simultáneas

  const checkAuth = async () => {
    // Evitar múltiples llamadas simultáneas
    if (checkingRef.current) {
      console.log('[AuthContext] Ya hay una verificación en curso, ignorando...');
      return;
    }
    
    checkingRef.current = true;
    try {
      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos timeout

      const response = await fetch('/api/auth/status', {
        credentials: 'include',
        signal: controller.signal,
      }).catch((fetchError) => {
        // Si fetch falla (red, CORS, etc.), lanzar el error
        throw fetchError;
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated || false);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      // Solo loguear errores importantes, no timeouts normales
      if (error.name !== 'AbortError' && !error.message?.includes('Failed to fetch')) {
        console.warn('[AuthContext] Error al verificar autenticación:', error.message || error);
      }
      // En caso de error, asumir que no está autenticado y continuar
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      checkingRef.current = false; // Permitir nuevas verificaciones
    }
  };

  useEffect(() => {
    // Solo verificar una vez al montar el componente
    // React StrictMode ejecuta efectos dos veces en desarrollo, pero el ref evita peticiones duplicadas
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (token: string): Promise<boolean> => {
    try {
      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch('/api/auth/validate-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AuthContext] Error en validación TOTP:', errorData);
        return false;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[AuthContext] Timeout en validación TOTP');
      } else {
        console.error('[AuthContext] Error de red en validación TOTP:', error);
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // Ignorar errores en logout
    } finally {
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

