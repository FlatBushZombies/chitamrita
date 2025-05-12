"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./AuthContext"
import { useUserContext } from "./userContext"
import { API_URL } from "@/config/config"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (receiverId: string, content: string, type?: string) => void
  markMessageAsRead: (messageId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()
  const { getUserProfile } = useUserContext()
  const [userProfile, setUserProfile] = useState<any>(null)

  // Load user profile when user changes
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id)
          setUserProfile(profile)
        } catch (error) {
          console.error("Failed to load user profile:", error)
        }
      }
    }
    loadUserProfile()
  }, [user?.id])

  useEffect(() => {
    if (!user || !userProfile) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    const initializeSocket = async () => {
      try {
        // Initialize socket connection
        const socketInstance = io(API_URL, {
          auth: {
            userId: user.id,
            username: user.username,
          },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        })

        socketInstance.on("connect", () => {
          console.log("Socket connected")
          setIsConnected(true)
        })

        socketInstance.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason)
          setIsConnected(false)
        })

        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error)
          setIsConnected(false)
        })

        socketInstance.on("error", (error) => {
          console.error("Socket error:", error)
        })

        setSocket(socketInstance)

        // Cleanup on unmount
        return () => {
          if (socketInstance.connected) {
            socketInstance.disconnect()
          }
        }
      } catch (error) {
        console.error("Failed to initialize socket:", error)
        setIsConnected(false)
      }
    }

    initializeSocket()
  }, [user, userProfile])

  const sendMessage = (receiverId: string, content: string, type = "text") => {
    if (!socket || !isConnected || !user) {
      console.error("Cannot send message: Socket not connected or user not authenticated")
      return
    }

    try {
      socket.emit("send_message", {
        receiverId,
        content,
        type,
        senderId: user.id,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const markMessageAsRead = (messageId: string) => {
    if (!socket || !isConnected || !user) {
      console.error("Cannot mark message as read: Socket not connected or user not authenticated")
      return
    }

    try {
      socket.emit("message_read", {
        messageId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to mark message as read:", error)
    }
  }

  const value = {
    socket,
    isConnected,
    sendMessage,
    markMessageAsRead,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
