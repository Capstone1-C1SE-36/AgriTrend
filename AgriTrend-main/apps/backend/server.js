import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import userRoutes from "./routes/users.js";
import alertRoutes from "./routes/alerts.js";
import newsRoutes from "./routes/news.js";
import communityRoutes from "./routes/community.js";
import commodityRoutes from "./routes/commodity.js";
import cron from 'node-cron';
// import updateCommodityPrices from './tasks/updateCommodityPrices.js';
import { Server } from "socket.io";

// Load biến môi trường từ file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003; // Changed port to 5002

const httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now, refine later
    methods: ["GET", "POST"]
  }
});

// Export io for use in other modules
export { io };

// Kiểm tra thử JWT_SECRET có được đọc chưa (chỉ để test)
console.log("JWT_SECRET:", process.env.JWT_SECRET);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/commodity", commodityRoutes);

// Schedule commodity price updates
// cron.schedule('0 0 * * *', () => {
//     console.log('Running scheduled commodity price update...');
//     updateCommodityPrices();
// });

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
// const server = app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Server is running on port ${PORT}`);
// });

httpServer.on('error', (err) => {
  console.error('Server startup error:', err.message);
  // Optionally, you can add more specific error handling here
  // For example, if the port is already in use, you might want to exit the process
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
