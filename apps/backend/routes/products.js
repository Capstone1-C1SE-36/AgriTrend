import express from "express"
import pool from "../db.js" //
import { authenticateToken, isAdmin } from "../middleware/auth.js" //

const router = express.Router()
export const ioRef = { io: null }

/**
 * Phân tích dữ liệu và tạo tóm tắt
 * @param {object} product - Thông tin sản phẩm (currentPrice, trend)
 * @param {object} stats - Thống kê (high_30d, low_30d, avg_30d)
 * @param {Array} history - Lịch sử (chứa 'forecast' SMA)
 * @param {Array} news - Tin tức liên quan
 * @returns {object} - Gồm { summary: string, sentiment: string }
 */
function generateAnalysis(product, stats, history, news) {
  const analysisPoints = [];
  let sentimentScore = 0; // Điểm tâm lý

  const currentPrice = Number(product.currentPrice);
  const avg_30d = Number(stats.avg_30d);
  const high_30d = Number(stats.high_30d);
  const low_30d = Number(stats.low_30d);

  // 1. Phân tích Giá hiện tại
  if (product.trend === 'up') {
    analysisPoints.push("Giá đang có xu hướng <b>tăng</b>.");
    sentimentScore++;
  } else if (product.trend === 'down') {
    analysisPoints.push("Giá đang có xu hướng <b>giảm</b>.");
    sentimentScore--;
  }

  // 2. Phân tích so với Thống kê (chỉ chạy nếu có dữ liệu)
  if (avg_30d > 0) {
    if (currentPrice > avg_30d * 1.05) { // Cao hơn 5% so với trung bình
      analysisPoints.push("Hiện đang giao dịch ở mức <b>cao hơn</b> đáng kể so với trung bình 30 ngày.");
      sentimentScore++;
    } else if (currentPrice < avg_30d * 0.95) { // Thấp hơn 5%
      analysisPoints.push("Hiện đang giao dịch ở mức <b>thấp hơn</b> đáng kể so với trung bình 30 ngày.");
      sentimentScore--;
    } else {
      analysisPoints.push("Giá đang đi <b>sát</b> mức trung bình 30 ngày.");
    }
    
    // So với đỉnh/đáy
    if (currentPrice >= high_30d * 0.98) { // Gần đỉnh
      analysisPoints.push("Giá đang <b>áp sát mức cao nhất</b> trong 30 ngày qua.");
      sentimentScore++;
    }
    if (currentPrice <= low_30d * 1.02) { // Gần đáy
      analysisPoints.push("Giá đang <b>tiệm cận mức thấp nhất</b> trong 30 ngày qua.");
      sentimentScore--;
    }
  }

  // 3. Phân tích Dự báo (SMA)
  if (history && history.length >= 2) {
    const lastSMA = history[history.length - 1]?.forecast;
    const prevSMA = history[history.length - 2]?.forecast;
    
    if (lastSMA && prevSMA) {
      if (lastSMA > prevSMA) {
        analysisPoints.push("Phân tích kỹ thuật (SMA) cho thấy xu hướng ngắn hạn <b>đang tăng</b>.");
        sentimentScore++;
      } else if (lastSMA < prevSMA) {
        analysisPoints.push("Phân tích kỹ thuật (SMA) cho thấy xu hướng ngắn hạn <b>đang giảm</b>.");
        sentimentScore--;
      }
    }
  }

  // 4. Phân tích Tin tức
  if (news && news.length > 0) {
    analysisPoints.push("Thị trường đang được <b>hỗ trợ bởi tin tức</b> liên quan.");
    sentimentScore++; // Giả định tin tức là tích cực (có thể nâng cấp sau)
  }

  // 5. Tính Tâm lý
  let sentimentText = "Trung tính";
  if (sentimentScore >= 3) sentimentText = "Rất Tích cực";
  else if (sentimentScore >= 1) sentimentText = "Tích cực";
  else if (sentimentScore <= -3) sentimentText = "Rất Tiêu cực";
  else if (sentimentScore <= -1) sentimentText = "Tiêu cực";

  return {
    summary: analysisPoints.join(" "), // Nối các câu phân tích lại
    sentiment: sentimentText
  };
}
// --- KẾT THÚC BỘ NÃO AI ---


// --- CÁC HÀM HELPER CŨ ---
const calculateSMA = (data, window, key = "price") => {
  return data.map((item, index, arr) => {
    if (index < window - 1) {
      return { ...item, forecast: null };
    }
    const slice = arr.slice(index - window + 1, index + 1);
    const sum = slice.reduce((acc, val) => acc + Number(val[key]), 0);
    const sma = sum / window;
    return { ...item, forecast: sma };
  });
};

