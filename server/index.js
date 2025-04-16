const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { Webhook } = require("svix")

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads")
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  },
})

const upload = multer({ storage })

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chitamrita")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Define MongoDB schemas
const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  profilePic: { type: String, default: null },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
})

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ["text", "audio", "image"], default: "text" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

const User = mongoose.model("User", userSchema)
const Message = mongoose.model("Message", messageSchema)

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) return res.status(401).json({ message: "Unauthorized" })

    // Verify the token with Clerk's public key
    const CLERK_PEM_PUBLIC_KEY = process.env.CLERK_PEM_PUBLIC_KEY.replace(/\\n/g, "\n")

    const decoded = jwt.verify(token, CLERK_PEM_PUBLIC_KEY, {
      algorithms: ["RS256"],
    })

    // Find the user in our database
    const user = await User.findOne({ clerkId: decoded.sub })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res.status(403).json({ message: "Forbidden" })
  }
}

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication error"))
    }

    // Verify the token with Clerk's public key
    const CLERK_PEM_PUBLIC_KEY = process.env.CLERK_PEM_PUBLIC_KEY.replace(/\\n/g, "\n")

    const decoded = jwt.verify(token, CLERK_PEM_PUBLIC_KEY, {
      algorithms: ["RS256"],
    })

    // Find the user in our database
    const user = await User.findOne({ clerkId: decoded.sub })

    if (!user) {
      return next(new Error("User not found"))
    }

    // Attach user to socket
    socket.user = user
    next()
  } catch (error) {
    console.error("Socket authentication error:", error)
    return next(new Error("Authentication error"))
  }
}

// Store user's socket ID for direct messaging (globally)
const userSocketMap = new Map()

