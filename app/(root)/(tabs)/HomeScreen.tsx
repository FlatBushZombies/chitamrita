"use client"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { COLORS } from "@/config/config"
import { router } from "expo-router"

const HomeScreen = () => {
  const navigation = useNavigation()
  const { user } = useAuth()

  const navigateToSearch = () => {
    router.push("/(auth)/SearchScreen")
  }

  const navigateToChats = () => {
    router.push("/(auth)/ChatListScreen")
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.logoContainer}>
          <View style={styles.logo} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Meet new people</Text>
          <Text style={styles.welcomeSubtitle}>build connections</Text>
        </View>

        <View style={styles.featuredUsers}>
          <Text style={styles.sectionTitle}>Suggested for you</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userScroll}>
            {[1, 2, 3, 4, 5].map((item) => (
              <TouchableOpacity key={item} style={styles.userCard}>
                <Image
                  source={{
                    uri: `https://randomuser.me/api/portraits/${item % 2 === 0 ? "women" : "men"}/${item + 10}.jpg`,
                  }}
                  style={styles.userImage}
                />
                <Text style={styles.userName}>User {item}</Text>
                <TouchableOpacity style={styles.followButton}>
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionCard} onPress={navigateToSearch}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="search" size={30} color={COLORS.text} />
            </View>
            <Text style={styles.actionTitle}>Find Friends</Text>
            <Text style={styles.actionDescription}>Discover new people to connect with</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToChats}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubbles" size={30} color={COLORS.text} />
            </View>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionDescription}>Chat with your connections</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About Chitamrita</Text>
          <Text style={styles.infoText}>
            Chitamrita is a modern chat application built with React Native and Socket.IO. Connect with friends, send
            messages, and build your network.
          </Text>
          <Text style={styles.infoText}>Key features:</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>Real-time messaging with Socket.IO</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>User search and follow functionality</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>Voice messages and media sharing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>Read receipts and typing indicators</Text>
            </View>
          </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {},
  logoContainer: {},
  logo: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  headerRight: {},
  content: {
    flex: 1,
  },
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  welcomeSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  featuredUsers: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  userScroll: {
    marginBottom: 20,
  },
  userCard: {
    alignItems: "center",
    marginRight: 15,
    width: 120,
  },
  userImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: "#cccccc",
  },
  userName: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 5,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  followButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 20,
    width: "48%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  actionDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: COLORS.card,
    margin: 20,
    borderRadius: 15,
    padding: 20,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  featureList: {
    marginTop: 5,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 14,
  },
})

export default HomeScreen
