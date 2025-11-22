"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { PropsWithChildren } from "react";
import type { User } from "@/lib/models/user";
import { getCurrentUser } from "@/lib/api/auth";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (nextUser: User) => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
};

const STORAGE_KEY = "smw:tokens";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

function getStoredTokens(): StoredTokens | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const tokens = JSON.parse(stored);
    
    // Validate that we have the required tokens
    if (!tokens.accessToken || !tokens.refreshToken) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return tokens;
  } catch (error) {
    console.error("[getStoredTokens] Error parsing stored tokens:", error);
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount - always try to validate with /me
  useEffect(() => {
    const initAuth = async () => {
      console.log("[AuthProvider] Initializing auth...");
      
      // Try to get stored tokens
      const tokens = getStoredTokens();
      
      if (!tokens) {
        console.log("[AuthProvider] No stored tokens found");
        setIsLoading(false);
        return;
      }

      console.log("[AuthProvider] Found stored tokens, validating with /me");

      try {
        // Always validate tokens by calling /me
        // If token is expired, apiClient will refresh it automatically
        const userData = await getCurrentUser();
        console.log("[AuthProvider] Session valid, user authenticated:", userData.username);
        
        // After successful /me call, get the latest tokens (they might have been refreshed)
        const latestTokens = getStoredTokens();
        if (!latestTokens) {
          throw new Error("Tokens disappeared after validation");
        }
        
        // Update user with fresh data and latest tokens
        setUser({
          ...userData,
          accessToken: latestTokens.accessToken,
          refreshToken: latestTokens.refreshToken,
          tokenType: latestTokens.tokenType,
        });
      } catch (error) {
        console.error("[AuthProvider] Session validation failed:", error);
        // Clear invalid tokens
        if (typeof window !== "undefined") {
          console.log("[AuthProvider] Removing tokens due to validation failure");
          window.localStorage.removeItem(STORAGE_KEY);
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for token updates from the API client (when tokens are refreshed)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTokenRefresh = (e: Event) => {
      const customEvent = e as CustomEvent<{ accessToken: string; refreshToken: string }>;
      const { accessToken, refreshToken } = customEvent.detail;
      
      console.log("[AuthProvider] Token refreshed, updating user state");
      
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          accessToken,
          refreshToken,
          tokenType: prev.tokenType,
        };
      });
    };

    // Listen for custom tokenRefreshed event from apiClient
    window.addEventListener("tokenRefreshed", handleTokenRefresh);

    return () => {
      window.removeEventListener("tokenRefreshed", handleTokenRefresh);
    };
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const fullUser = await getCurrentUser();
      setUser((prev) => {
        if (!prev) return null;
        return { 
          ...prev, 
          username: fullUser.username,
          email: fullUser.email,
          profile: fullUser.profile 
        };
      });
    } catch (error) {
      console.error("Error refreshing user data", error);
    }
  }, []);

  const login = useCallback((nextUser: User) => {
    console.log("[AuthProvider] Login called with user:", { 
      username: nextUser.username,
      hasAccessToken: !!nextUser.accessToken,
      hasRefreshToken: !!nextUser.refreshToken
    });
    setUser(nextUser);
    // Load full profile after login
    getCurrentUser()
      .then((fullUser) => {
        console.log("[AuthProvider] Loaded full profile after login");
        setUser((prev) => {
          if (!prev) return null;
          return { ...prev, profile: fullUser.profile };
        });
      })
      .catch((error) => {
        console.error("[AuthProvider] Error loading user profile", error);
      });
  }, []);

  const logout = useCallback(() => {
    console.log("[AuthProvider] Logout called");
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Only save tokens when user has them
    // Don't remove tokens just because user is null - let the auth validation handle that
    if (user && user.accessToken && user.refreshToken) {
      console.log("[AuthProvider] Saving tokens to localStorage");
      const tokens: StoredTokens = {
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        tokenType: user.tokenType,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    }
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refreshUserData,
    }),
    [user, isLoading, login, logout, refreshUserData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
