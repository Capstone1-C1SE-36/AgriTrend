"use client"

import { useState } from "react"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"
import { User } from "lucide-react"
import api from "../../lib/api"

export default function Profile() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSave = async () => {
    if (!user) {
      setError("Chưa đăng nhập!")
      return
    }

    try {
      setSaving(true)
      setMessage("")
      setError("")

      console.log("🚀 Gửi dữ liệu:", { name, avatar_url: avatarUrl })
      console.log("🔑 Token hiện tại:", localStorage.getItem("token"));

      const res = await api.put("/users/me", {
        name,
        avatar_url: avatarUrl,
      })

      console.log("✅ Cập nhật thành công:", res.data)

      // Cập nhật user trong context
      setUser(res.data)
      setMessage("Cập nhật hồ sơ thành công!")
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err)
      setError(err.response?.data?.error || "Lỗi không xác định khi cập nhật.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Hồ sơ cá nhân</h1>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Avatar hiển thị */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border border-gray-300"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-500" />
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user?.email}</h2>
              <p className="text-sm text-gray-500">
                {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
              </p>
            </div>
          </div>

          {/* Input tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-green-200"
            />
          </div>

          {/* Input avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring focus:ring-green-200"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Thông báo */}
          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Nút lưu */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  )
}
