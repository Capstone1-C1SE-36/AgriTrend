import express from "express"
import pool from "../db.js"
import { authenticateToken, isAdmin } from "../middleware/auth.js"

const router = express.Router()
export const ioRef = { io: null }

// Lấy tất cả sản phẩm (có thể lọc search, category, region)
router.get("/", async (req, res) => {
  try {
    const { search, category, region } = req.query
    let query = "SELECT * FROM products WHERE 1=1"
    const params = []

    if (search) {
      query += " AND name LIKE ?"
      params.push(`%${search}%`)
    }
    if (category) {
      query += " AND category = ?"
      params.push(category)
    }
    if (region) {
      query += " AND region = ?"
      params.push(region)
    }

    const [rows] = await pool.query(query, params)
    const products = rows.map(p => ({
      ...p,
      currentPrice: Number(p.currentPrice),
      previousPrice: Number(p.previousPrice),
    }))

    res.json(products)
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

// API lấy dữ liệu cho LivePriceTicker
router.get("/ticker", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, currentPrice, previousPrice, trend 
       FROM products 
       ORDER BY RAND()
       LIMIT 10`
    )

    const data = rows.map(p => {
      const current = Number(p.currentPrice)
      const previous = Number(p.previousPrice)
      const change = previous ? ((current - previous) / previous) * 100 : 0

      return {
        id: p.id,
        name: p.name,
        price: current,
        change: Number(change.toFixed(1)),
        trend: current > previous ? "up" : current < previous ? "down" : "stable",
      }
    })

    res.json(data)
  } catch (error) {
    console.error("❌ Lỗi khi lấy dữ liệu ticker:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

// Lấy chi tiết 1 sản phẩm + lịch sử giá (theo thời gian tùy chọn)
router.get("/:id", async (req, res) => {
  try {
    const range = req.query.range || "30d"
    const [products] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    if (products.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm" })

    let historyQuery = ""
    const params = [req.params.id]

    if (range === "1d") {
      historyQuery = `
        SELECT price, updated_at AS date
        FROM price_history
        WHERE product_id = ?
          AND DATE(updated_at) = CURDATE()
        ORDER BY updated_at ASC
      `
    } else if (range === "30d") {
      historyQuery = `
        SELECT DATE(updated_at) AS date, MAX(price) AS price
        FROM price_history
        WHERE product_id = ?
          AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(updated_at)
        ORDER BY date ASC
      `
    } else if (range === "6m") {
      historyQuery = `
        SELECT DATE(updated_at) AS date, MAX(price) AS price
        FROM price_history
        WHERE product_id = ?
          AND updated_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE(updated_at)
        ORDER BY date ASC
      `
    } else if (range === "1y") {
      historyQuery = `
        SELECT DATE(updated_at) AS date, MAX(price) AS price
        FROM price_history
        WHERE product_id = ?
          AND updated_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
        GROUP BY DATE(updated_at)
        ORDER BY date ASC
      `
    } else {
      historyQuery = `
        SELECT DATE(updated_at) AS date, MAX(price) AS price
        FROM price_history
        WHERE product_id = ?
        GROUP BY DATE(updated_at)
        ORDER BY date ASC
      `
    }

    const [history] = await pool.query(historyQuery, params)
    const product = {
      ...products[0],
      currentPrice: Number(products[0].currentPrice),
      previousPrice: Number(products[0].previousPrice),
    }

    res.json({ ...product, history })
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})


// Tạo sản phẩm mới (Admin)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, category, currentPrice, unit, region } = req.body
    if (!name || !category || !currentPrice || !unit || !region) {
      return res.status(400).json({ error: "Thiếu thông tin sản phẩm" })
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, category, currentPrice, previousPrice, unit, region, lastUpdate, trend)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'stable')`,
      [name, category, currentPrice, currentPrice, unit, region]
    )

    const [newProduct] = await pool.query("SELECT * FROM products WHERE id = ?", [result.insertId])
    const product = {
      ...newProduct[0],
      currentPrice: Number(newProduct[0].currentPrice),
      previousPrice: Number(newProduct[0].previousPrice),
    }

    await pool.query("INSERT INTO price_history (product_id, price) VALUES (?, ?)", [
      result.insertId,
      currentPrice,
    ])

    if (ioRef.io) ioRef.io.emit("productAdded", product)

    res.status(201).json(product)
  } catch (error) {
    console.error("❌ Lỗi khi thêm sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

// Cập nhật sản phẩm
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, category, currentPrice, unit, region } = req.body

    const [existing] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm" })

    const old = existing[0]
    const trend =
      currentPrice > old.currentPrice ? "up" : currentPrice < old.currentPrice ? "down" : "stable"

    await pool.query(
      `UPDATE products
       SET name=?, category=?, currentPrice=?, previousPrice=?, unit=?, region=?, trend=?, lastUpdate=NOW()
       WHERE id=?`,
      [name, category, currentPrice, old.currentPrice, unit, region, trend, req.params.id]
    )

    await pool.query("INSERT INTO price_history (product_id, price) VALUES (?, ?)", [
      req.params.id,
      currentPrice,
    ])

    const [updated] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    const product = {
      ...updated[0],
      currentPrice: Number(updated[0].currentPrice),
      previousPrice: Number(updated[0].previousPrice),
    }

    // Emit cả hai để đồng bộ toàn bộ client
    if (ioRef.io) {
      ioRef.io.emit("productUpdated", product)
      ioRef.io.emit("priceUpdate", {
        id: product.id,
        newPrice: product.currentPrice,
        previousPrice: product.previousPrice,
      })
    }

    res.json(product)
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})


// Xóa sản phẩm
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [exists] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    if (exists.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm" })

    await pool.query("DELETE FROM products WHERE id = ?", [req.params.id])

    if (ioRef.io) ioRef.io.emit("productDeleted", { id: Number(req.params.id) })

    res.json({ message: "Đã xóa sản phẩm", deleted: exists[0] })
  } catch (error) {
    console.error("❌ Lỗi khi xóa sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

// API cập nhật giá nhanh (chỉ admin)
router.patch("/:id/price", authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log("📦 req.body:", req.body)
    const { newPrice } = req.body
    if (!newPrice) return res.status(400).json({ error: "Thiếu giá mới" })

    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm" })

    const product = {
      ...rows[0],
      currentPrice: Number(rows[0].currentPrice),
      previousPrice: Number(rows[0].previousPrice),
    }

    const trend =
      newPrice > product.currentPrice ? "up" : newPrice < product.currentPrice ? "down" : "stable"

    await pool.query(
      `UPDATE products SET previousPrice=?, currentPrice=?, trend=?, lastUpdate=NOW() WHERE id=?`,
      [product.currentPrice, newPrice, trend, req.params.id]
    )

    await pool.query("INSERT INTO price_history (product_id, price) VALUES (?, ?)", [
      req.params.id,
      newPrice,
    ])

    const [updated] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    const updatedProduct = {
      ...updated[0],
      currentPrice: Number(updated[0].currentPrice),
      previousPrice: Number(updated[0].previousPrice),
    }

    if (ioRef.io)
      ioRef.io.emit("priceUpdate", {
        id: updatedProduct.id,
        newPrice,
        previousPrice: product.currentPrice,
      })

    console.log(`📢 Giá sản phẩm ${product.name} đã được cập nhật nhanh: ${newPrice}`)
    res.json(updatedProduct)
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật giá:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

export default router
