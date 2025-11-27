import { useEffect, useState } from "react"
import AdminNavbar from "@/components/AdminNavbar"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Plus, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // State cho Modal Sửa Giá
  const [editingProduct, setEditingProduct] = useState(null)
  const [newPrice, setNewPrice] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/all")
      setProducts(res.data)
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error)
    } finally {
      setLoading(false)
    }
  }

  // Mở modal sửa giá
  const handleEditClick = (product) => {
    setEditingProduct(product)
    setNewPrice(product.currentPrice)
  }

  // Gửi API cập nhật giá
  const handleSavePrice = async () => {
    if (!editingProduct) return
    try {
      await api.patch(`/products/${editingProduct.id}/price`, { newPrice: Number(newPrice) })
      toast({ title: "Thành công", description: "Đã cập nhật giá mới", variant: "default" })
      
      // Cập nhật lại list local để đỡ phải gọi API lại
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, currentPrice: Number(newPrice) } : p
      ))
      setEditingProduct(null)
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật giá", variant: "destructive" })
    }
  }

  // Xóa sản phẩm
  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(products.filter(p => p.id !== id))
      toast({ title: "Đã xóa", description: "Sản phẩm đã bị xóa khỏi hệ thống" })
    } catch (error) {
      console.error("Lỗi xóa:", error)
    }
  }

  // Lọc tìm kiếm
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.region.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#fcfaf8]">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header & Công cụ */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Nông sản</h1>
            <p className="text-gray-500 text-sm">Danh sách toàn bộ nông sản đang theo dõi</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Tìm tên hoặc vùng..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" /> Thêm Mới
            </Button>
          </div>
        </div>

        {/* Bảng Danh Sách */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[300px]">Tên Sản phẩm</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead>Giá hiện tại</TableHead>
                <TableHead>Cập nhật cuối</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-gray-900">
                    {product.name}
                    <div className="text-xs text-gray-400 font-normal">{product.category}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-gray-600 bg-gray-50">
                      {product.region}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-primary">
                        {Number(product.currentPrice).toLocaleString()} ₫
                    </span>
                    <span className="text-xs text-gray-400 ml-1">/{product.unit}</span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(product.lastUpdate).toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)}>
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* State Empty */}
          {!loading && filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Không tìm thấy sản phẩm nào.
            </div>
          )}
        </div>
      </main>

      {/* Modal Sửa Giá Nhanh */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật giá nhanh</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Sản phẩm</Label>
              <Input disabled value={editingProduct?.name || ""} />
            </div>
            <div className="grid gap-2">
              <Label>Giá mới (VNĐ)</Label>
              <Input 
                type="number" 
                value={newPrice} 
                onChange={(e) => setNewPrice(e.target.value)} 
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>Hủy</Button>
            <Button onClick={handleSavePrice}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}