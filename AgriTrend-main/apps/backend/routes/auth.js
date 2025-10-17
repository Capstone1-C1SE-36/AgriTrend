import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";

dotenv.config();

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET

// Mock users database
const users = [
  {
    id: 1,
    email: "admin@agriprice.vn",
    password: "$2a$10$T29JR61meNJ4J.rApPd4Gut9qzdrLBdXHeKGeAP0jlzeHWM.RYEOG", // "admin123"
    name: "Quản Trị Viên",
    role: "admin",
  },
  {
    id: 2,
    email: "user@example.com",
    password: "$2a$10$CDKHxesW0.zpHa/KYQsOG.xgbkVkhD0WJJmyr4ZNwrBSNqPgSWHh6", // "user123"
    name: "Người Dùng",
    role: "user",
  },
]

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body

    // Check if user exists
    const existingUser = users.find((u) => u.email === email)
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name,
      role: "user",
    }

    users.push(newUser)

    // Generate token
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
      expiresIn: "7d",
    })

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: "Registration failed" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = users.find((u) => u.email === email)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ error: "Login failed" })
  }
})

// Get current user
router.get("/me", (req, res) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = users.find((u) => u.id === decoded.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    res.status(403).json({ error: "Invalid token" })
  }
})

export default router
