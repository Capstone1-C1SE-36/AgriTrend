"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, MessageCircle, ThumbsUp, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Link } from "react-router-dom"
import api from "@/lib/api"
import PostCard from "@/components/PostCard"

export default function Community() {
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState("")
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await api.get("/community")
      const sorted = response.data.sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      )
      setPosts(sorted)
    } catch (error) {
      console.error("Lỗi khi lấy bài viết:", error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Gửi bài viết mới lên backend
  const handlePost = async () => {
    if (!newPost.trim()) return
    try {
      const token = localStorage.getItem("token")
      const tagList = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
      const res = await api.post(
        "/community",
        { content: newPost, tags: tagList },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setPosts([res.data, ...posts])
      setNewPost("")
      setTags("")
    } catch (error) {
      console.error("Lỗi đăng bài:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Cộng đồng</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Ô đăng bài */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Textarea
                placeholder="Chia sẻ suy nghĩ của bạn..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={3}
              />
              <input
                type="text"
                placeholder="Thêm thẻ (phân cách bằng dấu phẩy, ví dụ: Lúa gạo, Tư vấn)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-end">
                <Button onClick={handlePost}>
                  <Send className="h-4 w-4 mr-2" />
                  Đăng bài
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải bài viết...</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
