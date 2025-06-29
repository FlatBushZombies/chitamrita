import { API_BASE_URL } from "@/config/api"

// In a real app, this would be stored in a database
// For this example, we'll use AsyncStorage

interface FollowRelationship {
  followerId: string
  followingId: string
}

export class FollowService {
  async followUser(currentUserId: string, userToFollowId: string): Promise<boolean> {
    try {
      console.log(`Following user: ${userToFollowId} by user: ${currentUserId}`)
      console.log(`Using API URL: ${API_BASE_URL}/follow`)

      const response = await fetch(`${API_BASE_URL}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: currentUserId,
          followingId: userToFollowId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`Follow API error: ${response.status} - ${errorData.message || 'Unknown error'}`)
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('Follow response:', result)
      return true
    } catch (error) {
      console.error("Error following user:", error)
      throw error
    }
  }

  async unfollowUser(currentUserId: string, userToUnfollowId: string): Promise<boolean> {
    try {
      console.log(`Unfollowing user: ${userToUnfollowId} by user: ${currentUserId}`)
      console.log(`Using API URL: ${API_BASE_URL}/unfollow`)

      const response = await fetch(`${API_BASE_URL}/unfollow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: currentUserId,
          followingId: userToUnfollowId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`Unfollow API error: ${response.status} - ${errorData.message || 'Unknown error'}`)
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('Unfollow response:', result)
      return true
    } catch (error) {
      console.error("Error unfollowing user:", error)
      throw error
    }
  }

  async isFollowing(currentUserId: string, userId: string): Promise<boolean> {
    try {
      console.log(`Checking if ${currentUserId} is following ${userId}`)
      console.log(`Using API URL: ${API_BASE_URL}/follow/status`)

      const response = await fetch(`${API_BASE_URL}/follow/status?followerId=${currentUserId}&followingId=${userId}`)

      if (!response.ok) {
        console.log(`Follow status check failed: ${response.status}`)
        return false
      }

      const result = await response.json()
      console.log('Follow status response:', result)
      return result.isFollowing || false
    } catch (error) {
      console.error("Error checking following status:", error)
      return false
    }
  }

  async getFollowedUsers(currentUserId: string): Promise<string[]> {
    try {
      console.log(`Getting followed users for: ${currentUserId}`)
      console.log(`Using API URL: ${API_BASE_URL}/follow/following`)

      const response = await fetch(`${API_BASE_URL}/follow/following?userId=${currentUserId}`)

      if (!response.ok) {
        console.log(`Get followed users failed: ${response.status}`)
        return []
      }

      const result = await response.json()
      console.log('Followed users response:', result)
      return result.following || []
    } catch (error) {
      console.error("Error getting followed users:", error)
      return []
    }
  }

  async getFollowers(currentUserId: string): Promise<string[]> {
    try {
      console.log(`Getting followers for: ${currentUserId}`)
      console.log(`Using API URL: ${API_BASE_URL}/follow/followers`)

      const response = await fetch(`${API_BASE_URL}/follow/followers?userId=${currentUserId}`)

      if (!response.ok) {
        console.log(`Get followers failed: ${response.status}`)
        return []
      }

      const result = await response.json()
      console.log('Followers response:', result)
      return result.followers || []
    } catch (error) {
      console.error("Error getting followers:", error)
      return []
    }
  }
}

// Export a singleton instance
export const followService = new FollowService()
