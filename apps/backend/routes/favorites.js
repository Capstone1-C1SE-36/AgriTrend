import express from "express"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Mock lưu yêu thích cho từng user
const userFavorites = {} // { userId: [productId, ...] }

// ✅ Lấy danh sách sản phẩm yêu thích của user
router.get("/", authenticateToken, (req, res) => {
    const userId = req.user.id
    res.json(userFavorites[userId] || [])
})

// ✅ Thêm hoặc bỏ yêu thích
router.post("/:productId", authenticateToken, (req, res) => {
    const userId = req.user.id
    const productId = Number(req.params.productId)

    userFavorites[userId] = userFavorites[userId] || []
    const favs = userFavorites[userId]

    if (favs.includes(productId)) {
        userFavorites[userId] = favs.filter((id) => id !== productId)
    } else {
        userFavorites[userId].push(productId)
    }

    res.json({ favorites: userFavorites[userId] })
})

export default router
