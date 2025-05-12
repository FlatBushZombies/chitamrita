"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "@/config/config"
import { useAuth } from "@/context/AuthContext"
import { useUserContext } from "@/context/userContext"
import { router } from "expo-router"

interface User {
  id: string
  username: string
  fullName: string
  profilePic?: string
  followers: number
  following: number
  isFollowing?: boolean
}

const ProfileScreen = () => {
  const navigation = useNavigation()
  const { user, signOut } = useAuth()
  const { getUserProfile, followUser, unfollowUser, searchUsers, loading, error } = useUserContext()

  const [profile, setProfile] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    try {
      const userProfile = await getUserProfile(user.id)
      setProfile(userProfile)
    } catch (error) {
      console.error("Failed to load user profile:", error)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length > 0) {
      setIsSearching(true)
      const results = await searchUsers(query)
      setSearchResults(results)
      setIsSearching(false)
    } else {
      setSearchResults([])
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      await followUser(userId)
      // Update local state
      setSearchResults(prev =>
        prev.map(u => (u.id === userId ? { ...u, isFollowing: true, followers: u.followers + 1 } : u))
      )
    } catch (error) {
      console.error("Failed to follow user:", error)
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId)
      // Update local state
      setSearchResults(prev =>
        prev.map(u => (u.id === userId ? { ...u, isFollowing: false, followers: u.followers - 1 } : u))
      )
    } catch (error) {
      console.error("Failed to unfollow user:", error)
    }
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await signOut()
          } catch (error) {
            console.error("Logout failed:", error)
          }
        },
      },
    ])
  }

  const renderSearchResult = ({ item }: { item: User }) => (
    <View style={styles.searchResultItem}>
      <Image
        source={item.profilePic ? { uri: item.profilePic } : require("../../assets/icon.png")}
        style={styles.searchResultAvatar}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.fullName}</Text>
        <Text style={styles.searchResultUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={[styles.followButton, item.isFollowing && styles.followingButton]}
        onPress={() => (item.isFollowing ? handleUnfollow(item.id) : handleFollow(item.id))}
      >
        <Text style={[styles.followButtonText, item.isFollowing && styles.followingButtonText]}>
          {item.isFollowing ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </View>
  )

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.profileImageContainer}>
            <Image
              source={profile.profilePic ? { uri: profile.profilePic } : require("../../assets/icon.png")}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editProfileButton}>
              <Ionicons name="camera-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>@{profile.username}</Text>
          <Text style={styles.fullName}>{profile.fullName}</Text>

          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {isSearching ? (
            <ActivityIndicator style={styles.searchLoading} color={COLORS.primary} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={item => item.id}
              style={styles.searchResults}
            />
          ) : searchQuery.length > 0 ? (
            <Text style={styles.noResults}>No users found</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={22} color={COLORS.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Personal Information</Text>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={22} color={COLORS.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={22} color={COLORS.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#cccccc",
  },
  editProfileButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 5,
  },
  fullName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  editButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  searchContainer: {
    padding: 15,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  searchLoading: {
    marginTop: 20,
  },
  searchResults: {
    marginTop: 10,
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  searchResultUsername: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
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
  followingButtonText: {
    color: COLORS.primary,
  },
  noResults: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
  },
})

export default ProfileScreen
