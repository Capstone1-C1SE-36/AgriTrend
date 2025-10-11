"use client"

import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Hồ sơ cá nhân</h1>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <p className="text-gray-900">{user?.name || "Chưa cập nhật"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <p className="text-gray-900">{user?.role === "admin" ? "Quản trị viên" : "Người dùng"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
