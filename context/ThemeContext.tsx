"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { useColorScheme } from "react-native"

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
