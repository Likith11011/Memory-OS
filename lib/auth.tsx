"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  saveToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  isLoggedIn: false,
  isLoading: true,
  saveToken: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("token");
      if (stored && stored.trim()) {
        setToken(stored.trim());
      }
    } catch {
      // localStorage not available (SSR)
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToken = useCallback((t: string) => {
    if (!t || !t.trim()) return;
    try {
      localStorage.setItem("token", t.trim());
      setToken(t.trim());
    } catch {
      console.error("Failed to save token");
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("token");
    } catch {
      // ignore
    }
    setToken(null);
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, isLoggedIn: !!token, isLoading, saveToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);