import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api"; // <-- CHỈ CẦN IMPORT API CHUNG
import { cn } from "@/lib/utils"; 

// (Component ChatMessage và ActionButton giữ nguyên)
function ChatMessage({ message }) {
  const isBot = message.from === "bot";
  return (
    <div className={cn("flex items-start gap-3", isBot ? "" : "justify-end")}>
      {isBot && (
        <Avatar className="w-8 h-8">
          <AvatarFallback>
            <Bot className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
          isBot ? "bg-muted" : "bg-green-600 text-primary-foreground"
        )}
      >
        {/* Render văn bản (có thể là HTML nếu muốn) */}
        <div dangerouslySetInnerHTML={{ __html: message.text }} />
      </div>
      {!isBot && (
        <Avatar className="w-8 h-8">
          <AvatarFallback>
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ActionButton({ text, onClick }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-auto text-wrap"
      onClick={onClick}
    >
      {text}
    </Button>
  );
}

// ===========================================
// --- 🚀 CHATBOT WIDGET (ĐÃ LÀM LẠI) ---
// ===========================================
export default function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Xin chào! Tôi là Trợ lý AgriTrend. Bạn muốn biết giá nông sản nào?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (from, text, actions = []) => {
    setMessages((prev) => [...prev, { from, text, actions }]);
  };
  
  // (Hàm handleActionClick giữ nguyên)
  const handleActionClick = (action) => {
    addMessage("user", action.text);
    processMessage(action.text); // Gọi processMessage với text của nút
  };

  // --- "BỘ NÃO" ĐÃ ĐƯỢC CHUYỂN VỀ BACKEND ---
  const processMessage = async (userText) => {
    setIsLoading(true);

    try {
      // 1. Gửi nguyên văn câu nói về backend
      const res = await api.post("/chatbot/query", {
        message: userText
      });

      const botResponse = res.data;

      // 2. Xử lý phản hồi từ backend
      if (botResponse.type === "PRICE_INFO") {
        const item = botResponse.data;
        let trendText = "ổn định";
        if (item.trend === 'up') trendText = "đang TĂNG 📈";
        if (item.trend === 'down') trendText = "đang GIẢM 📉";
        
        // Tạo tin nhắn HTML
        const priceMsg = `
          Tìm thấy giá <b>${item.name}</b> (Vùng: ${item.region}):<br>
          <b>${item.currentPrice.toLocaleString()} đ/kg</b> (xu hướng ${trendText}).
        `;
        addMessage("bot", priceMsg);
        
        // Gợi ý hành động (vẫn do frontend quyết định)
        addMessage("bot", "Bạn cần giúp gì khác không?", [
          { text: `Đặt cảnh báo cho ${item.name}` },
          { text: `So sánh giá ${item.name}` },
        ]);

      } else if (botResponse.type === "INFO") {
        // Nếu là tin nhắn thông tin (FAQ, lỗi, không tìm thấy)
        addMessage("bot", botResponse.text);
      }

    } catch (error) {
      console.error("Lỗi khi gọi API Chatbot:", error);
      addMessage("bot", "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- HÀM GỬI (ĐÃ ĐƠN GIẢN HÓA) ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    addMessage("user", userText);
    setInput("");
    
    // Chỉ cần gọi processMessage
    await processMessage(userText); 
  };

  // (Phần JSX giao diện giữ nguyên y hệt)
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <Card className="flex flex-col w-80 h-96 sm:w-96 sm:h-[500px] shadow-xl rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">Trợ lý AgriTrend</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index}>
                <ChatMessage message={msg} />
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-11">
                    {msg.actions.map((action, i) => (
                      <ActionButton
                        key={i}
                        text={action.text}
                        onClick={() => handleActionClick(action)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-4 border-t">
            <form onSubmit={handleSend} className="flex gap-2 w-full">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Hỏi tôi về giá..."
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        size="icon" 
        className="rounded-full w-14 h-14 shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </Button>
    </div>
  );
}