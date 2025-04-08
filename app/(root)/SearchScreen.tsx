"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { API_URL,  COLORS } from "@/config/config"
import { useAuth } from "@/context/AuthContext"

interface User {
  id: string
  username: string
  fullName: string
  profilePic?: string
  isFollowing: boolean
}

const SearchScreen = () => {
  const { user: currentUser, token } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers()
    } else {
      // Load suggested users when no search query
      loadSuggestedUsers()
    }
  }, [searchQuery])

  const loadSuggestedUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/users/suggested`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsers(response.data)
    } catch (error) {
      console.error("Failed to load suggested users:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/users/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsers(response.data)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFollow = async (userId: string) => {
    try {
      setFollowLoading((prev) => ({ ...prev, [userId]: true }))

      const userToUpdate = users.find((u) => u.id === userId)
      if (!userToUpdate) return

      if (userToUpdate.isFollowing) {
        await axios.delete(`${API_URL}/users/follow/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(
          `${API_URL}/users/follow/${userId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
      }

      // Update local state
      setUsers(users.map((u) => (u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u)))
    } catch (error) {
      console.error("Failed to toggle follow:", error)
    } finally {
      setFollowLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <Image
        source={item.profilePic ? { uri: item.profilePic } : require("../assets/default-avatar.png")}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
      </View>
      <TouchableOpacity
        style={[styles.followButton, item.isFollowing && styles.followingButton]}
        onPress={() => toggleFollow(item.id)}
        disabled={followLoading[item.id]}
      >
        {followLoading[item.id] ? (
          <ActivityIndicator size="small" color={COLORS.text} />
        ) : (
          <Text style={styles.followButtonText}>{item.isFollowing ? "Following" : "Follow"}</Text>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo} />
        </View>
        <Text style={styles.headerTitle}>Meet new people</Text>
        <Text style={styles.headerSubtitle}>build connections</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.primary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search to make friends"
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.userList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{searchQuery ? "No users found" : "No suggested users available"}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: "center",
    paddingVertical: 15,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#000000",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userList: {
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#cccccc",
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  followButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
})

export default SearchScreen

