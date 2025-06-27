"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native"
import type { ClerkUser } from "@/lib/clerk"
import { useAuth } from "@clerk/clerk-expo"

interface UserItemProps {
  user: ClerkUser
  onFollowStatusChange?: (userId: string, isFollowing: boolean) => void
}

const API_BASE_URL = "https://chitamrita-backend.vercel.app/api";

export default function UserItem({ user, onFollowStatusChange }: UserItemProps) {
  const { userId } = useAuth()
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollowToggle = async () => {
    if (!userId || userId === user.id) return
    setIsLoading(true)
    try {
      if (isFollowing) {
        await fetch(`${API_BASE_URL}/users/${user.id}/unfollow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerId: userId }),
        })
      } else {
        await fetch(`${API_BASE_URL}/users/${user.id}/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerId: userId }),
        })
      }
      setIsFollowing(!isFollowing)
      if (onFollowStatusChange) onFollowStatusChange(user.id, !isFollowing)
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username

  return (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        <Text style={styles.userName}>{displayName}</Text>
      </View>
      {userId !== user.id && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing ? styles.followingButton : null,
            isLoading ? styles.disabledButton : null,
          ]}
          onPress={handleFollowToggle}
          disabled={isLoading}
        >
          <Text style={styles.followButtonText}>{isLoading ? "..." : isFollowing ? "Following" : "Follow"}</Text>
        </TouchableOpacity>
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
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
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
  },
})
