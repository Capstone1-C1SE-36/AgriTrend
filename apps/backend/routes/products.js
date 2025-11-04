import express from "express"
import pool from "../db.js"
import { authenticateToken, isAdmin } from "../middleware/auth.js"

const router = express.Router()
export const ioRef = { io: null }

router.get("/", async (req, res) => {
  try {
    const { search, category, region, ids, page = 1, limit = 3 } = req.query

    // Query JOIN với categories
    let baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `
    const params = []

    // Lọc theo danh sách ID (nếu có)
    if (ids) {
      const idList = ids.split(",").map(id => Number(id))
      baseQuery += ` AND p.id IN (${idList.map(() => "?").join(",")})`
      params.push(...idList)
    }

    // Lọc theo tên sản phẩm
    if (search) {
      baseQuery += " AND p.name LIKE ?"
      params.push(`%${search}%`)
    }

    // Lọc theo tên loại (category name)
    if (category) {
      baseQuery += " AND c.name = ?"
      params.push(category)
    }

    // Lọc theo vùng
    if (region) {
      baseQuery += " AND p.region = ?"
      params.push(region)
    }

    // Đếm tổng số dòng
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count ${baseQuery}`,
      params
    )
    const total = countRows[0].count
    const totalPages = Math.ceil(total / limit)

    // Phân trang
    const offset = (page - 1) * limit
    baseQuery += " ORDER BY p.id DESC LIMIT ? OFFSET ?"
    params.push(Number(limit), Number(offset))

    // Truy vấn dữ liệu
    const [rows] = await pool.query(
      `SELECT 
        p.*, 
        c.name AS category_name
       ${baseQuery}`,
      params
    )

    const products = rows.map(p => ({
      ...p,
      category: p.category_name, // giữ lại field category cho frontend
      currentPrice: Number(p.currentPrice),
      previousPrice: Number(p.previousPrice),
    }))

    res.json({ page: Number(page), totalPages, data: products })
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})


