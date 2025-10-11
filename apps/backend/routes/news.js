import express from "express"
import { authenticateToken, isAdmin } from "../middleware/auth.js"

const router = express.Router()

const news = [
  {
    id: 1,
    title: "Giá lúa gạo tăng mạnh trong tuần qua",
    content: "Giá lúa gạo tại Đồng bằng sông Cửu Long tăng 5% so với tuần trước...",
    status: "published",
    createdAt: "2024-03-15T10:00:00Z",
  },
]

// Get all news
router.get("/", (req, res) => {
  const published = news.filter((n) => n.status === "published")
  res.json(published)
})

// Get all news (Admin - including drafts)
router.get("/admin", authenticateToken, isAdmin, (req, res) => {
  res.json(news)
})

// Create news (Admin only)
router.post("/", authenticateToken, isAdmin, (req, res) => {
  const newNews = {
    id: news.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
  }

  news.push(newNews)
  res.status(201).json(newNews)
})

// Update news (Admin only)
router.put("/:id", authenticateToken, isAdmin, (req, res) => {
  const index = news.findIndex((n) => n.id === Number.parseInt(req.params.id))

  if (index === -1) {
    return res.status(404).json({ error: "News not found" })
  }

  news[index] = { ...news[index], ...req.body }
  res.json(news[index])
})

// Delete news (Admin only)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
  const index = news.findIndex((n) => n.id === Number.parseInt(req.params.id))

  if (index === -1) {
    return res.status(404).json({ error: "News not found" })
  }

  news.splice(index, 1)
  res.json({ message: "News deleted successfully" })
})

export default router
