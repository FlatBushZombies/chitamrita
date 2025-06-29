"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native"
import type { ClerkUser } from "@/lib/clerk"
import { useAuth } from "@clerk/clerk-expo"
import { useSupabase } from "@/context/SupabaseContext"

interface UserItemProps {
  user: ClerkUser
  onFollowStatusChange?: (userId: string, isFollowing: boolean) => void
}

export default function UserItem({ user, onFollowStatusChange }: UserItemProps) {
  const { userId } = useAuth()
  const { followService } = useSupabase()
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync follow status when user prop changes
  useEffect(() => {
    setIsFollowing(user.isFollowing || false)
  }, [user.isFollowing])

  // Check initial follow status when component mounts
  useEffect(() => {
    if (userId && user.id && userId !== user.id) {
      checkFollowStatus()
    }
  }, [userId, user.id])

  const checkFollowStatus = async () => {
    try {
      const following = await followService.isFollowing(userId!, user.id)
      setIsFollowing(following)
    } catch (error) {
      console.error('Error checking follow status:', error)
      // Don't show error for status check failures
    }
  }

  const handleFollowToggle = async () => {
    console.log("Follow button pressed for user:", user.id, "Current state:", isFollowing)

    // Validate user IDs
    if (!userId) {
      setError("You must be logged in to follow users")
      return
    }

    if (!user.id) {
      setError("Invalid user to follow")
      return
    }

    if (userId === user.id) {
      setError("You cannot follow yourself")
      return
    }

    setIsLoading(true)
    setError(null)

    const newFollowStatus = !isFollowing
    console.log("Attempting to change follow status to:", newFollowStatus)

    try {
      if (isFollowing) {
        // Unfollow
        console.log("Unfollowing user:", user.id)
        await followService.unfollowUser(userId, user.id)
        console.log("Unfollow successful")
      } else {
        // Follow
        console.log("Following user:", user.id)
        await followService.followUser(userId, user.id)
        console.log("Follow successful")
      }

      // Update state only on success
      console.log("Updating local state to:", newFollowStatus)
      setIsFollowing(newFollowStatus)
      if (onFollowStatusChange) {
        console.log("Calling onFollowStatusChange callback")
        onFollowStatusChange(user.id, newFollowStatus)
      }
    } catch (error: any) {
      console.error("Error in handleFollowToggle:", error)

      // Handle specific error cases
      if (error.message?.includes('404')) {
        setError("Follow feature not available yet")
      } else if (error.message?.includes('500')) {
        setError("Server error. Please try again later")
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        setError("Network error. Please check your connection")
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        setError("Authentication error. Please log in again")
      } else if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        setError("You are already following this user")
      } else if (error.message?.includes('not found')) {
        setError("User not found")
      } else if (error.message?.includes('not configured') || error.message?.includes('environment variables')) {
        setError("Follow feature not configured. Please contact support.")
      } else {
        setError(`Failed to ${isFollowing ? 'unfollow' : 'follow'}: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username

  return (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: user.imageUrl }}
          style={styles.avatar}
          defaultSource={require("../assets/icon.png")}
        />
        <Text style={styles.userName}>{displayName}</Text>
      </View>
      {userId !== user.id && (
        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing ? styles.followingButton : null,
              isLoading ? styles.disabledButton : null,
            ]}
            onPress={handleFollowToggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.followButtonText}>{isFollowing ? "Following" : "Follow"}</Text>
            )}
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#374151',
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
  followButton: {
    backgroundColor: "#9333EA",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: "#3A3A3A",
  },
  disabledButton: {
    opacity: 0.7,
  },
  followButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    maxWidth: 120,
    textAlign: 'right',
  },
})
