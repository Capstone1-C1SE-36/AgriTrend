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

import * as cron from "node-cron";
import nodemailer from "nodemailer"

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { syncProducts } from "./cron/syncProducts.js";

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

// ✅ Gán io cho router product để có thể emit event từ bên trong
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

// ⚡ Khi có client kết nối
io.on("connection", async (socket) => {
  console.log("✅ Client connected:", socket.id);

  try {
    // 🔹 Lấy danh sách sản phẩm từ MySQL
    const [rows] = await pool.query(`
      SELECT 
        p.*, 
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `)

    // 🔹 Gửi dữ liệu sản phẩm về client
    socket.emit("initData", rows);
  } catch (err) {
    console.error("❌ Lỗi khi gửi dữ liệu khởi tạo:", err);
  }

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});


// ⚡ Mô phỏng cập nhật giá ngẫu nhiên (toàn hệ thống)
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

// 🧠 Hàm gửi mail
async function sendEmail(to, productName, currentPrice, alert) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,      // ví dụ: yourmail@gmail.com
      pass: process.env.SMTP_PASSWORD    // app password (16 ký tự)
    }
  })

  await transporter.sendMail({
    from: `"AgriTrend" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `🌾 Giá ${productName} đã ${alert.alert_condition === 'above' ? 'vượt lên' : 'giảm xuống'} ${alert.target_price}`,
    html: `
        <p>Giá <b>${productName}</b> hiện tại là <b>${currentPrice} ₫</b>.</p>
        <p>Đã ${alert.alert_condition === 'above' ? 'cao hơn' : 'thấp hơn'} mức bạn đặt là <b>${alert.target_price} ₫</b>.</p>
      `

  })
}

// 🔁 Cron job kiểm tra mỗi 5 phút
cron.schedule("*/5 * * * *", async () => {
  console.log("⏱️ Kiểm tra cảnh báo giá...")
  const [alerts] = await pool.query("SELECT * FROM price_alerts WHERE notified = FALSE")

  for (const alert of alerts) {
    const [product] = await pool.query("SELECT name, currentPrice FROM products WHERE id = ?", [alert.product_id])
    if (!product[0]) continue
    const currentPrice = product[0].currentPrice

    if (
      (alert.alert_condition === "above" && currentPrice > alert.target_price) ||
      (alert.alert_condition === "below" && currentPrice < alert.target_price)
    ) {
      await sendEmail(alert.email, product[0].name, currentPrice, alert)
      await pool.query("UPDATE price_alerts SET notified = TRUE WHERE id = ?", [alert.id])
      console.log(`📩 Gửi mail đến ${alert.email} cho sản phẩm ${product[0].name}`)
    }
  }
})

// 🧭 Xác định đường dẫn file cào & file đồng bộ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scrapePath = path.join(__dirname, "./scraped/scrape.js");
const syncPath = path.join(__dirname, "./cron/syncProducts.js");
const SCRAPED_FILE = path.join(process.cwd(), "scraped/all_regions.json");

console.log("📂 Đường dẫn cào:", scrapePath);

// ⚙️ Hàm cào & đồng bộ
async function scrapeAndSync() {
  console.log("🚀 Bắt đầu tiến trình cào dữ liệu...");

  exec(`node "${scrapePath}"`, (err, stdout, stderr) => {
    console.log("📜 STDOUT:", stdout);
    console.log("📜 STDERR:", stderr);

    if (err) {
      console.error("❌ Lỗi khi cào:", err);
      return;
    }

    if (!fs.existsSync(SCRAPED_FILE)) {
      console.error("❌ Không tìm thấy file all_regions.json sau khi cào!");
      return;
    }

    const scrapedFile = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
    scrapedFile.scrapedAt = new Date().toISOString();
    fs.writeFileSync(SCRAPED_FILE, JSON.stringify(scrapedFile, null, 2));
    console.log("💾 Đã cập nhật scrapedAt vào file dữ liệu.");

    console.log("✅ Cào xong — bắt đầu đồng bộ DB...");
    exec(`node "${syncPath}"`, (err2, stdout2, stderr2) => {
      if (err2) {
        console.error("❌ Lỗi đồng bộ:", err2);
        return;
      }
      if (stderr2) console.warn("⚠️ stderr:", stderr2);
      console.log("🎯 Đồng bộ DB xong!", stdout2);
      //if (ioRef.io) ioRef.io.emit("dataSynced");
    });
  });
}

// 👉 Lấy ngày mới nhất trong dữ liệu
function getLatestDateFromData(regions) {
  if (!regions || !regions.length) return null;
  const allDates = [];
  for (const region of regions) {
    for (const item of region.data || []) {
      if (item.Ngày) {
        const [d, m, y] = item.Ngày.split("/").map(Number);
        allDates.push(new Date(y, m - 1, d));
      }
    }
  }
  allDates.sort((a, b) => b - a);
  const latest = allDates[0];
  return latest
    ? `${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, "0")}-${String(latest.getDate()).padStart(2, "0")}`
    : null;
}

// 🔁 Cron chạy mỗi sáng lúc 6h
cron.schedule("0 6 * * *", async () => {
  console.log("🌅 Kiểm tra xem có cần cào dữ liệu mới không...");

  try {
    let lastScrapedDate = null;
    if (fs.existsSync(SCRAPED_FILE)) {
      const file = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
      lastScrapedDate = file.lastScrapedDate;
    }

    const today = new Date().toISOString().split("T")[0];
    if (lastScrapedDate === today) {
      console.log("✅ Dữ liệu hôm nay đã được cào, bỏ qua.");
      return;
    }

    console.log("🆕 Chưa có dữ liệu hôm nay — bắt đầu cào mới...");
    scrapeAndSync();
  } catch (err) {
    console.error("⚠️ Lỗi trong cron auto scrape:", err);
  }
});

// 🧠 Hàm kiểm tra xem có cần cào hôm nay không
async function checkAndScrapeIfNeeded() {
  console.log("🌅 Kiểm tra xem có cần cào dữ liệu mới không...");

  try {
    const TEMP_FILE = path.join(__dirname, "./scraped/temp_check.json");
    const SCRAPED_FILE = path.join(process.cwd(), "scraped/all_regions.json");

    // 📂 Đọc dữ liệu cũ (nếu có)
    let oldData = { regions: [] };
    if (fs.existsSync(SCRAPED_FILE)) {
      oldData = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
    }
    const coffeeDate = oldData.coffeeDate || null;
    const pepperDate = oldData.pepperDate || null;
    console.log(`📅 Ngày cà phê: ${coffeeDate || "chưa có"}, ngày tiêu: ${pepperDate || "chưa có"}`);


    // 👉 Cào tạm để kiểm tra xem web có dữ liệu mới chưa
    exec(`node "${scrapePath}" --temp`, async (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Lỗi khi cào tạm:", err);
        return;
      }

      if (!fs.existsSync(TEMP_FILE)) {
        console.error("❌ Không tìm thấy dữ liệu mới sau khi cào tạm.");
        return;
      }

      const newFile = JSON.parse(fs.readFileSync(TEMP_FILE, "utf-8"));
      const newCoffeeDate = newFile.coffeeDate || null;
      const newPepperDate = newFile.pepperDate || null;
      console.log(`🕐 Ngày cà phê mới: ${newCoffeeDate || "?"}, ngày tiêu mới: ${newPepperDate || "?"}`);


      // Nếu không có ngày mới => bỏ qua
      if (
        newCoffeeDate === coffeeDate &&
        newPepperDate === pepperDate
      ) {
        console.log("✅ Trang nguồn chưa có dữ liệu mới — bỏ qua đồng bộ hôm nay.");
        fs.unlinkSync(TEMP_FILE);
        return;
      }


      // 🧩 Có dữ liệu mới → GỘP thêm dữ liệu mới vào file cũ (không trùng ngày)
      console.log("🆕 Có dữ liệu mới — đang gộp vào dữ liệu cũ...");

      const mergeRegionData = (oldRegion, newRegion) => {
        const oldDates = new Set(oldRegion.data.map(d => d["Ngày"]));
        const mergedData = [
          ...newRegion.data.filter(d => !oldDates.has(d["Ngày"])),
          ...oldRegion.data
        ];

        mergedData.sort((a, b) => {
          const [da, ma, ya] = a["Ngày"].split("/").map(Number);
          const [db, mb, yb] = b["Ngày"].split("/").map(Number);
          return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
        });

        return { ...oldRegion, data: mergedData };
      };

      for (const newRegion of newFile.regions) {
        const oldRegion = oldData.regions.find(r => r.region === newRegion.region);
        if (oldRegion) {
          const merged = mergeRegionData(oldRegion, newRegion);
          Object.assign(oldRegion, merged);
        } else {
          oldData.regions.push(newRegion);
        }
      }

      if (newCoffeeDate !== coffeeDate) console.log("☕ Có dữ liệu cà phê mới!");
      if (newPepperDate !== pepperDate) console.log("🌶️ Có dữ liệu hồ tiêu mới!");

      oldData.scrapedAt = new Date().toISOString();
      oldData.regionCount = oldData.regions.length;
      oldData.coffeeDate = newCoffeeDate || oldData.coffeeDate;
      oldData.pepperDate = newPepperDate || oldData.pepperDate;


      fs.writeFileSync(SCRAPED_FILE, JSON.stringify(oldData, null, 2), "utf-8");
      fs.unlinkSync(TEMP_FILE);

      console.log("💾 Đã gộp dữ liệu mới vào file cũ thành công!");
      console.log("✅ Bắt đầu tiến trình đồng bộ DB...");
      await syncProducts(io); // ⚡ Gọi trực tiếp và truyền io
    });

  } catch (err) {
    console.error("⚠️ Lỗi trong checkAndScrapeIfNeeded:", err);
  }
}


// 🚀 Gọi khi server khởi động (chạy 1 lần)
(async () => {
  await checkAndScrapeIfNeeded();
})();

// 🔁 Cào thử mỗi 5 phút cho đến khi có dữ liệu mới
cron.schedule("*/5 * * * *", async () => {
  await checkAndScrapeIfNeeded();
});



// ✅ Start
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
