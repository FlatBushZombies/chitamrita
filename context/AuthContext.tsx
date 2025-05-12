"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useColorScheme } from "react-native"
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo"
import { router } from "expo-router"

type Theme = "light" | "dark" | "system"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDarkMode: boolean
  colors: {
    background: string
    card: string
    text: string
    border: string
    primary: string
    secondary: string
    accent: string
    error: string
    placeholder: string
    inputBackground: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme()
  const [theme, setTheme] = useState<Theme>("system")

  const isDarkMode = theme === "system" ? systemColorScheme === "dark" : theme === "dark"

  const colors = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    card: isDarkMode ? "#1E1E1E" : "#F5F5F5",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    border: isDarkMode ? "#2C2C2C" : "#E0E0E0",
    primary: "#9333EA", // Purple color from the design
    secondary: "#7C3AED",
    accent: "#C084FC",
    error: "#EF4444",
    placeholder: isDarkMode ? "#6B7280" : "#9CA3AF",
    inputBackground: isDarkMode ? "#2C2C2C" : "#F3F4F6",
  }

  return <ThemeContext.Provider value={{ theme, setTheme, isDarkMode, colors }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

interface User {
  id: string
  username: string
  fullName: string
  profilePic?: string
  email: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => { },
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, signOut: clerkSignOut } = useClerkAuth()
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && isUserLoaded) {
      if (clerkUser) {
        setUser({
          id: clerkUser.id,
          username: clerkUser.username || "",
          fullName: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          profilePic: clerkUser.imageUrl,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }
  }, [isLoaded, isUserLoaded, clerkUser])

  const signOut = async () => {
    try {
      await clerkSignOut()
      router.replace("/(auth)/LoginScreen")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
