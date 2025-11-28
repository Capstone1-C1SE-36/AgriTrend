import { useEffect, useState } from "react"
import AdminNavbar from "@/components/AdminNavbar"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ExternalLink, Newspaper } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function AdminNews() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // State thêm mới
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newArticle, setNewArticle] = useState({ title: "", source: "AgriTrend", url: "", snippet: "" })

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const res = await api.get("/news") // Giả định API trả về list tin
      setNews(res.data || [])
    } catch (error) {
      console.error("Lỗi tải tin tức:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Xóa tin tức này?")) return
    try {
      await api.delete(`/news/${id}`)
      setNews(news.filter(n => n.id !== id))
      toast({ title: "Đã xóa", description: "Tin tức đã được gỡ bỏ" })
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể xóa tin tức", variant: "destructive" })
    }
  }

  const handleCreate = async () => {
    try {
      // Giả lập gọi API tạo tin
      // await api.post("/news", newArticle) 

      // Update UI tạm thời (Demo)
      const fakeNew = { ...newArticle, id: Date.now(), published_at: new Date().toISOString() }
      setNews([fakeNew, ...news])

      setIsAddOpen(false)
      setNewArticle({ title: "", source: "AgriTrend", url: "", snippet: "" })
      toast({ title: "Thành công", description: "Đã đăng tin mới" })
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể đăng tin", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfaf8]">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-6 py-8">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tin tức & Sự kiện</h1>
            <p className="text-gray-500 text-sm">Quản lý các bài viết hiển thị trên trang chủ</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Viết bài mới
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[400px]">Tiêu đề</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Ngày đăng</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="text-gray-900 line-clamp-2">{item.title}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">{item.snippet}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal bg-gray-100 text-gray-600">
                      {item.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(item.published_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && news.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Chưa có tin tức nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Modal Thêm tin */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Đăng tin mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tiêu đề</label>
              <Input
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                placeholder="Ví dụ: Giá cà phê hôm nay tăng mạnh..."
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nguồn</label>
              <Input
                value={newArticle.source}
                onChange={(e) => setNewArticle({ ...newArticle, source: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tóm tắt nội dung</label>
              <Textarea
                value={newArticle.snippet}
                onChange={(e) => setNewArticle({ ...newArticle, snippet: e.target.value })}
                placeholder="Nội dung ngắn gọn..."
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Link chi tiết (Tùy chọn)</label>
              <Input
                value={newArticle.url}
                onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate}>Đăng bài</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}