"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
// import ThemeToggle from "@/components/ThemeToggle.tsx";
import { Send, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const user = await login(email, password)
      if (user.role === "admin") {
        navigate("/admin")
      } else {
        navigate("/")
      }
    } catch (err) {
      setError(err.response?.data?.error || "Đăng nhập thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* <h1 className="text-3xl font-bold text-green-600">Tailwind works!</h1>
      <h1 className="text-3xl font-bold text-green-600">Tailwind works!</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Test Button</button>
      <Button variant="ghost" size="icon">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex justify-end">
        <Button>
          <Send className="h-4 w-4 mr-2" />
          test
        </Button>
      </div> */}
      {/* <ThemeToggle /> */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-green-700">AgriPrice</h1>
              <p className="text-gray-600 mt-2">Đăng nhập vào hệ thống</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
                Đăng ký ngay
              </Link>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
              <p className="font-medium mb-1">Tài khoản demo:</p>
              <p>Admin: admin@agriprice.vn</p>
              <p>User: user@example.com</p>
              <p>User: bất kỳ email nào khác</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
