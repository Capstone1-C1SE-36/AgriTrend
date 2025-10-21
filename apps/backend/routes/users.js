import express from "express"
import { authenticateToken, isAdmin } from "../middleware/auth.js"
import pool from "../db.js"

const router = express.Router()

// 🧩 Lấy danh sách tất cả người dùng (Admin)
router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role, status, joinDate FROM users")
    res.json(rows)
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách người dùng:", error)
    res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách người dùng" })
  }
})

// 🧩 Cập nhật thông tin người dùng (Admin)
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  const { name, email, role, status } = req.body
  const id = parseInt(req.params.id)

  try {
    const [result] = await pool.query(
      `UPDATE users SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [name, email, role, status, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" })
    }

    const [updatedUser] = await pool.query(
      "SELECT id, name, email, role, status, joinDate FROM users WHERE id = ?",
      [id]
    )

    res.json(updatedUser[0])
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật người dùng:", error)
    res.status(500).json({ error: "Lỗi máy chủ khi cập nhật người dùng" })
  }
})

// 🗑️ Xóa người dùng (Admin)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" })
    }

    res.json({ message: "Đã xóa người dùng thành công" })
  } catch (error) {
    console.error("❌ Lỗi khi xóa người dùng:", error)
    res.status(500).json({ error: "Lỗi máy chủ khi xóa người dùng" })
  }
})

export default router
