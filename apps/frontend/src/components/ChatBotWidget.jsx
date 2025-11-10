import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchPriceForChatbot } from "@/lib/api"; // Import API từ Bước 2
import { cn } from "@/lib/utils"; // Import tiện ích classNames

// 1. Component Tin nhắn (để phân biệt Bot và User)
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
          isBot
            ? "bg-muted"
            : "bg-green-600 text-primary-foreground"
        )}
      >
        {message.text}
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

// 2. Component Nút Gợi ý Hành động
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
  const messagesEndRef = useRef(null); // Để tự động cuộn

  // 3. Hàm tự động cuộn khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Hàm thêm tin nhắn (linh hoạt hơn)
  const addMessage = (from, text, actions = []) => {
    setMessages((prev) => [...prev, { from, text, actions }]);
  };

  // 5. Xử lý khi bấm nút gợi ý
  const handleActionClick = (action) => {
    // Tạm thời chỉ xử lý text, bạn có thể điều hướng sau
    addMessage("user", action.text);
    processMessage(action.text, true); // `true` để bỏ qua việc phân tích lại
  };

  // 6. "BỘ NÃO" PARSER (Đã nâng cấp)
  const processMessage = async (userText, skipParsing = false) => {
    const lowerText = userText.toLowerCase();
    setIsLoading(true);

    if (skipParsing) {
      // Bỏ qua phân tích, dùng luôn userText cho các hành động
      if (lowerText.includes("đặt cảnh báo")) {
         addMessage("bot", "Tính năng đặt cảnh báo qua chat đang được phát triển. Bạn vui lòng vào trang chi tiết sản phẩm để đặt nhé!");
      }
      else if (lowerText.includes("so sánh giá")) {
         addMessage("bot", "Để so sánh, bạn hãy truy cập mục 'So sánh giá' trên thanh điều hướng.");
      }
      setIsLoading(false);
      return;
    }

    // --- Ý TƯỞNG 3: HỎI ĐÁP (FAQ) ---
    if (lowerText.includes("cảnh báo") && !lowerText.includes("đặt")) {
      addMessage("bot", "Để đặt cảnh báo giá, bạn vào trang chi tiết sản phẩm và nhấn 'Tạo cảnh báo' nhé!");
    } else if (lowerText.includes("diễn đàn") || lowerText.includes("thảo luận")) {
      addMessage("bot", "Bạn có thể tham gia Diễn đàn cộng đồng trên thanh điều hướng để chia sẻ kinh nghiệm.");
    }
    // --- Ý TƯỞNG 1 & 2: TRA GIÁ & XU HƯỚNG ---
    else if (lowerText.includes("giá") || lowerText.includes("bao nhiêu")) {
      let product = "cà phê"; // Mặc định
      let region = "buôn ma thuột"; // Mặc định

      if (lowerText.includes("lúa") || lowerText.includes("st25")) {
        product = "Lúa Gạo ST25";
        region = "sông cửu long";
      }
      if (lowerText.includes("xoài")) {
        product = "Xoài Cát Hòa Lộc";
        region = "Tiền Giang";
      }

      // Gọi API bằng hàm ở Bước 2
      const item = await fetchPriceForChatbot(product, region);

      if (item) {
        let trendText = "xu hướng ổn định";
        if (item.trend === 'up') trendText = "đang TĂNG 📈";
        if (item.trend === 'down') trendText = "đang GIẢM 📉";
        
        addMessage("bot", `Giá ${item.name} (${item.region}) hiện là ${item.currentPrice.toLocaleString()} đ/kg, ${trendText}.`);
        
        // --- Ý TƯỞNG 4: GỢI Ý HÀNH ĐỘNG ---
        addMessage("bot", "Tôi có thể giúp gì khác?", [
          { text: `Đặt cảnh báo cho ${item.name}` },
          { text: `So sánh giá ${item.name}` },
        ]);

      } else {
        addMessage("bot", `Xin lỗi, tôi không tìm thấy giá cho ${product}.`);
      }
    } 
    // --- MẶC ĐỊNH ---
    else {
      addMessage("bot", "Tôi chưa hiểu ý bạn. Vui lòng hỏi tôi về giá (ví dụ: 'giá lúa ST25'), hoặc cách đặt cảnh báo.");
    }
    
    setIsLoading(false);
  };

  // 7. Hàm xử lý gửi tin nhắn
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    addMessage("user", userText);
    setInput("");
    
    await processMessage(userText);
  };

  // 8. GIAO DIỆN JSX (Đã nâng cấp)
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Khung chat */}
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
                {/* Hiển thị nút gợi ý (Ý tưởng 4) */}
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
            {/* Div trống để cuộn */}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* ======== ĐÃ SỬA LỖI Ở ĐÂY ======== */}
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
          {/* ======== KẾT THÚC SỬA LỖI ======== */}

        </Card>
      )}

      {/* Nút bật/tắt chat */}
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