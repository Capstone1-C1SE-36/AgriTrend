import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

export default function PostCard({ post }) {
    const postTime = new Date(post.time)
    const minutesDiff = (Date.now() - postTime.getTime()) / 1000 / 60

    return (
        <Card key={post.id}>
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                        {post.avatar}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold">{post.author}</div>
                        <div className="text-sm text-muted-foreground">
                            {minutesDiff < 10
                                ? "Vừa mới đăng"
                                : formatDistanceToNow(postTime, { addSuffix: true, locale: vi })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Đăng vào {postTime.toLocaleString("vi-VN")}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <p className="text-sm">{post.content}</p>
                <div className="flex gap-2 flex-wrap">
                    {post.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">
                            {tag}
                        </Badge>
                    ))}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.comments}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
