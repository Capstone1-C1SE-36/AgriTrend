"use client"

import { useState, useEffect } from "react"
import { Edit, Trash2, X } from "lucide-react"
import AdminNavbar from "../../components/AdminNavbar"
import api from "../../lib/api"

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ name: "", email: "", role: "", status: "" })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users")
      setUsers(response.data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc muốn xóa người dùng này?")) {
      try {
        await api.delete(`/users/${id}`)
        fetchUsers()
      } catch (error) {
        console.error("Failed to delete user:", error)
      }
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    })
  }

  const handleSave = async () => {
    try {
      await api.put(`/users/${editingUser.id}`, formData)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Failed to update user:", error)
      alert("Lỗi khi cập nhật người dùng")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý người dùng</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tham gia</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"}`}>
                        {user.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"}`}>
                        {user.status === "active" ? "Hoạt động" : "Khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🧩 Modal chỉnh sửa */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chỉnh sửa người dùng</h2>
              <button onClick={() => setEditingUser(null)}>
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Tên"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Hoạt động</option>
                <option value="banned">Khóa</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
