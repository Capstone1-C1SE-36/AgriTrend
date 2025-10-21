import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import pool from "../db.js"

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// 🧩 Đăng ký tài khoản
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Thiếu thông tin đăng ký" })
    }

    // Kiểm tra email tồn tại
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email])
    if (rows.length > 0) {
      return res.status(400).json({ error: "Email đã được sử dụng" })
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10)

    // Thêm user mới vào DB
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, status, joinDate) VALUES (?, ?, ?, 'user', 'active', CURDATE())",
      [name, email, hashedPassword]
    )

    const newUser = {
      id: result.insertId,
      email,
      name,
      role: "user",
    }

    // Tạo token JWT
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: "1h" })

    res.status(201).json({ token, user: newUser })
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký:", error)
    res.status(500).json({ error: "Đăng ký thất bại" })
  }
})

// 🧩 Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Kiểm tra user có tồn tại
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email])
    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" })
    }

    const user = rows[0]

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Sai mật khẩu" })
    }

    // Tạo token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    )

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
    console.error("❌ Lỗi khi đăng nhập:", error)
    res.status(500).json({ error: "Đăng nhập thất bại" })
  }
})

// 🧩 Lấy thông tin user hiện tại
router.get("/me", async (req, res) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) return res.status(401).json({ error: "Chưa đăng nhập" })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    const [rows] = await pool.query("SELECT id, name, email, role, status, joinDate FROM users WHERE id = ?", [
      decoded.id,
    ])

    if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy người dùng" })

    res.json(rows[0])
  } catch (error) {
    res.status(403).json({ error: "Token không hợp lệ" })
  }
})

export default router
