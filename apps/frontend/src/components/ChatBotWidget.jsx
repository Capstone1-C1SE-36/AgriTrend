import { useState } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ChatBotWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { from: "bot", text: "Xin chào 👋! Tôi có thể giúp gì cho bạn?" },
    ])
    const [input, setInput] = useState("")
    const navigate = useNavigate()

    const sendMessage = () => {
        if (!input.trim()) return
        const userMsg = { from: "user", text: input }
        setMessages((prev) => [...prev, userMsg])

        // Giả lập phản hồi AI
        setTimeout(() => {
            const botMsg = { from: "bot", text: `🤖 Tôi hiểu: "${input}" đó!` }
            setMessages((prev) => [...prev, botMsg])
        }, 600)

        setInput("")
    }

    const handleOpen = () => {
        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }
        setIsOpen(true)
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isOpen ? (
                <div className="w-80 h-96 bg-white shadow-2xl rounded-2xl flex flex-col border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between bg-green-600 text-white px-4 py-2">
                        <span className="font-semibold text-sm">Chat với AI</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-green-700 rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`p-2 text-sm rounded-lg max-w-[75%] ${msg.from === "bot"
                                    ? "bg-white border border-gray-200 text-gray-800 self-start shadow-sm"
                                    : "bg-green-600 text-white self-end ml-auto shadow-sm"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t bg-white flex gap-2">
                        <Input
                            className="text-sm"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <Button
                            size="icon"
                            onClick={sendMessage}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    onClick={handleOpen}
                    size="icon"
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-3 animate-bounce"
                >
                    <MessageCircle className="w-6 h-6" />
                </Button>
            )}
        </div>
    )
}
