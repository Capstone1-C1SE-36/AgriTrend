import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5003/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)



export const getCommodityPrices = async (symbol) => {
  try {
    const response = await api.get(`/commodity/prices`, {
      params: { symbol, interval: '1day' } // interval is required by backend but fixed to '1day'
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching commodity prices:", error);
    throw error;
  }
};

export default api
