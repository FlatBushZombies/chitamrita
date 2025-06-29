"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import * as React from "react"
import { Ionicons } from "@expo/vector-icons"
import { useUser } from "@clerk/clerk-expo"
import { router } from "expo-router"

interface ChatUser {
  id: string
  firstName: string
  lastName: string
  username: string
  imageUrl: string
  email: string
}

const ChatListScreen = () => {
  const { user: currentUser } = useUser()
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAllUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Loading all users from backend...")

      // Try to get all users from the backend
      const response = await fetch("https://chitamrita-backend.vercel.app/api/users")

      if (response.status === 404) {
        // Endpoint doesn't exist, show message to search for users
        setError("No users loaded. Search for people to start chatting!")
        setChatUsers([])
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const data = await response.json()
      console.log("Backend response:", data)

      const allUsers = data.users || []
      console.log("All users from backend:", allUsers)

      // Filter out current user
      const filteredUsers = allUsers.filter((user: any) => user.id !== currentUser?.id)
      console.log("Filtered users (excluding current user):", filteredUsers)

      setChatUsers(filteredUsers)
    } catch (error) {
      console.error("Failed to load users:", error)
      setError("Failed to load users. Please try again later.")
      setChatUsers([])
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAllUsers()
    setRefreshing(false)
  }

  // Refresh list when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("ChatListScreen focused - loading all users")
      loadAllUsers()
    }, [])
  )

  const navigateToChat = (userId: string, username: string, imageUrl: string) => {
    router.push({
      pathname: "/ChatScreen",
      params: {
        userId,
        username,
        profilePic: imageUrl
      }
    })
  }

  const renderChatItem = ({ item }: { item: ChatUser }) => {
    const displayName = item.firstName && item.lastName
      ? `${item.firstName} ${item.lastName}`
      : item.username

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigateToChat(item.id, item.username, item.imageUrl)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.avatar}
            defaultSource={require("../../../assets/icon.png")}
          />
          <View style={styles.onlineIndicator} />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.username}>@{item.username}</Text>
          </View>

          <View style={styles.messagePreview}>
            <Text style={styles.messageText} numberOfLines={1}>
              Start a conversation
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.emptyTitle}>Loading users...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptySubtitle}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.searchActionButton}
            onPress={() => router.push("/SearchScreen")}
          >
            <Text style={styles.searchButtonText}>Search for People</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No users found</Text>
        <Text style={styles.emptySubtitle}>
          Search for people to start chatting with them
        </Text>
        <TouchableOpacity
          style={styles.searchActionButton}
          onPress={() => router.push("/SearchScreen")}
        >
          <Text style={styles.searchButtonText}>Search for People</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Users</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push("/SearchScreen")}
        >
          <Ionicons name="search" size={24} color="#9333EA" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chatUsers}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9333EA"
            colors={["#9333EA"]}
          />
        }
        ListEmptyComponent={renderEmptyState()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  searchButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 16,
    marginTop: 16,
  },
  chatList: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#374151",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#000",
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  username: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageText: {
    color: "#9CA3AF",
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  searchActionButton: {
    backgroundColor: "#9333EA",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  searchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ChatListScreen
