import express from "express"
import { authenticateToken, isAdmin } from "../middleware/auth.js"

const router = express.Router()

// Mock users for admin management
const mockUsers = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    role: "user",
    status: "active",
    joinDate: "2024-01-15",
  },
  { id: 2, name: "Trần Thị B", email: "tranthib@gmail.com", role: "user", status: "active", joinDate: "2024-02-20" },
  { id: 3, name: "Admin", email: "admin@agriprice.vn", role: "admin", status: "active", joinDate: "2023-12-01" },
]

// Get all users (Admin only)
router.get("/", authenticateToken, isAdmin, (req, res) => {
  res.json(mockUsers)
})

// Update user (Admin only)
router.put("/:id", authenticateToken, isAdmin, (req, res) => {
  const index = mockUsers.findIndex((u) => u.id === Number.parseInt(req.params.id))

  if (index === -1) {
    return res.status(404).json({ error: "User not found" })
  }

  mockUsers[index] = { ...mockUsers[index], ...req.body }
  res.json(mockUsers[index])
})

// Delete user (Admin only)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
  const index = mockUsers.findIndex((u) => u.id === Number.parseInt(req.params.id))

  if (index === -1) {
    return res.status(404).json({ error: "User not found" })
  }

  mockUsers.splice(index, 1)
  res.json({ message: "User deleted successfully" })
})

export default router
