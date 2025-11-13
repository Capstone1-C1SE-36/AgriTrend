import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/auth.js"; // Tùy chọn: nếu bạn muốn chatbot chỉ cho user đã đăng nhập

const router = express.Router();

// Định nghĩa các từ khóa mà chúng ta hiểu
const PRODUCT_KEYWORDS = ["cà phê", "tiêu", "hồ tiêu", "lúa", "gạo", "cao su", "ca cao"];
const REGION_KEYWORDS = [
  "đắk lắk", "lâm đồng", "gia lai", "đắk nông", "toàn quốc",
  "bà rịa", "bình phước", "sông cửu long", "tiền giang"
];

/**
 * Hàm phân tích câu nói của người dùng
 * @param {string} message - Câu nói của người dùng
 * @returns {object} - Gồm { intent, product, region }
 */
function parseMessage(message) {
  const lowerMsg = message.toLowerCase();
  
  // 1. Ý định: Hỏi giá
  if (lowerMsg.includes("giá") || lowerMsg.includes("bao nhiêu")) {
    let product = null;
    let region = null;

    // Tìm sản phẩm
    for (const keyword of PRODUCT_KEYWORDS) {
      if (lowerMsg.includes(keyword)) {
        product = keyword.replace("hồ tiêu", "tiêu"); // Chuẩn hóa
        break;
      }
    }
    
    // Tìm vùng
    for (const keyword of REGION_KEYWORDS) {
      if (lowerMsg.includes(keyword)) {
        region = keyword.replace("đắk lắk", "buôn ma thuột"); // Chuẩn hóa nếu cần
        break;
      }
    }

    if (product) {
      return { intent: "GET_PRICE", product, region };
    }
  }

  // 2. Ý định: Hỏi trợ giúp (FAQ)
  if (lowerMsg.includes("cảnh báo") || lowerMsg.includes("hướng dẫn")) {
    return { intent: "GET_HELP_ALERT" };
  }

  // Mặc định: Không hiểu
  return { intent: "UNKNOWN" };
}


// --- API Endpoint chính của Chatbot ---
router.post("/query", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Không có tin nhắn" });
  }

  const analysis = parseMessage(message);

  try {
    switch (analysis.intent) {
      // --- Trường hợp: Hỏi giá ---
      case "GET_PRICE": {
        let sql = `SELECT name, region, currentPrice, trend FROM products WHERE name LIKE ?`;
        const params = [`%${analysis.product}%`];

        if (analysis.region) {
          sql += ` AND region LIKE ?`;
          params.push(`%${analysis.region}%`);
        }
        sql += ` LIMIT 1`; // Chỉ lấy 1 kết quả khớp nhất

        const [rows] = await pool.query(sql, params);

        if (rows.length > 0) {
          // Trả về dữ liệu có cấu trúc
          res.json({
            type: "PRICE_INFO",
            data: rows[0]
          });
        } else {
          // Không tìm thấy
          res.json({
            type: "INFO",
            text: `Xin lỗi, tôi không tìm thấy giá ${analysis.product} ${analysis.region ? "tại " + analysis.region : ""}.`
          });
        }
        break;
      }
      
      // --- Trường hợp: Hỏi trợ giúp ---
      case "GET_HELP_ALERT":
        res.json({
          type: "INFO",
          text: "Để đặt cảnh báo giá, bạn vào trang chi tiết của sản phẩm và nhấn nút '🔔 Tạo cảnh báo giá' nhé!"
        });
        break;

      // --- Trường hợp: Không hiểu ---
      default: // UNKNOWN
        res.json({
          type: "INFO",
          text: "Tôi chưa hiểu ý bạn. Bạn có thể hỏi tôi về giá (ví dụ: 'giá cà phê') hoặc cách đặt cảnh báo."
        });
    }
  } catch (error) {
    console.error("❌ Lỗi Chatbot API:", error);
    res.status(500).json({ type: "INFO", text: "Bot đang gặp lỗi, vui lòng thử lại sau." });
  }
});

export default router;