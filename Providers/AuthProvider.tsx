"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

type AuthUser = {
  uid: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
};

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (firebaseUser: User) => {
    try {
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
      };

      setUser(authUser);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        if (firebaseUser) {
          await fetchUserData(firebaseUser);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const clearAuth = () => {
    setUser(null);
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
