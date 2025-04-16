"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { API_URL, COLORS } from "@/config/config"
import { useAuth } from "@/context/AuthContext"
import { useSocket } from "@/context/SocketContext"
import { images } from "@/constants/images"
import { router } from "expo-router"

interface ChatPreview {
  id: string
  userId: string
  username: string
  fullName: string
  profilePic?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

const ChatListScreen = () => {
  const navigation = useNavigation()
  const { user, token } = useAuth()
  const { socket } = useSocket()

  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChats()

    if (socket) {
      socket.on("update_chat_list", loadChats)

      return () => {
        socket.off("update_chat_list", loadChats)
      }
    }
  }, [socket])

  const loadChats = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setChats(response.data)
    } catch (error) {
      console.error("Failed to load chats:", error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToChat = (userId: string, username: string, profilePic?: string) => {
    router.push({
      pathname: "/(auth)/ChatListScreen",
      params: { userId, username, profilePic: profilePic || '' }
    });
  };


  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()

    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return "yesterday"
    }

    // Within a week
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(now.getDate() - 7)
    if (date > oneWeekAgo) {
      return date.toLocaleDateString([], { weekday: "short" })
    }

    // Older
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigateToChat(item.userId, item.username, item.profilePic)}
    >
      
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.fullName}</Text>
          <Text style={styles.chatTime}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <View style={styles.chatPreview}>
          <Text style={[styles.chatMessage, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount > 9 ? "9+" : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.actionButtonIcon}>
          <Ionicons name="person" size={24} color={COLORS.text} />
        </View>
        <Text style={styles.actionButtonText}>Find People</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.actionButtonIcon}>
          <Ionicons name="mail" size={24} color={COLORS.text} />
        </View>
        <Text style={styles.actionButtonText}>Invite Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.actionButtonIcon}>
          <Ionicons name="people" size={24} color={COLORS.text} />
        </View>
        <Text style={styles.actionButtonText}>Join Groups</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {renderActionButtons()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <TouchableOpacity style={styles.startChatButton} onPress={() => router.push("/(auth)/SearchScreen")}>
                <Text style={styles.startChatButtonText}>Find people to chat with</Text>
              </TouchableOpacity>
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  actionButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatList: {
    paddingHorizontal: 15,
  },
  chatItem: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#cccccc",
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  chatName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  chatTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  chatPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    color: COLORS.text,
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unreadCount: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  startChatButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  startChatButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },
})

export default ChatListScreen
