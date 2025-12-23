"use client"

import { useState, useEffect } from "react"
import Navbar from "../../components/Navbar"
import Footer from "@/components/Footer"
import { Search, X } from "lucide-react"
import api from "@/lib/api"
import PriceCard from "@/components/PriceCard"
import { motion, AnimatePresence } from "framer-motion"

export default function Alerts() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [filtered, setFiltered] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [targetPrice, setTargetPrice] = useState("")
  const [condition, setCondition] = useState("above")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState([]) // 🧩 Danh sách cảnh báo đã tạo

  // 🧠 Lấy danh sách sản phẩm
  useEffect(() => {
    fetchProducts()
    fetchAlerts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/all")
      setProducts(res.data)
      setFiltered(res.data)
    } catch (err) {
      console.error("❌ Lỗi khi lấy sản phẩm:", err)
    } finally {
      setLoading(false)
    }
  }

  // 🧠 Lấy danh sách cảnh báo
  const fetchAlerts = async () => {
    try {
      const res = await api.get("/alerts")
      setAlerts(res.data)
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách cảnh báo:", err)
    }
  }

  // 🔍 Lọc sản phẩm theo tên hoặc loại
  useEffect(() => {
    const f = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(f)
  }, [search, products])

  // 📩 Tạo cảnh báo mới
  const handleCreateAlert = async () => {
    if (!targetPrice || !selectedProduct) return setMessage("⚠️ Vui lòng nhập đủ thông tin.")

    try {
      await api.post("/alerts", {
        product_id: selectedProduct.id,
        threshold_price: targetPrice,
        condition,
      })

      setMessage("✅ Đã tạo cảnh báo thành công!")
      setSelectedProduct(null)
      setTargetPrice("")
      fetchAlerts() // Cập nhật danh sách sau khi tạo
    } catch (err) {
      console.error(err)
      setMessage("❌ Lỗi khi tạo cảnh báo.")
    }
  }

  // 🧠 Hàm format tiền VNĐ
  const formatPrice = (value) => {
    if (value == null) return "";
    return Number(value)
      .toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ/kg";
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📈 Cảnh báo giá nông sản</h1>

        {/* 🔍 Thanh tìm kiếm */}
        <div className="flex items-center gap-2 mb-6">
          <Search className="text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {message && (
          <div className="mb-4 p-3 rounded bg-blue-100 text-blue-700">{message}</div>
        )}

        {/* 🛒 Danh sách sản phẩm */}
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : filtered.length === 0 ? (
          <p>Không tìm thấy sản phẩm nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedProduct(item);
                  setTargetPrice(item.currentPrice || "");
                }}
              >
                <PriceCard
                  item={item}
                  showAlertButton={true}
                  onCreateAlert={() => {
                    setSelectedProduct(item);
                    setTargetPrice(item.currentPrice || "");
                  }}
                />
              </div>

            ))}
          </div>
        )}

        {/* 📋 Danh sách cảnh báo của bạn */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Danh sách cảnh báo của bạn</h2>

          {alerts.length === 0 ? (
            <p className="text-gray-500">Bạn chưa tạo cảnh báo nào.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`border rounded-lg p-4 flex justify-between items-center ${a.notified
                    ? "bg-green-50 border-green-300"
                    : "bg-yellow-50 border-yellow-300"
                    }`}
                >
                  {/* 🧩 Thông tin sản phẩm và giá */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {a.product_name}
                    </h3>

                    {/* Hiển thị giá giống PriceCard */}
                    <p className="text-gray-700 text-sm">
                      💰 {a.current_price?.toLocaleString()} đ/kg{" "}
                      {a.price_change && (
                        <span
                          className={`ml-2 ${a.price_change >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                        >
                          {a.price_change >= 0 ? "+" : ""}
                          {a.price_change} ({a.percent_change}%)
                        </span>
                      )}
                    </p>

                    <p className="mt-1 text-gray-600">
                      🔔{" "}
                      {a.alert_condition === "above" ? (
                        <span className="text-green-700 font-medium">Tăng vượt</span>
                      ) : (
                        <span className="text-red-700 font-medium">Giảm dưới</span>
                      )}{" "}
                      mức <span className="font-semibold">{formatPrice(a.target_price)}</span>
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Tạo lúc: {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Trạng thái */}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${a.notified
                      ? "bg-green-600 text-white"
                      : "bg-yellow-500 text-white"
                      }`}
                  >
                    {a.notified ? "Đã hoàn thành" : "Chưa hoàn thành"}
                  </span>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      {/* 🪟 Modal tạo cảnh báo */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-semibold mb-4">
                🔔 Tạo cảnh báo cho{" "}
                <span className="text-green-700">{selectedProduct.name}</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ngưỡng giá (VNĐ)</label>
                  <input
                    type="number"
                    className="border rounded-lg p-2 w-full"
                    placeholder="Nhập giá..."
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Điều kiện</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="border rounded-lg p-2 w-full"
                  >
                    <option value="above">Khi giá TĂNG VƯỢT MỨC này</option>
                    <option value="below">Khi giá GIẢM DƯỚI MỨC này</option>
                  </select>
                </div>

                <button
                  onClick={handleCreateAlert}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Tạo cảnh báo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  )
}