router.get("/all", async (req, res) => {
  try {
    const [rows] = await pool.query(`
  SELECT 
    p.*, 
    c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  ORDER BY p.id DESC
`)
    const products = rows.map(p => ({
      ...p,
      category: p.category_name,
      currentPrice: Number(p.currentPrice),
      previousPrice: Number(p.previousPrice),
    }))
    res.json(products)
  } catch (error) {
    console.error("❌ Lỗi khi lấy toàn bộ sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

router.get("/categories", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name FROM categories ORDER BY name ASC")
    res.json(rows)
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách loại:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})


// API lấy dữ liệu cho LivePriceTicker
router.get("/ticker", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, currentPrice, previousPrice, trend 
       FROM products 
       ORDER BY lastUpdate DESC 
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

    // JOIN với bảng categories để lấy tên loại
    const [products] = await pool.query(
      `
      SELECT 
        p.*, 
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      `,
      [req.params.id]
    )

    if (products.length === 0)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" })

    // Lấy lịch sử giá theo khoảng thời gian
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
    history.forEach(h => h.price = Number(h.price))

    // Chuẩn hóa dữ liệu trả về
    const product = {
      ...products[0],
      category: products[0].category_name, // giữ tên trường 'category' cho frontend
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

    // Tìm category_id từ tên loại
    const [catRows] = await pool.query("SELECT id FROM categories WHERE name = ?", [category])
    if (catRows.length === 0) {
      return res.status(400).json({ error: `Loại sản phẩm '${category}' không tồn tại` })
    }
    const category_id = catRows[0].id

    // Thêm sản phẩm
    const [result] = await pool.query(
      `INSERT INTO products (name, category_id, currentPrice, previousPrice, unit, region, lastUpdate, trend)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'stable')`,
      [name, category_id, currentPrice, currentPrice, unit, region]
    )

    // Lấy lại sản phẩm mới, kèm tên loại
    const [newProduct] = await pool.query(
      `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      `,
      [result.insertId]
    )

    const product = {
      ...newProduct[0],
      category: newProduct[0].category_name,
      currentPrice: Number(newProduct[0].currentPrice),
      previousPrice: Number(newProduct[0].previousPrice),
    }

    // Lưu lịch sử giá
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

    // Kiểm tra dữ liệu đầu vào
    if (!name || !category || !currentPrice || !unit || !region) {
      return res.status(400).json({ error: "Thiếu thông tin sản phẩm" })
    }

    // Lấy sản phẩm hiện có
    const [existing] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm" })

    const old = existing[0]

    // Xác định xu hướng giá
    const trend =
      currentPrice > old.currentPrice ? "up" :
        currentPrice < old.currentPrice ? "down" : "stable"

    // Lấy category_id từ tên loại
    const [catRows] = await pool.query("SELECT id FROM categories WHERE name = ?", [category])
    if (catRows.length === 0) {
      return res.status(400).json({ error: "Loại sản phẩm không hợp lệ" })
    }
    const category_id = catRows[0].id

    // Cập nhật sản phẩm
    await pool.query(
      `UPDATE products
       SET name=?, category_id=?, currentPrice=?, previousPrice=?, unit=?, region=?, trend=?, lastUpdate=NOW()
       WHERE id=?`,
      [name, category_id, currentPrice, old.currentPrice, unit, region, trend, req.params.id]
    )

    // Ghi lại lịch sử giá
    await pool.query("INSERT INTO price_history (product_id, price) VALUES (?, ?)", [
      req.params.id,
      currentPrice,
    ])

    // Lấy lại thông tin sau khi cập nhật
    const [updated] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    )

    const product = {
      ...updated[0],
      category: updated[0].category_name,
      currentPrice: Number(updated[0].currentPrice),
      previousPrice: Number(updated[0].previousPrice),
    }

    // Gửi cập nhật qua WebSocket
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
    const productId = req.params.id

    // Kiểm tra sản phẩm tồn tại và lấy thêm tên loại (nếu có)
    const [exists] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [productId]
    )

    if (exists.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" })
    }

    // Xoá sản phẩm (tự động xoá lịch sử giá, favorites, alerts nhờ ON DELETE CASCADE)
    await pool.query("DELETE FROM products WHERE id = ?", [productId])

    // Thông báo realtime cho client
    if (ioRef.io) ioRef.io.emit("productDeleted", { id: Number(productId) })

    res.json({
      message: "Đã xóa sản phẩm thành công",
      deleted: {
        ...exists[0],
        category: exists[0].category_name,
        currentPrice: Number(exists[0].currentPrice),
        previousPrice: Number(exists[0].previousPrice),
      },
    })
  } catch (error) {
    console.error("❌ Lỗi khi xóa sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

// API cập nhật giá nhanh (chỉ admin)
router.patch("/:id/price", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { newPrice } = req.body
    if (!newPrice) return res.status(400).json({ error: "Thiếu giá mới" })

    // Kiểm tra sản phẩm tồn tại
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm" })

    const product = {
      ...rows[0],
      currentPrice: Number(rows[0].currentPrice),
      previousPrice: Number(rows[0].previousPrice),
    }

    // Xác định xu hướng
    const trend =
      newPrice > product.currentPrice ? "up" :
        newPrice < product.currentPrice ? "down" : "stable"

    // Cập nhật giá trong bảng products
    await pool.query(
      `UPDATE products 
       SET previousPrice=?, currentPrice=?, trend=?, lastUpdate=NOW() 
       WHERE id=?`,
      [product.currentPrice, newPrice, trend, req.params.id]
    )

    // Ghi vào bảng price_history
    await pool.query("INSERT INTO price_history (product_id, price) VALUES (?, ?)", [
      req.params.id,
      newPrice,
    ])

    // Lấy lại thông tin đầy đủ của sản phẩm (kèm tên loại)
    const [updated] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    )

    const updatedProduct = {
      ...updated[0],
      category: updated[0].category_name,
      currentPrice: Number(updated[0].currentPrice),
      previousPrice: Number(updated[0].previousPrice),
    }

    // Gửi thông báo realtime
    if (ioRef.io)
      ioRef.io.emit("priceUpdate", {
        id: updatedProduct.id,
        newPrice,
        previousPrice: product.currentPrice,
      })

    console.log(`📢 Giá sản phẩm "${product.name}" đã được cập nhật nhanh: ${newPrice}`)
    res.json(updatedProduct)
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật giá:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

export default router
