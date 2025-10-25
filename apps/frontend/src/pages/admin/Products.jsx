"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { io } from "socket.io-client"
import AdminNavbar from "../../components/AdminNavbar"
import api from "../../lib/api"

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    currentPrice: "",
    unit: "kg",
    region: "",
  })

  // Fetch danh sách sản phẩm (convert số luôn)
  const fetchProducts = async () => {
    try {
      const response = await api.get("/products")
      const data = response.data.map((p) => ({
        ...p,
        currentPrice: Number(p.currentPrice),
        previousPrice: Number(p.previousPrice || p.currentPrice),
        trend: "neutral",
      }))
      setProducts(data)
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

    const socket = io("http://localhost:5000")

    // Giá tự động thay đổi
    socket.on("priceUpdate", (data) => {
      const newPrice = Number(data.newPrice)
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === data.id) {
            const trend =
              newPrice > p.currentPrice
                ? "up"
                : newPrice < p.currentPrice
                  ? "down"
                  : "neutral"
            return {
              ...p,
              previousPrice: p.currentPrice,
              currentPrice: newPrice,
              trend,
            }
          }
          return p
        })
      )

      setTimeout(() => {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === data.id ? { ...p, trend: "neutral" } : p
          )
        )
      }, 2000)
    })

    // Sửa sản phẩm
    socket.on("productUpdated", (data) => {
      const currentPriceNum = Number(data.currentPrice)
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === data.id) {
            const prevPriceNum = Number(p.currentPrice)
            const trend =
              currentPriceNum > prevPriceNum
                ? "up"
                : currentPriceNum < prevPriceNum
                  ? "down"
                  : "neutral"

            return {
              ...p,
              ...data,
              currentPrice: currentPriceNum,
              previousPrice: prevPriceNum,
              trend,
            }
          }
          return p
        })
      )

      // Tự reset trend sau 2s như priceUpdate
      setTimeout(() => {
        setProducts((prev) =>
          prev.map((p) => (p.id === data.id ? { ...p, trend: "neutral" } : p))
        )
      }, 2000)
    })


    // Thêm mới
    socket.on("productAdded", (newProduct) => {
      const p = {
        ...newProduct,
        currentPrice: Number(newProduct.currentPrice),
        previousPrice: Number(newProduct.previousPrice || newProduct.currentPrice),
        trend: "neutral",
      }
      setProducts((prev) => [...prev, p])
    })

    // Xoá
    socket.on("productDeleted", (deleted) => {
      setProducts((prev) => prev.filter((p) => p.id !== deleted.id))
    })

    return () => {
      socket.off("priceUpdate")
      socket.off("productUpdated")
      socket.off("productAdded")
      socket.off("productDeleted")
      socket.disconnect()
    }
  }, [])

  // Tạo hoặc cập nhật sản phẩm
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        currentPrice: Number(formData.currentPrice),
        previousPrice: Number(editingProduct?.currentPrice || formData.currentPrice),
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload)
      } else {
        await api.post("/products", payload)
      }
      fetchProducts()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error("Failed to save product:", error)
    }
  }

  // Xóa sản phẩm
  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        await api.delete(`/products/${id}`)
        fetchProducts()
      } catch (error) {
        console.error("Failed to delete product:", error)
      }
    }
  }

  // Cập nhật giá ngẫu nhiên
  const handlePriceUpdate = async (id, currentPriceRaw) => {
    const currentPrice = Number(currentPriceRaw)
    if (isNaN(currentPrice)) return
    const randomChange = (Math.random() - 0.5) * 2000
    const newPrice = Math.max(1000, Math.round(currentPrice + randomChange))

    try {
      await api.patch(`/products/${id}/price`, { newPrice })
    } catch (error) {
      console.error("Failed to update price:", error)
    }
  }

  // Chỉnh sửa sản phẩm
  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      currentPrice: product.currentPrice,
      unit: product.unit,
      region: product.region,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      category: "",
      currentPrice: "",
      unit: "kg",
      region: "",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" /> Thêm sản phẩm
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khu vực</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                    <td className={`px-6 py-4 text-sm font-semibold transition-colors duration-300 ${product.trend === "up" ? "text-green-600" : product.trend === "down" ? "text-red-600" : "text-gray-900"}`}>
                      {product.currentPrice.toLocaleString("vi-VN")} đ/{product.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.region}</td>
                    <td className="px-6 py-4 text-sm text-right flex justify-end gap-3">
                      <button onClick={() => handlePriceUpdate(product.id, product.currentPrice)} className="text-green-600 hover:text-green-800">💲</button>
                      <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL thêm/sửa sản phẩm */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {["name", "category", "currentPrice", "unit", "region"].map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key === "currentPrice" ? "Giá (VNĐ)" : key === "unit" ? "Đơn vị" : key === "region" ? "Khu vực" : "Tên sản phẩm"}
                    </label>
                    <input
                      type={key === "currentPrice" ? "number" : "text"}
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                ))}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">{editingProduct ? "Cập nhật" : "Thêm"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
