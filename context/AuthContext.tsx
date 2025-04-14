"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import { API_URL } from "@/config/config"

interface User {
  id: string
  username: string
  email: string
  fullName: string
  profilePic?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  signup: (email: string, password: string, username: string, fullName: string) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (identifier: string) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load user data from AsyncStorage on app start
    const loadUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token")
        const storedUser = await AsyncStorage.getItem("user")

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))

          // Set auth header for all future requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
        }
      } catch (error) {
        console.error("Failed to load user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true)
      // In a real app, this would be an API call
      const response = await axios.post(`${API_URL}/auth/login`, {
        identifier, // email, username or phone
        password,
      })

      const { token, user } = response.data

      // Save to state
      setToken(token)
      setUser(user)

      // Save to storage
      await AsyncStorage.setItem("token", token)
      await AsyncStorage.setItem("user", JSON.stringify(user))

      // Set auth header for all future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, username: string, fullName: string) => {
    try {
      setIsLoading(true)
      // In a real app, this would be an API call
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        username,
        fullName,
      })

      const { token, user } = response.data

      // Save to state
      setToken(token)
      setUser(user)

      // Save to storage
      await AsyncStorage.setItem("token", token)
      await AsyncStorage.setItem("user", JSON.stringify(user))

      // Set auth header for all future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } catch (error) {
      console.error("Signup failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)

      // Clear state
      setToken(null)
      setUser(null)

      // Clear storage
      await AsyncStorage.removeItem("token")
      await AsyncStorage.removeItem("user")

      // Clear auth header
      delete axios.defaults.headers.common["Authorization"]
    } catch (error) {
      console.error("Logout failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (identifier: string) => {
    try {
      setIsLoading(true)
      // In a real app, this would be an API call
      await axios.post(`${API_URL}/auth/forgot-password`, { identifier })
    } catch (error) {
      console.error("Forgot password request failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyCode = async (email: string, code: string) => {
    try {
      setIsLoading(true)
      // In a real app, this would be an API call
      await axios.post(`${API_URL}/auth/verify-code`, { email, code })
    } catch (error) {
      console.error("Code verification failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      setIsLoading(true)
      // In a real app, this would be an API call
      await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        code,
        newPassword,
      })
    } catch (error) {
      console.error("Password reset failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    forgotPassword,
    verifyCode,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
