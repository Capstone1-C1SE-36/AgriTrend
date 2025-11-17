"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Package, Layers } from "lucide-react"
import { io } from "socket.io-client"
import AdminNavbar from "../../components/AdminNavbar"
import api from "../../lib/api"
// import { socket } from "@/socket"

export default function AdminProducts() {
  const [mode, setMode] = useState("products") // 🧩 "products" | "categories"
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
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
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [editingCategory, setEditingCategory] = useState(null)

  // =========================
  // Fetch dữ liệu
  // =========================
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/all")
      const data = res.data.map((p) => ({
        ...p,
        currentPrice: Number(p.currentPrice),
        previousPrice: Number(p.previousPrice || p.currentPrice),
        trend: "neutral",
      }))
      setProducts(data)
    } catch (e) {
      console.error("❌ Lỗi lấy sản phẩm:", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get("/products/categorie")
      setCategories(res.data)
    } catch (e) {
      console.error("❌ Lỗi lấy loại:", e)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000")
    socket.on("priceUpdate", (data) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === data.id
            ? {
              ...p,
              previousPrice: p.currentPrice,
              currentPrice: Number(data.newPrice),
              trend:
                Number(data.newPrice) > p.currentPrice
                  ? "up"
                  : Number(data.newPrice) < p.currentPrice
                    ? "down"
                    : "neutral",
            }
            : p
        )
      )
      setTimeout(() => {
        setProducts((prev) =>
          prev.map((p) => ({ ...p, trend: "neutral" }))
        )
      }, 2000)
    })
    return () => socket.disconnect()
  }, [])

  // =========================
  // CRUD Sản phẩm
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        currentPrice: Number(formData.currentPrice),
        previousPrice: Number(editingProduct?.currentPrice || formData.currentPrice),
      }
      if (editingProduct) await api.put(`/products/${editingProduct.id}`, payload)
      else await api.post("/products", payload)
      fetchProducts()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error("❌ Lỗi lưu sản phẩm:", error)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (confirm("Xoá sản phẩm này?")) {
      await api.delete(`/products/${id}`)
      fetchProducts()
    }
  }

  const handleEditProduct = (p) => {
    setEditingProduct(p)
    setFormData({
      name: p.name,
      category: p.category,
      currentPrice: p.currentPrice,
      unit: p.unit,
      region: p.region,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({ name: "", category: "", currentPrice: "", unit: "kg", region: "" })
  }

  // =========================
  // CRUD Loại sản phẩm
  // =========================
  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    try {
      if (editingCategory) {
        await api.put(`/products/categories/${editingCategory.id}`, {
          name: newCategory.trim(),
        })
      } else {
        await api.post("/products/categories", { name: newCategory.trim() })
      }
      fetchCategories()
      setNewCategory("")
      setEditingCategory(null)
      setShowCategoryModal(false)
    } catch (error) {
      alert(error.response?.data?.error || "Lỗi khi lưu loại sản phẩm")
    }
  }

  const handleEditCategory = (cat) => {
    setEditingCategory(cat)
    setNewCategory(cat.name)
    setShowCategoryModal(true)
  }

  const handleDeleteCategory = async (id) => {
    if (confirm("Xoá loại này? (chỉ khi không còn sản phẩm thuộc loại này)")) {
      try {
        await api.delete(`/products/categories/${id}`)
        fetchCategories()
      } catch (error) {
        alert(error.response?.data?.error || "Không thể xoá loại này")
      }
    }
  }

  // =========================
  // UI Render
  // =========================
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Thanh tiêu đề */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === "products" ? "Quản lý sản phẩm" : "Quản lý loại sản phẩm"}
          </h1>

          <div className="flex gap-3">
            <button
              onClick={() => setMode("categories")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${mode === "categories"
                ? "bg-green-600 text-white"
                : "bg-white border-gray-300 hover:bg-gray-100"
                }`}
            >
              <Layers className="w-5 h-5" /> Loại
            </button>
            <button
              onClick={() => setMode("products")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${mode === "products"
                ? "bg-green-600 text-white"
                : "bg-white border-gray-300 hover:bg-gray-100"
                }`}
            >
              <Package className="w-5 h-5" /> Sản phẩm
            </button>
          </div>
        </div>

        {/* =============== */}
        {/* BẢNG HIỂN THỊ */}
        {/* =============== */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : mode === "products" ? (
          // ======================= BẢNG SẢN PHẨM =======================
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex justify-end p-4">
              <button
                onClick={() => {
                  resetForm()
                  setShowModal(true)
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-5 h-5" /> Thêm sản phẩm
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khu vực</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="px-6 py-3">{p.category}</td>
                    <td
                      className={`px-6 py-3 font-semibold transition-all duration-500
                          ${p.trend === "up"
                          ? "text-green-600 border border-green-400 rounded-lg animate-pulse"
                          : p.trend === "down"
                            ? "text-red-600 border border-red-400 rounded-lg animate-pulse"
                            : "text-gray-900 border-transparent"
                        }`}
                    >
                      {p.currentPrice.toLocaleString("vi-VN")} đ/{p.unit}
                    </td>

                    <td className="px-6 py-3">{p.region}</td>
                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                      <button onClick={() => handleEditProduct(p)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // ======================= BẢNG LOẠI =======================
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex justify-end p-4">
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setNewCategory("")
                  setShowCategoryModal(true)
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-5 h-5" /> Thêm loại
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên loại</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-3">{c.name}</td>
                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                      <button onClick={() => handleEditCategory(c)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteCategory(c.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL thêm/sửa loại */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? "Sửa loại sản phẩm" : "Thêm loại sản phẩm"}
            </h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Tên loại..."
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCategoryModal(false); setNewCategory("") }}
                  className="flex-1 border border-gray-300 rounded-lg py-2 hover:bg-gray-50"
                >Hủy</button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2"
                >{editingCategory ? "Cập nhật" : "Thêm"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL thêm/sửa sản phẩm */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tên sản phẩm"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Chọn loại --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                placeholder="Giá (vd: 25000)"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Đơn vị (vd: kg, tấn)"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Khu vực (vd: Lâm Đồng)"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 hover:bg-gray-50"
                >Hủy</button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2"
                >{editingProduct ? "Cập nhật" : "Thêm"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
