import express from "express"
import pool from "../db.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Tạo cảnh báo mới
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { product_id, threshold_price, condition } = req.body
    const [user] = await pool.query("SELECT email FROM users WHERE id = ?", [req.user.id])
    const email = user[0].email

    await pool.query(
      `INSERT INTO price_alerts (user_id, product_id, target_price, alert_condition, email)
   VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, product_id, threshold_price, condition, req.user.email]
    )

    res.json({ message: "✅ Đã tạo cảnh báo giá thành công!" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Lỗi khi tạo cảnh báo." })
  }
})

// Lấy danh sách cảnh báo của người dùng
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(`
  SELECT 
    a.*, 
    p.name AS product_name, 
 p.currentPrice,
p.previousPrice,
p.trend

  FROM price_alerts a
  JOIN products p ON a.product_id = p.id
  WHERE a.user_id = ?
  ORDER BY a.created_at DESC
`, [userId])


    res.json(rows);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách cảnh báo:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách cảnh báo." });
  }
});


// Xoá cảnh báo
router.delete("/:id", authenticateToken, async (req, res) => {
  await pool.query("DELETE FROM price_alerts WHERE id = ? AND user_id = ?", [req.params.id, req.user.id])
  res.json({ message: "🗑️ Đã xoá cảnh báo thành công" })
})

export default router
