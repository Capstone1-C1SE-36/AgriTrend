import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import pool from "../db.js"
import { verifyClerkToken } from "../middleware/verifyClerk.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Đăng ký tài khoản (email + password)
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

    // Thêm user mới
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

    // Tạo JWT
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: "1h" })
    res.status(201).json({ token, user: newUser })
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký:", error)
    res.status(500).json({ error: "Đăng ký thất bại" })
  }
})

// Đăng nhập bằng email + password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email])
    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" })
    }

    const user = rows[0]

    // Kiểm tra trạng thái tài khoản
    if (user.status === "banned") {
      return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Sai mật khẩu" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, avatar_url: user.avatar_url, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("❌ Lỗi khi đăng nhập:", error)
    res.status(500).json({ error: "Đăng nhập thất bại" })
  }
})

// Đăng nhập qua Clerk (Google, Email, v.v.)
router.post("/clerk-login", verifyClerkToken, async (req, res) => {
  try {
    const { email, name, id: clerkId, imageUrl } = req.clerkUser

    if (!email) {
      return res.status(400).json({ error: "Email không tồn tại trong tài khoản Clerk" })
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

    let user
    if (rows.length === 0) {
      const fullName = name || "Người dùng Clerk"
      const dummyPassword = await bcrypt.hash(clerkId || "clerk_default_password", 5)

      const [result] = await pool.query(
        "INSERT INTO users (name, email, avatar_url, password, role, status, joinDate) VALUES (?, ?, ?, ?, 'user', 'active', CURDATE())",
        [fullName, email, imageUrl, dummyPassword]
      )

      user = { id: result.insertId, email, name: fullName, avatar_url: imageUrl, role: "user" }
    } else {
      user = rows[0]
    }

    // Nếu tài khoản bị khóa
    if (user.status === "banned") {
      return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    )

    res.json({ token, user, loginType: "clerk" })
    // console.log("✅ Clerk login successful for user:", user)
  } catch (error) {
    console.error("❌ Lỗi Clerk login:", error)
    res.status(500).json({ error: "Clerk login failed" })
  }
})


// Lấy thông tin user hiện tại (JWT)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, avatar_url, role, status, joinDate FROM users WHERE id = ?",
      [req.user.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" })
    }

    res.json(rows[0])
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông tin user:", error)
    res.status(500).json({ error: "Lỗi server" })
  }
})

export default router
