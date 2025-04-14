"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useUser, useAuth } from "@clerk/clerk-expo"
import axios from "axios"
import { API_URL } from "@/config/config"

interface UserContextType {
  userProfile: UserProfile | null
  isLoadingProfile: boolean
  refreshUserProfile: () => Promise<void>
}

interface UserProfile {
  id: string
  username: string
  fullName: string
  email: string
  profilePic?: string
  followers: number
  following: number
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded: isClerkLoaded } = useUser()
  const { getToken } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    if (isClerkLoaded && user) {
      refreshUserProfile()
    } else if (isClerkLoaded && !user) {
      setUserProfile(null)
      setIsLoadingProfile(false)
    }
  }, [isClerkLoaded, user])

  const refreshUserProfile = async () => {
    if (!user) return

    try {
      setIsLoadingProfile(true)

      // Get token for API requests
      const token = await getToken()

      // Set auth header for all future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      try {
        // Try to get existing profile
        const response = await axios.get(`${API_URL}/users/profile`)
        setUserProfile(response.data)
      } catch (error) {
        // If profile doesn't exist, create one
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          await createUserProfile()
        } else {
          console.error("Failed to get user profile:", error)
        }
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const createUserProfile = async () => {
    if (!user) return

    try {
      // Create profile with Clerk user data
      const response = await axios.post(`${API_URL}/users/profile`, {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username || `user_${user.id.substring(0, 8)}`,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        profilePic: user.imageUrl,
      })

      setUserProfile(response.data)
    } catch (error) {
      console.error("Failed to create user profile:", error)
    }
  }

  const value = {
    userProfile,
    isLoadingProfile,
    refreshUserProfile,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUserProfile = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProvider")
  }
  return context
}
