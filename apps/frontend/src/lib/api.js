import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🧠 Thêm token vào mỗi request
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
    const message = error.response?.data?.error;

    // Nếu token hết hạn hoặc không hợp lệ
    if (
      status === 401 ||
      status === 403 ||
      message === "Invalid or expired token"
    ) {
      console.warn("⚠️ Token hết hạn hoặc không hợp lệ — đang đăng xuất...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Tránh vòng lặp redirect
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
