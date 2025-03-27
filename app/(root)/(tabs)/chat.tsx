"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

// Mock messages data
const initialMessages = [
  {
    id: "1",
    text: "I've tried the app",
    sender: "me",
    timestamp: new Date(),
  },
  {
    id: "2",
    text: "Really?",
    sender: "other",
    timestamp: new Date(),
  },
  {
    id: "3",
    text: "Yeah, it's really good!",
    sender: "me",
    timestamp: new Date(),
  },
]

export default function ChatScreen() {
  const [messages, setMessages] = useState(initialMessages)
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(true)

  const handleSend = () => {
    if (inputText.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          text: inputText,
          sender: "me",
          timestamp: new Date(),
        },
      ])
      setInputText("")
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerProfile}>
          <Image source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} style={styles.headerAvatar} />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>John Doe</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <View style={styles.chatContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageRow, message.sender === "me" ? styles.messageRowRight : styles.messageRowLeft]}
          >
            {message.sender !== "me" && (
              <Image source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} style={styles.messageAvatar} />
            )}
            <View
              style={[
                styles.messageBubble,
                message.sender === "me" ? styles.messageBubbleRight : styles.messageBubbleLeft,
              ]}
            >
              <Text
                style={[styles.messageText, message.sender === "me" ? styles.messageTextRight : styles.messageTextLeft]}
              >
                {message.text}
              </Text>
            </View>
            {message.sender === "me" && (
              <Image source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} style={styles.messageAvatar} />
            )}
          </View>
        ))}

        {isTyping && (
          <View style={styles.messageRow}>
            <Image source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} style={styles.messageAvatar} />
            <Text style={styles.typingIndicator}>Typing...</Text>
          </View>
        )}
      </View>

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={24} color="#8B5CF6" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type your Message"
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {Platform.OS === "ios" && <View style={styles.homeIndicator} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  headerStatus: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: "70%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleLeft: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: "#8B5CF6",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageTextLeft: {
    color: "#1F2937",
  },
  messageTextRight: {
    color: "white",
  },
  typingIndicator: {
    color: "#6B7280",
    fontSize: 14,
    marginLeft: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cameraButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 12,
    maxHeight: 100,
  },
  sendButton: {
    padding: 4,
  },
  homeIndicator: {
    alignSelf: "center",
    width: 134,
    height: 5,
    backgroundColor: "#000",
    borderRadius: 100,
    marginTop: 8,
    opacity: 0.1,
  },
})

