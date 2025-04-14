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
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { API_URL, COLORS } from "@/config/config"
import { useAuth } from "@/context/AuthContext"

interface UserStats {
  followers: number
  following: number
  messages: number
}

const ProfileScreen = () => {
  const navigation = useNavigation()
  const { user, token, logout } = useAuth()

  const [stats, setStats] = useState<UserStats>({
    followers: 0,
    following: 0,
    messages: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats(response.data)
    } catch (error) {
      console.error("Failed to load user stats:", error)
    } finally {
      setLoading(false)
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
            await logout()
            navigation.reset({
              index: 0,
              routes: [{ name: "Landing" }],
            })
          } catch (error) {
            console.error("Logout failed:", error)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.profileImageContainer}>
            <TouchableOpacity style={styles.editProfileButton}>
              <Ionicons name="camera-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.fullName}>{user?.fullName}</Text>

          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.messages}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
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
          </>
        )}
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
    padding: 30,
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
