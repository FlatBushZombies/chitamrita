"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useAuth } from "./AuthContext"
import axios from "axios"
import { API_URL } from "@/config/config"

interface User {
  id: string
  username: string
  fullName: string
  profilePic?: string
  followers: number
  following: number
  isFollowing?: boolean
}

interface UserContextType {
  searchUsers: (query: string) => Promise<User[]>
  followUser: (userId: string) => Promise<void>
  unfollowUser: (userId: string) => Promise<void>
  getUserProfile: (userId: string) => Promise<User>
  loading: boolean
  error: string | null
}

const UserContext = createContext<UserContextType>({
  searchUsers: async () => [],
  followUser: async () => { },
  unfollowUser: async () => { },
  getUserProfile: async () => ({ id: "", username: "", fullName: "", followers: 0, following: 0 }),
  loading: false,
  error: null,
})

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: authUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/users/search?query=${encodeURIComponent(query)}`)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to search users")
      return []
    } finally {
      setLoading(false)
    }
  }

  const followUser = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      await axios.post(`${API_URL}/users/follow/${userId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to follow user")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const unfollowUser = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      await axios.delete(`${API_URL}/users/follow/${userId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to unfollow user")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getUserProfile = async (userId: string): Promise<User> => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/users/${userId}`)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to get user profile")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserContext.Provider
      value={{
        searchUsers,
        followUser,
        unfollowUser,
        getUserProfile,
        loading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider")
  }
  return context
}

// Alias for backward compatibility
export const useUserProfile = useUserContext
