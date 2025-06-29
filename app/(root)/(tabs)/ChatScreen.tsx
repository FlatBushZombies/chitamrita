"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useApiService } from "@/lib/api"
import { useUser } from "@clerk/clerk-expo"
import { router } from "expo-router"

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  message_type: string
  read_at?: string
}

interface RouteParams {
  userId: string
  username: string
  profilePic?: string
}

const ChatScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const apiService = useApiService()
  const { user: currentUser } = useUser()
  const { userId, username, profilePic } = (route.params || {}) as RouteParams

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (userId && currentUser?.id) {
      loadConversation()
      markMessagesAsRead()
    }
  }, [userId, currentUser?.id])

  useEffect(() => {
    // Set up navigation header
    navigation.setOptions({
      title: username,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={20} color="white" />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: "#000",
        borderBottomWidth: 1,
        borderBottomColor: "#1F2937",
      },
      headerTintColor: "white",
    })
  }, [navigation, username])

  const loadConversation = async () => {
    try {
      setLoading(true)
      console.log("Loading conversation between:", currentUser?.id, "and", userId)

      const conversation = await apiService.getConversationBetweenUsers(
        currentUser?.id || "",
        userId
      )

      console.log("Loaded conversation:", conversation)
      setMessages(conversation)
    } catch (error) {
      console.error("Failed to load conversation:", error)
      Alert.alert("Error", "Failed to load conversation")
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await apiService.markMessagesAsReadForUser(userId)
    } catch (error) {
      console.error("Failed to mark messages as read:", error)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser?.id) return

    const messageContent = inputText.trim()
    setInputText("")
    setSending(true)

    try {
      console.log("Sending message to:", userId, "Content:", messageContent)

      const newMessage = await apiService.sendMessageToUser(userId, messageContent)

      if (newMessage) {
        console.log("Message sent successfully:", newMessage)
        setMessages(prev => [...prev, newMessage])

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 100)
      } else {
        Alert.alert("Error", "Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      Alert.alert("Error", "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadConversation()
    setRefreshing(false)
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === currentUser?.id

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Image
            source={{ uri: profilePic }}
            style={styles.messageAvatar}
            defaultSource={require("../../../assets/icon.png")}
          />
        )}

        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>

          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {formatMessageTime(item.created_at)}
            </Text>
            {isOwnMessage && (
              <Ionicons
                name={item.read_at ? "checkmark-done" : "checkmark"}
                size={14}
                color={item.read_at ? "#9333EA" : "#9CA3AF"}
                style={styles.readReceipt}
              />
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#9333EA"
              colors={["#9333EA"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Start the conversation by sending a message
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
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
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: "flex-end",
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "100%",
  },
  ownMessageBubble: {
    backgroundColor: "#9333EA",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#1F2937",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "white",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginRight: 4,
  },
  readReceipt: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    backgroundColor: "#000",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#1F2937",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: "#9333EA",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#374151",
  },
})

export default ChatScreen
