"use client"

import { useState, useEffect } from "react"
import { Package, Users, TrendingUp, DollarSign } from "lucide-react"
import AdminNavbar from "../../components/AdminNavbar"
import api from "../../lib/api"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    avgPriceChange: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([api.get("/products"), api.get("/users")])

      const products = productsRes.data
      const avgChange = products.reduce((sum, p) => sum + p.change, 0) / products.length

      setStats({
        totalProducts: products.length,
        totalUsers: usersRes.data.length,
        avgPriceChange: avgChange.toFixed(2),
        totalRevenue: 0,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const statCards = [
    {
      title: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      title: "Người dùng",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Thay đổi TB",
      value: `${stats.avgPriceChange}%`,
      icon: TrendingUp,
      color: "bg-yellow-500",
    },
    {
      title: "Doanh thu",
      value: "0đ",
      icon: DollarSign,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <p className="text-gray-600">Chưa có hoạt động nào</p>
        </div>
      </div>
    </div>
  )
}
