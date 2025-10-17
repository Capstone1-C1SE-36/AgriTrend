"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, TrendingUp, TrendingDown, Heart } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Navbar from "../../components/Navbar"
import api from "../../lib/api"

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`)
      setProduct(response.data)
    } catch (error) {
      console.error("Failed to fetch product:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Không tìm thấy sản phẩm</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600">{product.category}</p>
            </div>
            <button className="p-3 rounded-full hover:bg-gray-100 transition-colors">
              <Heart className="w-6 h-6 text-gray-400 hover:text-red-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Giá hiện tại</p>
              <p className="text-3xl font-bold text-gray-900">{product.currentPrice.toLocaleString("vi-VN")} đ</p>
              <p className="text-sm text-gray-500">/{product.unit}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Thay đổi</p>
              <div className="flex items-center gap-2">
                {product.change > 0 ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">+{product.change}%</span>
                  </>
                ) : product.change < 0 ? (
                  <>
                    <TrendingDown className="w-6 h-6 text-red-600" />
                    <span className="text-2xl font-bold text-red-600">{product.change}%</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-600">0%</span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Khu vực</p>
              <p className="text-xl font-semibold text-gray-900">{product.region}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Biểu đồ giá 30 ngày</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={product.history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString("vi-VN")} />
              <YAxis />
              <Tooltip
                formatter={(value) => `${value.toLocaleString("vi-VN")} đ`}
                labelFormatter={(date) => new Date(date).toLocaleDateString("vi-VN")}
              />
              <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