function getNewsKeywords(productName) {
  const lower = productName.toLowerCase();
  if (lower.includes("cà phê")) return "cà phê";
  if (lower.includes("lúa") || lower.includes("gạo")) return "lúa gạo";
  if (lower.includes("tiêu")) return "tiêu";
  if (lower.includes("xoài")) return "xoài";
  if (lower.includes("thanh long")) return "thanh long";
  if (lower.includes("cao su")) return "cao su";
  if (lower.includes("ca cao")) return "ca cao";
  return null;
}
// --- HẾT HÀM HELPER ---


router.get("/", async (req, res) => {
  try {
    const { search, category, region, ids, page = 1, limit = 3 } = req.query
    let baseQuery = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `
    const params = []
    if (ids) {
      const idList = ids.split(",").map(id => Number(id))
      baseQuery += ` AND p.id IN (${idList.map(() => "?").join(",")})`
      params.push(...idList)
    }
    if (search) {
      baseQuery += " AND p.name LIKE ?"
      params.push(`%${search}%`)
    }
    if (category) {
      baseQuery += " AND c.name = ?"
      params.push(category)
    }
    if (region) {
      baseQuery += " AND p.region = ?"
      params.push(region)
    }
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count ${baseQuery}`,
      params
    )
    const total = countRows[0].count
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    baseQuery += " ORDER BY p.id DESC LIMIT ? OFFSET ?"
    params.push(Number(limit), Number(offset))
    const [rows] = await pool.query(
      `SELECT 
        p.*, 
        c.name AS category_name
       ${baseQuery}`,
      params
    )
    const products = rows.map(p => ({
      ...p,
      category: p.category_name,
      currentPrice: Number(p.currentPrice),
      previousPrice: Number(p.previousPrice),
    }))
    res.json({ page: Number(page), totalPages, data: products })
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

// ===========================================
// --- 🚀 ĐÃ SỬA LỖI KÝ TỰ RÁC (SPACES) ---
// ===========================================
router.get("/all", async (req, res) => {
  try {
    // Đã xóa ký tự rác khỏi câu SQL
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
// ===========================================

router.get("/map-data", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.region, 
        p.currentPrice,
        c.name AS category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.region IS NOT NULL 
        AND p.region != 'Toàn quốc' 
        AND p.currentPrice > 0
    `);
    
    const mapData = rows.map(p => ({
      ...p,
      currentPrice: Number(p.currentPrice),
      regionKey: p.region.toLowerCase()
          .replace(/tỉnh /g, "")
          .replace(/thành phố /g, "")
          .replace(/tp. /g, "")
          .replace(/đ/g, "d")
          .replace(/ă/g, "a")
          .replace(/â/g, "a")
          .replace(/ê/g, "e")
          .replace(/ô/g, "o")
          .replace(/ơ/g, "o")
          .replace(/ư/g, "u")
          .trim()
    }));
    
    res.json(mapData);
  } catch (error) {
    console.error("❌ Lỗi khi lấy dữ liệu bản đồ:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    // Sửa lỗi: Chỉ lấy các category CÓ SẢN PHẨM
    const [rows] = await pool.query(`
      SELECT DISTINCT c.id, c.name
      FROM categories c
      INNER JOIN products p ON p.category_id = c.id
      ORDER BY c.name ASC
    `);
    res.json(rows)
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách loại:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// Thêm loại sản phẩm mới (chỉ admin)
router.post("/categories", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Tên loại sản phẩm không được để trống" })
    }
    const [exists] = await pool.query("SELECT id FROM categories WHERE name = ?", [name.trim()])
    if (exists.length > 0) {
      return res.status(400).json({ error: `Loại sản phẩm '${name}' đã tồn tại` })
    }
    const [result] = await pool.query(
      "INSERT INTO categories (name) VALUES (?)",
      [name.trim()]
    )
    const [newCat] = await pool.query(
      "SELECT id, name, created_at FROM categories WHERE id = ?",
      [result.insertId]
    )
    res.status(201).json({
      message: "✅ Đã tạo loại sản phẩm mới thành công",
      category: newCat[0],
    })
  } catch (error) {
    console.error("❌ Lỗi khi tạo loại sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

// Cập nhật loại sản phẩm (chỉ admin)
router.put("/categories/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body
    const { id } = req.params
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Tên loại sản phẩm không được để trống" })
    }
    const [exists] = await pool.query("SELECT id FROM categories WHERE id = ?", [id])
    if (exists.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy loại sản phẩm" })
    }
    const [dup] = await pool.query(
      "SELECT id FROM categories WHERE name = ? AND id != ?",
      [name.trim(), id]
    )
    if (dup.length > 0) {
      return res.status(400).json({ error: `Tên loại '${name}' đã tồn tại` })
    }
    await pool.query("UPDATE categories SET name = ? WHERE id = ?", [name.trim(), id])
    const [updated] = await pool.query("SELECT id, name, created_at FROM categories WHERE id = ?", [id])
    res.json({
      message: "✅ Đã cập nhật loại sản phẩm thành công",
      category: updated[0],
    })
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật loại sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

// Xóa loại sản phẩm (chỉ admin)
router.delete("/categories/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const [exists] = await pool.query("SELECT * FROM categories WHERE id = ?", [id])
    if (exists.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy loại sản phẩm" })
    }
    const [related] = await pool.query("SELECT COUNT(*) AS c FROM products WHERE category_id = ?", [id])
    if (related[0].c > 0) {
      return res.status(400).json({
        error: "Không thể xóa loại vì vẫn còn sản phẩm thuộc loại này. Hãy xóa hoặc chuyển sản phẩm trước.",
      })
    }
    await pool.query("DELETE FROM categories WHERE id = ?", [id])
    res.json({
      message: "🗑️ Đã xóa loại sản phẩm thành công",
      deleted: exists[0],
    })
  } catch (error) {
    console.error("❌ Lỗi khi xóa loại sản phẩm:", error)
    res.status(500).json({ error: "Lỗi máy chủ" })
  }
})

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

// ===========================================
// --- 🚀 ROUTE GET /:id (ĐÃ NÂNG CẤP AI) ---
// ===========================================
router.get("/:id", async (req, res) => {
  try {
    const range = req.query.range || "30d"
    const productId = req.params.id
    
    // 1. Lấy thông tin sản phẩm
    const productPromise = pool.query(
      `
      SELECT 
        p.*, 
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      `,
      [productId]
    )
    
    // 2. Lấy lịch sử giá cho BIỂU ĐỒ
    let historyQuery = ""
    const params = [productId]
    let interval = 30
    if (range === "1d") {
      historyQuery = `
        SELECT price, updated_at AS date
        FROM price_history
        WHERE product_id = ?
          AND updated_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        ORDER BY updated_at ASC
      `
    } else {
      if (range === "7d") interval = 7
      if (range === "30d") interval = 30
      if (range === "6m") interval = 180
      if (range === "1y") interval = 365
      
      historyQuery = `
        SELECT DATE(updated_at) AS date, MAX(price) AS price
        FROM price_history
        WHERE product_id = ?
          AND updated_at >= DATE_SUB(NOW(), INTERVAL ${interval} DAY)
        GROUP BY DATE(updated_at)
        ORDER BY date ASC
      `
    }
    const historyPromise = pool.query(historyQuery, params)
    
    // 3. Lấy THỐNG KÊ 30 NGÀY
    const statsPromise = pool.query(
      `
      SELECT 
        MAX(price) AS high_30d,
        MIN(price) AS low_30d,
        AVG(price) AS avg_30d
      FROM price_history
      WHERE product_id = ? 
        AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
      [productId]
    );
    
    // Chạy 3 truy vấn song song
    const [ [products], [historyRows], [statsRows] ] = await Promise.all([
      productPromise,
      historyPromise,
      statsPromise
    ]);
    
    if (products.length === 0)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" })
    
    // 4. Xử lý dữ liệu
    const history = historyRows.map(h => ({ ...h, price: Number(h.price) }))
    const historyWithForecast = calculateSMA(history, 7, "price");
    
    const product = {
      ...products[0],
      category: products[0].category_name,
      currentPrice: Number(products[0].currentPrice),
      previousPrice: Number(products[0].previousPrice),
    }

    // 5. Lấy Tin tức
    const productName = products[0].name;
    const keyword = getNewsKeywords(productName);
    let newsRows = [];
    if (keyword) {
      const [fetchedNews] = await pool.query(
        `SELECT id, title, url, source, published_at, snippet
         FROM news_articles
         WHERE relevance_keywords LIKE ?
         ORDER BY published_at DESC
         LIMIT 5`,
        [`%${keyword}%`]
      );
      newsRows = fetchedNews;
    }
    
    // 6. 🚀 TẠO PHÂN TÍCH AI (MỚI)
    // Đảm bảo statsRows[0] không bị undefined nếu không có lịch sử
    const stats = statsRows[0] || { high_30d: 0, low_30d: 0, avg_30d: 0 };
    const analysis = generateAnalysis(product, stats, historyWithForecast, newsRows);

    // 7. Gộp kết quả
    res.json({
      ...product,
      history: historyWithForecast,
      statistics: {
        high_30d: Number(stats.high_30d) || 0,
        low_30d: Number(stats.low_30d) || 0,
        avg_30d: Number(stats.avg_30d) || 0,
      },
      relevantNews: newsRows,
      analysis: analysis // <-- Gửi phân tích về Frontend
    })
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
    const [catRows] = await pool.query("SELECT id FROM categories WHERE name = ?", [category])
    if (catRows.length === 0) {
      return res.status(400).json({ error: `Loại sản phẩm '${category}' không tồn tại` })
    }
    const category_id = catRows[0].id
    const [result] = await pool.query(
      `INSERT INTO products (name, category_id, currentPrice, previousPrice, unit, region, lastUpdate, trend)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'stable')`,
      [name, category_id, currentPrice, currentPrice, unit, region]
    )
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
    if (!name || !category || !currentPrice || !unit || !region) {
      return res.status(400).json({ error: "Thiếu thông tin sản phẩm" })
    }
    const [existing] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id])
    if (existing.length === 0) return res.status(404).json({ error: "Không tìm thấy sản phẩm" })
    const old = existing[0]
    const trend =
      currentPrice > old.currentPrice ? "up" :
        currentPrice < old.currentPrice ? "down" : "stable"
    const [catRows] = await pool.query("SELECT id FROM categories WHERE name = ?", [category])
    if (catRows.length === 0) {
      return res.status(400).json({ error: "Loại sản phẩm không hợp lệ" })
    }
    const category_id = catRows[0].id
    await pool.query(
      `UPDATE products
       SET name=?, category_id=?, currentPrice=?, previousPrice=?, unit=?, region=?, trend=?, lastUpdate=NOW()
       WHERE id=?`,
      [name, category_id, currentPrice, old.currentPrice, unit, region, trend, req.params.id]
    )
    await pool.query("INSERT INTO price_history (product_id, price) VALUES (?, ?)", [
      req.params.id,
      currentPrice,
    ])
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
    await pool.query("DELETE FROM products WHERE id = ?", [productId])
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

// API SO SÁNH (TỐI ƯU)
router.post("/compare", async (req, res) => {
  try {
    const { productIds, range = "30d" } = req.body; 
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Cần có một mảng productIds" });
    }
    
    const [products] = await pool.query(
      `SELECT id, name FROM products WHERE id IN (?)`,
      [productIds]
    );
    const nameMap = new Map(products.map(p => [p.id, p.name]));

    let interval = 30; 
    if (range === "7d") interval = 7;
    if (range === "6m") interval = 180;
    if (range === "1y") interval = 365;
    
    const [historyRows] = await pool.query(
      `
      SELECT 
        product_id, 
        DATE(updated_at) AS date, 
        MAX(price) AS price
      FROM price_history
      WHERE product_id IN (?)
        AND updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY product_id, DATE(updated_at)
      ORDER BY date ASC
      `,
      [productIds, interval]
    );

    const basePriceMap = new Map(); 
    const normalizedDataMap = new Map(); 
    
    for (const id of productIds) {
      const firstEntry = historyRows.find(h => h.product_id === id);
      if (firstEntry) {
        basePriceMap.set(id, Number(firstEntry.price));
      }
    }
    
    historyRows.forEach(row => {
      const date = new Date(row.date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      
      if (!normalizedDataMap.has(date)) {
        normalizedDataMap.set(date, { date });
      }

      const basePrice = basePriceMap.get(row.product_id);
      const productName = nameMap.get(row.product_id);
      
      if (basePrice && productName && basePrice > 0) { // Thêm kiểm tra basePrice > 0
        const currentPrice = Number(row.price);
        const normalizedValue = (currentPrice / basePrice) * 100;
        
        normalizedDataMap.get(date)[productName] = normalizedValue;
      }
    });
    
    const finalChartData = Array.from(normalizedDataMap.values());
    
    res.json(finalChartData);

  } catch (error) {
    console.error("❌ Lỗi khi so sánh sản phẩm:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// API Cập nhật giá nhanh
router.patch("/:id/price", authenticateToken, isAdmin, async (req, res) => {
  try {
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
      newPrice > product.currentPrice ? "up" :
        newPrice < product.currentPrice ? "down" : "stable"
    await pool.query(
      `UPDATE products 
       SET previousPrice=?, currentPrice=?, trend=?, lastUpdate=NOW() 
       WHERE id=?`,
      [product.currentPrice, newPrice, trend, req.params.id]
    )
    await pool.query("INSERT INTO price_history (product_id, price) VALUES (?, ?)", [
      req.params.id,
      newPrice,
    ])
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