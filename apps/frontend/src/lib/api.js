import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🧠 Tự động gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🧩 Tự động logout khi token hết hạn hoặc không hợp lệ
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || "";

    console.error("❌ API response error:", status, message);

    // 🔹 Kiểm tra token hết hạn / không hợp lệ
    const isTokenError =
      status === 401 ||
      status === 403 ||
      message.toLowerCase().includes("token") ||
      message.toLowerCase().includes("jwt");

    if (isTokenError) {
      console.warn("⚠️ Token hết hạn hoặc không hợp lệ — tiến hành đăng xuất...");

      // Xóa toàn bộ dữ liệu đăng nhập (dù là Clerk hay local)
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("loginType");

      // Chuyển hướng về trang đăng nhập (tránh reload vô hạn)
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
