const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

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
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return res.status(401).json({ message: "Unauthorized" })

  jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Forbidden" })
    req.user = user
    next()
  })
}

// Socket.IO authentication middleware
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token

  if (!token) {
    return next(new Error("Authentication error"))
  }

  jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret", (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error"))
    }

    socket.user = decoded
    next()
  })
}

// API Routes

// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
    })

    const savedUser = await newUser.save()

    // Generate JWT
    const token = jwt.sign(
      { id: savedUser._id, username: savedUser.username },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "30d" },
    )

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        fullName: savedUser.fullName,
        profilePic: savedUser.profilePic,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "30d",
    })

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// User routes
app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query
    const userId = req.user.id

    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [{ username: { $regex: q, $options: "i" } }, { fullName: { $regex: q, $options: "i" } }],
        },
      ],
    }).select("-password")

    // Check if current user is following each user
    const currentUser = await User.findById(userId)

    const usersWithFollowStatus = users.map((user) => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      profilePic: user.profilePic,
      isFollowing: currentUser.following.includes(user._id),
    }))

    res.json(usersWithFollowStatus)
  } catch (error) {
    console.error("User search error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/users/suggested", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Get users that the current user is not following
    const currentUser = await User.findById(userId)

    const suggestedUsers = await User.find({
      $and: [{ _id: { $ne: userId } }, { _id: { $nin: currentUser.following } }],
    })
      .select("-password")
      .limit(10)

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
    const userId = req.user.id
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
    const userId = req.user.id
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
    const userId = req.user.id

    const user = await User.findById(userId)

    const messageCount = await Message.countDocuments({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })

    res.json({
      followers: user.followers.length,
      following: user.following.length,
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
    const currentUserId = req.user.id
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
    const userId = req.user.id

    // Find all messages where the user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 })

    // Get unique conversation partners
    const conversationPartners = new Map()

    for (const message of messages) {
      const partnerId =
        message.senderId.toString() === userId ? message.receiverId.toString() : message.senderId.toString()

      if (!conversationPartners.has(partnerId)) {
        conversationPartners.set(partnerId, {
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: message.receiverId.toString() === userId && !message.read ? 1 : 0,
        })
      } else if (message.receiverId.toString() === userId && !message.read) {
        const partner = conversationPartners.get(partnerId)
        partner.unreadCount += 1
      }
    }

    // Get user details for each conversation partner
    const chatPreviews = await Promise.all(
      Array.from(conversationPartners.entries()).map(async ([partnerId, data]) => {
        const partner = await User.findById(partnerId).select("-password")

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

    // Sort by last message time
    chatPreviews.sort((a, b) => b.lastMessageTime - a.lastMessageTime)

    res.json(chatPreviews)
  } catch (error) {
    console.error("Get chats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// File upload routes
app.post("/api/upload/audio", upload.single("audio"), (req, res) => {
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

    const userId = req.user.id
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`

    // Update user profile pic
    await User.findByIdAndUpdate(userId, { profilePic: fileUrl })

    res.json({ url: fileUrl })
  } catch (error) {
    console.error("Profile pic upload error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Socket.IO
io.use(authenticateSocket)

io.on("connection", (socket) => {
  const userId = socket.user.id
  console.log(`User connected: ${userId}`)

  // Store user's socket ID for direct messaging
  const userSocketMap = new Map()
  userSocketMap.set(userId, socket.id)

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

      if (message && message.receiverId.toString() === userId) {
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
    userSocketMap.delete(userId)
  })
})

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

