"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./AuthContext"
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
  const { token, user } = useAuth()

  useEffect(() => {
    if (!token || !user) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Initialize socket connection
    const socketInstance = io(API_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [token, user])

  const sendMessage = (receiverId: string, content: string, type = "text") => {
    if (socket && isConnected) {
      socket.emit("send_message", {
        receiverId,
        content,
        type,
      })
    } else {
      console.error("Cannot send message: Socket not connected")
    }
  }

  const markMessageAsRead = (messageId: string) => {
    if (socket && isConnected && user) {
      socket.emit("message_read", {
        messageId,
        readBy: user.id,
      })
    } else {
      console.error("Cannot mark message as read: Socket not connected")
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

