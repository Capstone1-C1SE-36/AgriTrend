import { useEffect, useState } from "react"
import AdminNavbar from "@/components/AdminNavbar"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search, Mail, Shield, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Lọc người dùng client-side
    const lowerTerm = searchTerm.toLowerCase()
    const results = users.filter(u => 
        (u.name && u.name.toLowerCase().includes(lowerTerm)) || 
        (u.email && u.email.toLowerCase().includes(lowerTerm))
    )
    setFilteredUsers(results)
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users")
      setUsers(res.data)
      setFilteredUsers(res.data)
    } catch (error) {
      console.error("Lỗi tải user:", error)
      toast({ title: "Lỗi kết nối", description: "Không thể lấy danh sách người dùng", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm("Hành động này không thể hoàn tác. Bạn có chắc muốn xóa người dùng này?")) return
    try {
      await api.delete(`/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast({ title: "Đã xóa", description: "Người dùng đã bị xóa khỏi hệ thống" })
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa người dùng", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thành viên</h1>
            <p className="text-gray-500 mt-1">Quản lý tài khoản người dùng và phân quyền hệ thống.</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
                placeholder="Tìm theo tên hoặc email..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-gray-50/50">
                <TableRow>
                    <TableHead className="pl-6">Người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead className="text-right pr-6">Hành động</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Đang tải danh sách...</TableCell>
                    </TableRow>
                ) : filteredUsers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                            Không tìm thấy thành viên nào phù hợp
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id} className="group hover:bg-gray-50/50">
                        <TableCell className="font-medium pl-6">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border bg-white">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="bg-blue-50 text-blue-600 font-medium">
                                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="text-gray-900 font-medium">{user.name || "Chưa đặt tên"}</div>
                                <div className="text-xs text-gray-400 font-normal md:hidden">{user.email}</div>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="text-gray-600 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                            {/* <Mail className="w-3 h-3 text-gray-400" /> */}
                            {user.email}
                        </div>
                        </TableCell>
                        <TableCell>
                        {user.role === 'admin' ? (
                            <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 gap-1 pl-2 pr-3 py-1 font-normal">
                                <Shield className="w-3 h-3" /> Quản trị viên
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50/50 gap-1 pl-2 pr-3 py-1 font-normal">
                                <User className="w-3 h-3 text-gray-400" /> Thành viên
                            </Badge>
                        )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                        {user.created_at 
                            ? new Date(user.created_at).toLocaleDateString('vi-VN') 
                            : <span className="text-gray-300 italic">Không rõ</span>}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                        {user.role !== 'admin' && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleDeleteUser(user.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}