// Clerk webhook handler
app.post("/api/clerk-webhook", async (req, res) => {
  try {
    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    // Get the Svix headers for verification
    const svixId = req.headers["svix-id"]
    const svixTimestamp = req.headers["svix-timestamp"]
    const svixSignature = req.headers["svix-signature"]

    // If there are no headers, error out
    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: "Error: Missing Svix headers" })
    }

    // Create a new Svix instance with your secret
    const wh = new Webhook(CLERK_WEBHOOK_SECRET)

    // Verify the payload with the headers
    const payload = req.body
    const body = JSON.stringify(payload)

    try {
      wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      })
    } catch (err) {
      console.error("Error verifying webhook:", err)
      return res.status(400).json({ error: "Error verifying webhook" })
    }

    // Handle the webhook payload
    const { type, data } = payload

    if (type === "user.created" || type === "user.updated") {
      // Handle user creation or update
      const { id, username, email_addresses, first_name, last_name, image_url } = data

      const primaryEmail = email_addresses.find((email) => email.id === data.primary_email_address_id)?.email_address

      if (!primaryEmail) {
        return res.status(400).json({ error: "User has no primary email" })
      }

      // Check if user already exists in our database
      let user = await User.findOne({ clerkId: id })

      if (user) {
        // Update existing user
        user.username = username || user.username
        user.email = primaryEmail
        user.fullName = `${first_name || ""} ${last_name || ""}`.trim() || user.fullName
        user.profilePic = image_url || user.profilePic

        await user.save()
      } else if (type === "user.created") {
        // Create new user
        user = new User({
          clerkId: id,
          username: username || `user_${id.substring(0, 8)}`,
          email: primaryEmail,
          fullName: `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous User",
          profilePic: image_url,
        })

        await user.save()
      }
    } else if (type === "user.deleted") {
      // Handle user deletion
      const { id } = data
      await User.findOneAndDelete({ clerkId: id })
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// User routes
app.get("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    const user = req.user

    // Get follower and following counts
    const followersCount = user.followers.length
    const followingCount = user.following.length

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profilePic: user.profilePic,
      followers: followersCount,
      following: followingCount,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/users/profile", authenticateToken, async (req, res) => {
  try {
    const { username, fullName, profilePic } = req.body

    // Update user profile
    const user = req.user

    if (username) user.username = username
    if (fullName) user.fullName = fullName
    if (profilePic) user.profilePic = profilePic

    await user.save()

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profilePic: user.profilePic,
      followers: user.followers.length,
      following: user.following.length,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query
    const userId = req.user._id

    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [{ username: { $regex: q, $options: "i" } }, { fullName: { $regex: q, $options: "i" } }],
        },
      ],
    })

    // Check if current user is following each user
    const usersWithFollowStatus = users.map((user) => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      profilePic: user.profilePic,
      isFollowing: req.user.following.includes(user._id),
    }))

    res.json(usersWithFollowStatus)
  } catch (error) {
    console.error("User search error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/users/suggested", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id

    // Get users that the current user is not following
    const suggestedUsers = await User.find({
      $and: [{ _id: { $ne: userId } }, { _id: { $nin: req.user.following } }],
    }).limit(10)

    const usersWithFollowStatus = suggestedUsers.map((user) => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      profilePic: user.profilePic,
      isFollowing: false,
    }))

    res.json(usersWithFollowStatus)
  } catch (error) {
    console.error("Suggested users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/users/follow/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id
    const userToFollowId = req.params.id

    // Check if user exists
    const userToFollow = await User.findById(userToFollowId)
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update current user's following list
    await User.findByIdAndUpdate(userId, {
      $addToSet: { following: userToFollowId },
    })

    // Update target user's followers list
    await User.findByIdAndUpdate(userToFollowId, {
      $addToSet: { followers: userId },
    })

    res.json({ message: "User followed successfully" })
  } catch (error) {
    console.error("Follow user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/users/follow/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id
    const userToUnfollowId = req.params.id

    // Update current user's following list
    await User.findByIdAndUpdate(userId, {
      $pull: { following: userToUnfollowId },
    })

    // Update target user's followers list
    await User.findByIdAndUpdate(userToUnfollowId, {
      $pull: { followers: userId },
    })

    res.json({ message: "User unfollowed successfully" })
  } catch (error) {
    console.error("Unfollow user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/users/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id

    const messageCount = await Message.countDocuments({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })

    res.json({
      followers: req.user.followers.length,
      following: req.user.following.length,
      messages: messageCount,
    })
  } catch (error) {
    console.error("User stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Message routes
app.get("/api/messages/:userId", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user._id
    const otherUserId = req.params.userId

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    }).sort({ createdAt: 1 })

    // Mark messages as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: currentUserId, read: false },
      { $set: { read: true } },
    )

    res.json(messages)
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/chats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id

    // Find all messages where the user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 })

    // Get unique conversation partners
    const conversationPartners = new Map()

    for (const message of messages) {
      const partnerId =
        message.senderId.toString() === userId.toString() ? message.receiverId.toString() : message.senderId.toString()

      if (!conversationPartners.has(partnerId)) {
        conversationPartners.set(partnerId, {
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: message.receiverId.toString() === userId.toString() && !message.read ? 1 : 0,
        })
      } else if (message.receiverId.toString() === userId.toString() && !message.read) {
        const partner = conversationPartners.get(partnerId)
        partner.unreadCount += 1
      }
    }

    // Get user details for each conversation partner
    const chatPreviews = await Promise.all(
      Array.from(conversationPartners.entries()).map(async ([partnerId, data]) => {
        const partner = await User.findById(partnerId)
        if (!partner) return null

        return {
          id: partnerId,
          userId: partnerId,
          username: partner.username,
          fullName: partner.fullName,
          profilePic: partner.profilePic,
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime,
          unreadCount: data.unreadCount,
        }
      }),
    )

    // Filter out null values and sort by last message time
    const validChatPreviews = chatPreviews.filter(Boolean)
    validChatPreviews.sort((a, b) => b.lastMessageTime - a.lastMessageTime)

    res.json(validChatPreviews)
  } catch (error) {
    console.error("Get chats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// File upload routes
app.post("/api/upload/audio", authenticateToken, upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    res.json({ url: fileUrl })
  } catch (error) {
    console.error("Audio upload error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/upload/profile", authenticateToken, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`

    // Update user profile pic
    req.user.profilePic = fileUrl
    await req.user.save()

    res.json({ url: fileUrl })
  } catch (error) {
    console.error("Profile pic upload error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Socket.IO
io.use(authenticateSocket)

io.on("connection", (socket) => {
  const userId = socket.user._id
  console.log(`User connected: ${userId}`)

  // Store user's socket ID for direct messaging
  userSocketMap.set(userId.toString(), socket.id)

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const { receiverId, content, type = "text" } = data
      const senderId = userId

      // Create message in database
      const newMessage = new Message({
        senderId,
        receiverId,
        content,
        type,
        read: false,
      })

      const savedMessage = await newMessage.save()

      // Emit to sender
      socket.emit("receive_message", savedMessage)

      // Emit to receiver if online
      const receiverSocketId = userSocketMap.get(receiverId)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", savedMessage)
      }

      // Update chat list for both users
      socket.emit("update_chat_list")
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("update_chat_list")
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  })

  // Handle read receipts
  socket.on("message_read", async (data) => {
    try {
      const { messageId } = data

      // Update message in database
      const message = await Message.findById(messageId)

      if (message && message.receiverId.toString() === userId.toString()) {
        message.read = true
        await message.save()

        // Notify sender
        const senderSocketId = userSocketMap.get(message.senderId.toString())
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_read", { messageId })
        }
      }
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`)
    userSocketMap.delete(userId.toString())
  })
})

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
