import { useEffect, useState } from "react"
import AdminNavbar from "@/components/AdminNavbar"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, User, Mail, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users")
      setUsers(res.data)
    } catch (error) {
      console.error("Lỗi tải user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm("Hành động này không thể hoàn tác. Bạn có chắc muốn xóa người dùng này?")) return
    try {
      await api.delete(`/users/${id}`)
      setUsers(users.filter(u => u.id !== id))
      toast({ title: "Đã xóa", description: "Người dùng đã bị xóa khỏi hệ thống" })
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa người dùng", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8]">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thành viên</h1>
          <p className="text-gray-500 text-sm">Quản lý tài khoản người dùng và phân quyền</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-gray-900">{user.name || "Chưa đặt tên"}</div>
                            <div className="text-xs text-gray-400 font-normal md:hidden">{user.email}</div>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 gap-1">
                            <Shield className="w-3 h-3" /> Admin
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50">
                            Member
                        </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role !== 'admin' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}