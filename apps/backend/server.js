import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

import authRoutes from "./routes/auth.js";
import productRoutes, { ioRef } from "./routes/products.js"; // ⚡ import ioRef
import userRoutes from "./routes/users.js";
import alertRoutes from "./routes/alerts.js";
import newsRoutes from "./routes/news.js";
import communityRoutes from "./routes/community.js";
import favoritesRouter from "./routes/favorites.js";
import testRoutes from "./routes/test.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // hoặc http://localhost:3000 nếu muốn giới hạn
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gán io cho router product để có thể emit event từ bên trong
ioRef.io = io;

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/favorites", favoritesRouter);
app.use("/api/test", testRoutes);

// Test DB
// app.get("/api/test-db", async (req, res) => {
//   try {
//     const [rows] = await pool.query("SELECT * FROM products");
//     res.json({ success: true, data: rows });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Database error" });
//   }
// });

// Khi có client kết nối
io.on("connection", async (socket) => {
  console.log("✅ Client connected:", socket.id);

  try {
    // 🔹 Lấy danh sách sản phẩm từ MySQL
    const [rows] = await pool.query("SELECT * FROM products");

    // 🔹 Gửi dữ liệu sản phẩm về client
    socket.emit("initData", rows);
  } catch (err) {
    console.error("❌ Lỗi khi gửi dữ liệu khởi tạo:", err);
  }

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});


// Mô phỏng cập nhật giá ngẫu nhiên (toàn hệ thống)
// setInterval(async () => {
//   try {
//     // Lấy ngẫu nhiên 1 sản phẩm từ DB
//     const [rows] = await pool.query("SELECT * FROM products ORDER BY RAND() LIMIT 1");
//     if (rows.length === 0) return;

//     const random = rows[0];
//     const change = (Math.random() - 0.5) * 0.1;
//     const newPrice = Math.max(100, Math.round(random.currentPrice * (1 + change)));

//     await pool.query(
//       "UPDATE products SET previousPrice = ?, currentPrice = ?, lastUpdate = NOW() WHERE id = ?",
//       [random.currentPrice, newPrice, random.id]
//     );

//     await pool.query(
//       "INSERT INTO price_history (product_id, price, updated_at) VALUES (?, ?, NOW())",
//       [random.id, newPrice]
//     );

//     io.emit("priceUpdate", {
//       id: random.id,
//       newPrice,
//       previousPrice: random.currentPrice,
//     });

//     console.log(`📈 Auto update: ${random.name} → ${newPrice}`);
//   } catch (err) {
//     console.error("❌ Lỗi khi auto update giá:", err);
//   }
// }, 10000);



// Start
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ MySQL connected!");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  }
};
startServer();
