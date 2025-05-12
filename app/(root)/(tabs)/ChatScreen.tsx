"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { Audio } from "expo-av"
import { API_URL, COLORS } from "@/config/config"
import { useAuth } from "@/context/AuthContext"
import { useSocket } from "@/context/SocketContext"

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: "text" | "audio"
  read: boolean
  createdAt: string
}

interface RouteParams {
  userId: string;
  username: string;
  profilePic?: string;
}

const ChatScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { user } = useAuth()
  const { socket, sendMessage, markMessageAsRead } = useSocket()

  const { userId: chatUserId, username: chatUsername, profilePic: chatProfilePic } = (route.params || {}) as RouteParams

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioPlayback, setAudioPlayback] = useState<
    Record<string, { sound: Audio.Sound; isPlaying: boolean; duration: number; position: number }>
  >({})

  const flatListRef = useRef<FlatList>(null)
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    navigation.setOptions({
      title: chatUsername,
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Image
            source={chatProfilePic ? { uri: chatProfilePic } : require("../../../assets/icon.png")}
            style={styles.headerAvatar}
          />
          <Text style={styles.headerTitle}>{chatUsername}</Text>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      ),
    })

    loadMessages()

    if (socket) {
      socket.on("receive_message", handleNewMessage)
      socket.on("message_read", handleMessageRead)

      return () => {
        socket.off("receive_message", handleNewMessage)
        socket.off("message_read", handleMessageRead)
      }
    }

    return () => {
      // Clean up any audio resources
      Object.values(audioPlayback).forEach(async (playback) => {
        try {
          await playback.sound.unloadAsync()
        } catch (error) {
          console.error("Error unloading audio:", error)
        }
      })
    }
  }, [socket, chatUserId])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/messages/${chatUserId}`)
      setMessages(response.data)

      // Mark unread messages as read
      response.data.forEach((message: Message) => {
        if (message.senderId === chatUserId && !message.read) {
          markMessageAsRead(message.id)
        }
      })
    } catch (error) {
      console.error("Failed to load messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewMessage = (message: Message) => {
    // Only add message if it's relevant to this chat
    if (
      (message.senderId === chatUserId && message.receiverId === user?.id) ||
      (message.senderId === user?.id && message.receiverId === chatUserId)
    ) {
      setMessages((prevMessages) => [...prevMessages, message])

      // Mark message as read if it's from the other user
      if (message.senderId === chatUserId && !message.read) {
        markMessageAsRead(message.id)
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const handleMessageRead = ({ messageId }: { messageId: string }) => {
    setMessages((prevMessages) => prevMessages.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)))
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return

    sendMessage(chatUserId, inputText.trim())
    setInputText("")
  }

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        console.error("Permission to record audio was denied")
        return
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      // Start recording
      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      })
      await recording.startAsync()
      setRecording(recording)
      setIsRecording(true)

      // Start duration timer
      setRecordingDuration(0)
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Failed to start recording:", error)
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    try {
      // Stop recording
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecording(null)
      setIsRecording(false)

      // Clear duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }

      if (uri) {
        // Upload audio file and send message
        const formData = new FormData()
        formData.append("audio", {
          uri,
          type: "audio/m4a",
          name: "recording.m4a",
        } as any)

        const response = await axios.post(`${API_URL}/upload/audio`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        const audioUrl = response.data.url
        sendMessage(chatUserId, audioUrl, "audio")
      }
    } catch (error) {
      console.error("Failed to stop recording:", error)
    }
  }

  const cancelRecording = async () => {
    if (!recording) return

    try {
      await recording.stopAndUnloadAsync()
      setRecording(null)
      setIsRecording(false)

      // Clear duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
    } catch (error) {
      console.error("Failed to cancel recording:", error)
    }
  }

  const playAudio = async (audioUrl: string, messageId: string) => {
    try {
      // If already loaded, toggle play/pause
      if (audioPlayback[messageId]) {
        const playback = audioPlayback[messageId]

        if (playback.isPlaying) {
          await playback.sound.pauseAsync()
          setAudioPlayback({
            ...audioPlayback,
            [messageId]: { ...playback, isPlaying: false },
          })
        } else {
          await playback.sound.playAsync()
          setAudioPlayback({
            ...audioPlayback,
            [messageId]: { ...playback, isPlaying: true },
          })
        }
        return
      }

      // Load and play the sound
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true }, (status) => {
        if (status.isLoaded) {
          // Update position for progress bar
          setAudioPlayback((prev) => ({
            ...prev,
            [messageId]: {
              ...prev[messageId],
              position: status.positionMillis,
              isPlaying: status.isPlaying,
            },
          }))

          // When finished playing
          if (status.didJustFinish) {
            setAudioPlayback((prev) => ({
              ...prev,
              [messageId]: {
                ...prev[messageId],
                position: 0,
                isPlaying: false,
              },
            }))
          }
        }
      })

      // Get duration
      const status = await sound.getStatusAsync()

      if (status.isLoaded) {
        setAudioPlayback({
          ...audioPlayback,
          [messageId]: {
            sound,
            duration: status.durationMillis || 0,
            position: 0,
            isPlaying: true,
          },
        })
      }
    } catch (error) {
      console.error("Failed to play audio:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id

    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
        {!isOwnMessage && (
          <Image
            source={chatProfilePic ? { uri: chatProfilePic } : require("../../../assets/icon.png")}
            style={styles.messageAvatar}
          />
        )}

        <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble]}>
          {item.type === "text" ? (
            <Text style={styles.messageText}>{item.content}</Text>
          ) : (
            <View style={styles.audioContainer}>
              <TouchableOpacity style={styles.audioPlayButton} onPress={() => playAudio(item.content, item.id)}>
                <Ionicons
                  name={audioPlayback[item.id]?.isPlaying ? "pause" : "play"}
                  size={24}
                  color={isOwnMessage ? COLORS.text : COLORS.primary}
                />
              </TouchableOpacity>

              <View style={styles.audioProgressContainer}>
                <View
                  style={[
                    styles.audioProgress,
                    {
                      width: `${audioPlayback[item.id]
                        ? (audioPlayback[item.id].position / audioPlayback[item.id].duration) * 100
                        : 0
                        }%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.audioDuration}>
                {audioPlayback[item.id] ? formatTime(Math.floor(audioPlayback[item.id].position / 1000)) : "0:00"}
              </Text>
            </View>
          )}
        </View>

        {isOwnMessage && (
          <Ionicons
            name={item.read ? "checkmark-done" : "checkmark"}
            size={16}
            color={item.read ? COLORS.primary : COLORS.textSecondary}
            style={styles.readReceipt}
          />
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {isRecording ? (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingInfo}>
              <View style={styles.recordingIndicator} />
              <Text style={styles.recordingText}>Recording... {formatTime(recordingDuration)}</Text>
            </View>
            <View style={styles.recordingActions}>
              <TouchableOpacity style={styles.cancelRecordingButton} onPress={cancelRecording}>
                <Ionicons name="close" size={24} color={COLORS.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording}>
                <Ionicons name="send" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            {inputText.trim() ? (
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Ionicons name="send" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micButton} onPress={startRecording}>
                <Ionicons name="mic" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageList: {
    padding: 15,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 15,
    maxWidth: "80%",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    alignSelf: "flex-end",
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    maxWidth: "100%",
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.card,
  },
  messageText: {
    color: COLORS.text,
    fontSize: 16,
  },
  readReceipt: {
    alignSelf: "flex-end",
    marginLeft: 5,
    marginBottom: 5,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 150,
  },
  audioPlayButton: {
    marginRight: 10,
  },
  audioProgressContainer: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginRight: 10,
  },
  audioProgress: {
    height: "100%",
    backgroundColor: COLORS.text,
    borderRadius: 3,
  },
  audioDuration: {
    color: COLORS.text,
    fontSize: 12,
    minWidth: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: COLORS.card,
  },
  attachButton: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
  },
  micButton: {
    marginLeft: 10,
  },
  recordingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: COLORS.card,
  },
  recordingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    marginRight: 10,
  },
  recordingText: {
    color: COLORS.text,
    fontSize: 16,
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelRecordingButton: {
    marginRight: 20,
  },
  stopRecordingButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default ChatScreen
