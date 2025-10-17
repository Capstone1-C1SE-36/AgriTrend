import express from "express"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

let posts = [
  {
    id: 1,
    author: "Nguyễn Văn A",
    avatar: "NA",
    time: "2025-10-10T10:42:00Z",
    content:
      "Giá lúa gạo ST25 đang tăng mạnh, các bác nghĩ sao về xu hướng này? Có nên bán ngay hay giữ thêm?",
    likes: 12,
    comments: 5,
    tags: ["Lúa gạo", "Tư vấn"],
  },
  {
    id: 2,
    author: "Trần Thị B",
    avatar: "TB",
    time: "2025-09-10T13:42:00Z",
    content:
      "Mình vừa thu hoạch cà phê, giá hiện tại 52k/kg. Các bác cho mình xin ý kiến nên bán luôn hay chờ thêm?",
    likes: 8,
    comments: 3,
    tags: ["Cà phê", "Thu hoạch"],
  },
  {
    id: 3,
    author: "Lê Văn C",
    avatar: "LC",
    time: "2025-10-10T11:30:00Z",
    content:
      "Chia sẻ kinh nghiệm: Nên theo dõi giá hàng ngày và đặt cảnh báo để không bỏ lỡ thời điểm bán tốt nhất!",
    likes: 25,
    comments: 8,
    tags: ["Kinh nghiệm", "Mẹo hay"],
  },
]

// GET /api/community
router.get("/", (req, res) => {
  res.json(posts)
})

// POST /api/community
router.post("/", authenticateToken, (req, res) => {
  const newPost = {
    id: posts.length + 1,
    author: req.user.name || "Người dùng",
    avatar: (req.user.name || "ND").substring(0, 2).toUpperCase(),
    time: new Date().toISOString(),
    content: req.body.content,
    likes: 0,
    comments: 0,
    tags: req.body.tags || [],
  }

  posts.unshift(newPost)
  res.status(201).json(newPost)
})

export default router
