"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "@clerk/clerk-expo"
import { searchUsers, type ClerkUser } from '@/lib/clerk'
import { getFollowingStatus } from "@/lib/follow-service"
import UserItem from "@/components/user-item"
import { useFocusEffect } from "expo-router"

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const { userId, isSignedIn } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ClerkUser[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const performSearch = useCallback(
    async (query: string) => {
      if (!query || !isSignedIn) return

      setIsSearching(true)
      try {
        const results = await searchUsers(query)

        // Get following status for each user
        if (userId) {
          const resultsWithFollowStatus = await Promise.all(
            results.map(async (user) => ({
              ...user,
              isFollowing: await getFollowingStatus(userId, user.id),
            })),
          )
          setSearchResults(resultsWithFollowStatus)
        } else {
          setSearchResults(results)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsSearching(false)
      }
    },
    [userId, isSignedIn],
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  // Refresh search results when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery)
      }
    }, [searchQuery, performSearch]),
  )

  const handleFollowStatusChange = (userId: string, isFollowing: boolean) => {
    setSearchResults((prev) => prev.map((user) => (user.id === userId ? { ...user, isFollowing } : user)))
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.purpleSquare} />
          </View>
        </View>

        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Meet new people</Text>
        <Text style={styles.subtitle}>build connections</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9333EA" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search to make friends"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {isSearching && <ActivityIndicator size="small" color="#9333EA" />}
      </View>

      {/* User List */}
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => <UserItem user={item} onFollowStatusChange={handleFollowStatusChange} />}
          keyExtractor={(item) => item.id}
          style={styles.userList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          {searchQuery.length >= 2 && !isSearching ? (
            <Text style={styles.emptyStateText}>No users found</Text>
          ) : searchQuery.length < 2 ? (
            <Text style={styles.emptyStateText}>Type at least 2 characters to search</Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  iconButton: {
    padding: 8,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  purpleSquare: {
    width: 32,
    height: 32,
    backgroundColor: "#9333EA",
    borderRadius: 8,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 18,
    color: "white",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 25,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "white",
  },
  userList: {
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyStateText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
})
