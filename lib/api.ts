"use client"

import React from "react"

import { API_BASE_URL } from "@/config/api"
import { useAuth } from "@clerk/clerk-expo"

export interface User {
  id: string
  firstName: string
  lastName: string
  imageUrl: string
  username: string
  email: string
  createdAt?: string
  lastSignInAt?: string
}

export interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  message_type: "text" | "voice" | "image" | "file"
  read_at?: string
  delivered_at?: string
  metadata?: Record<string, any>
}

export interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: string
  details?: string
}

class ApiService {
  private getAuthToken = async (): Promise<string | null> => {
    try {
      // This will be set by the component using the service
      return this.authToken
    } catch (error) {
      console.error("Failed to get auth token:", error)
      return null
    }
  }

  private authToken: string | null = null

  setAuthToken(token: string | null) {
    this.authToken = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const authToken = await this.getAuthToken()

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log(` API Request: ${options.method || "GET"} ${url}`)

      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`API Response: ${endpoint}`, data)
      return data
    } catch (error) {
      console.error(`❌ API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // User methods
  async searchUsers(query = ""): Promise<User[]> {
    // Use the new backend URL for user search
    const url = `https://chitamrita-backend.vercel.app/api/users/search?query=${encodeURIComponent(query)}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.users || []
  }

  async getUser(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`)
  }

  async getUsersBatch(userIds: string[]): Promise<User[]> {
    const response = await this.request<{ users: User[] }>("/users/batch", {
      method: "POST",
      body: JSON.stringify({ userIds }),
    })
    return response.users || []
  }

  // Follow methods
  async followUser(followingId: string): Promise<void> {
    await this.request("/follow", {
      method: "POST",
      body: JSON.stringify({ following_id: followingId }),
    })
  }

  async unfollowUser(followingId: string): Promise<void> {
    await this.request("/follow", {
      method: "DELETE",
      body: JSON.stringify({ following_id: followingId }),
    })
  }

  async getFollowStatus(followingId: string): Promise<boolean> {
    const result = await this.request<{ isFollowing: boolean }>(`/follow/status?following_id=${followingId}`)
    return result.isFollowing
  }

  async getFollowingUsers(): Promise<string[]> {
    const response = await this.request<{ following: string[] }>("/follow/following")
    return response.following || []
  }

  async getFollowers(): Promise<string[]> {
    const response = await this.request<{ followers: string[] }>("/follow/followers")
    return response.followers || []
  }

  // Message methods
  async sendMessage(
    receiverId: string,
    content: string,
    messageType: "text" | "voice" | "image" | "file" = "text",
  ): Promise<Message> {
    const response = await this.request<{ message: Message }>("/messages/send", {
      method: "POST",
      body: JSON.stringify({
        receiver_id: receiverId,
        content,
        message_type: messageType,
      }),
    })
    return response.message
  }

  async getConversation(
    userId: string,
    limit = 50,
    offset = 0,
    before?: string,
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    let url = `/messages/conversation?user_id=${userId}&limit=${limit}&offset=${offset}`
    if (before) {
      url += `&before=${before}`
    }

    const response = await this.request<{
      messages: Message[]
      hasMore: boolean
    }>(url)

    return {
      messages: response.messages || [],
      hasMore: response.hasMore || false,
    }
  }

  async getLastMessage(userId: string): Promise<Message | null> {
    const response = await this.request<{ lastMessage: Message | null }>(`/messages/last?user_id=${userId}`)
    return response.lastMessage
  }

  async getConversations(): Promise<any[]> {
    const response = await this.request<{ conversations: any[] }>("/messages/conversations")
    return response.conversations || []
  }

  // New method to get all users with their last messages for chat list
  async getAllUsersWithLastMessages(): Promise<Array<User & { lastMessage?: Message }>> {
    try {
      // First get all users
      const allUsersResponse = await fetch("https://chitamrita-backend.vercel.app/api/users")
      if (!allUsersResponse.ok) {
        throw new Error(`Failed to fetch users: ${allUsersResponse.status}`)
      }
      const allUsersData = await allUsersResponse.json()
      const users = allUsersData.users || []

      // Then get last message for each user
      const usersWithMessages = await Promise.all(
        users.map(async (user: User) => {
          try {
            const lastMessage = await this.getLastMessage(user.id)
            return { ...user, lastMessage }
          } catch (error) {
            console.error(`Failed to get last message for user ${user.id}:`, error)
            return { ...user, lastMessage: null }
          }
        })
      )

      return usersWithMessages
    } catch (error) {
      console.error("Failed to get users with last messages:", error)
      return []
    }
  }

  // Get all Clerk users for chat list
  async getAllClerkUsers(): Promise<User[]> {
    try {
      const response = await fetch("https://chitamrita-backend.vercel.app/api/users")
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      const data = await response.json()
      return data.users || []
    } catch (error) {
      console.error("Failed to get all Clerk users:", error)
      return []
    }
  }

  // Get conversation between two users
  async getConversationBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const response = await fetch(`https://chitamrita-backend.vercel.app/api/messages/conversation?user1=${userId1}&user2=${userId2}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`)
      }
      const data = await response.json()
      return data.messages || []
    } catch (error) {
      console.error("Failed to get conversation:", error)
      return []
    }
  }

  // Send a message
  async sendMessageToUser(receiverId: string, content: string): Promise<Message | null> {
    try {
      const response = await fetch("https://chitamrita-backend.vercel.app/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: receiverId,
          content,
          message_type: "text"
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }

      const data = await response.json()
      return data.message || null
    } catch (error) {
      console.error("Failed to send message:", error)
      return null
    }
  }

  // Mark messages as read
  async markMessagesAsReadForUser(senderId: string): Promise<void> {
    try {
      await fetch("https://chitamrita-backend.vercel.app/api/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: senderId })
      })
    } catch (error) {
      console.error("Failed to mark messages as read:", error)
    }
  }

  async markMessagesAsRead(senderId: string): Promise<void> {
    await this.request("/messages/mark-read", {
      method: "POST",
      body: JSON.stringify({ sender_id: senderId }),
    })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return this.request("/health")
  }
}

// Create a singleton instance
export const apiService = new ApiService()



// Hook to use the API service with authentication
export const useApiService = () => {
  const { getToken } = useAuth()

  // Update the auth token whenever it changes
  React.useEffect(() => {
    const updateToken = async () => {
      try {
        const token = await getToken()
        apiService.setAuthToken(token)
      } catch (error) {
        console.error("Failed to update API auth token:", error)
      }
    }

    updateToken()
  }, [getToken])

  return apiService
}
