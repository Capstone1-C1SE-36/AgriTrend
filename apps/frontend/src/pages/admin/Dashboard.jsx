import { useEffect, useState } from "react"
import AdminNavbar from "@/components/AdminNavbar"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, FileText, ArrowUpRight, Clock } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    news: 0
  })
  const [recentProducts, setRecentProducts] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy thống kê tổng
        const [usersRes, productsRes] = await Promise.all([
          api.get("/users"),
          api.get("/products/all")
        ])

        const users = usersRes.data || []
        const products = productsRes.data || []

        setStats({
          users: users.length,
          products: products.length,
          news: 12 // Giả định hoặc gọi API tin tức nếu có
        })

        // 2. Lấy 5 sản phẩm mới cập nhật nhất
        // Sắp xếp theo lastUpdate giảm dần
        const sortedProducts = [...products].sort((a, b) => 
            new Date(b.lastUpdate) - new Date(a.lastUpdate)
        ).slice(0, 5)
        setRecentProducts(sortedProducts)

        // 3. Lấy 5 user mới nhất
        const sortedUsers = [...users].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        ).slice(0, 5)
        setRecentUsers(sortedUsers)

      } catch (error) {
        console.error("Lỗi tải dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-[#fcfaf8]"> {/* Nền Kem nhẹ nhàng */}
      <AdminNavbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan Hệ thống</h1>
          <p className="text-gray-500">Chào mừng trở lại, quản trị viên.</p>
        </div>

        {/* 1. KHOỐI THỐNG KÊ ĐƠN GIẢN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Người dùng" 
            value={stats.users} 
            icon={Users} 
            color="text-blue-600" 
            bg="bg-blue-50" 
          />
          <StatCard 
            title="Sản phẩm Nông sản" 
            value={stats.products} 
            icon={Package} 
            color="text-green-600" 
            bg="bg-green-50" 
          />
          <StatCard 
            title="Tin tức / Bài viết" 
            value={stats.news} 
            icon={FileText} 
            color="text-orange-600" 
            bg="bg-orange-50" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2. BẢNG SẢN PHẨM MỚI CẬP NHẬT */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Cập nhật giá mới nhất</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                Xem tất cả
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Giá mới</TableHead>
                    <TableHead className="text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div>{p.name}</div>
                        <div className="text-xs text-gray-400">{p.region}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-gray-900">
                            {Number(p.currentPrice).toLocaleString()} đ
                        </span>
                        {p.trend === 'up' && <span className="text-green-500 ml-1 text-xs">↑</span>}
                        {p.trend === 'down' && <span className="text-red-500 ml-1 text-xs">↓</span>}
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {new Date(p.lastUpdate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentProducts.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                            Chưa có dữ liệu
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 3. BẢNG USER MỚI */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Thành viên mới</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                Quản lý User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{u.name || "Không tên"}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="bg-white text-gray-500 border-gray-200 font-normal">
                        Mới đăng ký
                    </Badge>
                  </div>
                ))}
                {recentUsers.length === 0 && (
                    <div className="text-center text-gray-500 py-8">Chưa có thành viên nào</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}