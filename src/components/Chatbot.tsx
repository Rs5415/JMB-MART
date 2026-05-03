import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, MessageSquare, Shield, HelpCircle, Sparkles, ShoppingBag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  user?: any;
  userRole?: string | null;
}

export function Chatbot({ user, userRole }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! I am your JMB MART AI Assistant. How can I help you today? \n\nIf you are a customer, I can help with orders. If you are an Admin, I can help with dashboard tools.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = userRole === 'admin' || user?.email === 'archanasharma993151@gmail.com';

  const systemInstruction = `
    You are the "JMB MART AI Support Assistant". You are a specialized AI designed to help both Customers and Administrators of JMB MART (a digital grocery store).
    
    TONE: Professional, empathetic, and slightly local (using Namaste, Dhanyawad).
    
    CURRENT USER CONTEXT:
    - User Status: ${user ? 'Logged In' : 'Guest'}
    - User Identity: ${user?.displayName || user?.email || 'Unknown'}
    - User Role: ${userRole || 'customer'}
    - Is Administrator: ${isAdmin ? 'YES' : 'NO'}

    FOR CUSTOMERS:
    - help with tracking orders, payment issues, and finding products like rice, oil, pulses.
    - Explain that delivery usually takes 2-4 hours in the local area.
    - If they have issues, suggest checking the "My Orders" section.

    FOR ADMINISTRATORS (ONLY IF isAdmin is YES):
    - Help them navigate the Admin Dashboard.
    - Dashboard features: Stats (Revenue, Orders), Product Management (Add/Edit), User Management (Block/Unblock), Banner Management, and Delivery Assignments.
    - **Inventory Management**: Explain that they can Search, Filter, and Edit products in the "Inventory" tab. They can mark items as "Out of Stock" or "Hidden" from the shop.
    - **Bulk Upload**: Explain how to use "Bulk Upload" for products using CSV files.
    - **Common Fixes**: If a product won't update, suggest clicking "Sync Products" to fix ID mappings.
    - If they report a "bug", suggest they refresh the page or check the internet connection first.

    If anyone asks about "archanasharma993151@gmail.com", acknowledge that this is the Super-Admin email.
    
    Keep responses concise. Use Markdown formatting.
  `;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: systemInstruction,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = textToSend.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // API Requirement: First message in history must be with role 'user'
      let history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // If the first message is from the model, skip it for the API history
      if (history.length > 0 && history[0].role === 'model') {
        history = history.slice(1);
      }

      const chat = model.startChat({
        history: history,
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const botResponse = response.text() || "I'm sorry, I couldn't understand that. Please try again.";
      
      setMessages(prev => [...prev, { role: 'model', text: botResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickOptions = isAdmin 
    ? [
        { label: "Admin Tools", icon: Shield, query: "Show me admin dashboard features" },
        { label: "System Status", icon: HelpCircle, query: "Is the app working correctly?" },
        { label: "Product Help", icon: ShoppingBag, query: "How to add products?" }
      ]
    : [
        { label: "Order Tracking", icon: Clock, query: "How do I track my order?" },
        { label: "Offers", icon: Sparkles, query: "Are there any discounts?" },
        { label: "Contact Us", icon: MessageSquare, query: "How to contact store owner?" }
      ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[95vw] max-w-[420px] h-[600px] mb-2"
            >
              <Card className="flex flex-col h-full shadow-2xl border-2 border-red-50 overflow-hidden rounded-[2.5rem] bg-white">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-red-600 to-red-700 text-white flex justify-between items-center shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold tracking-tight">Support AI</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-white/70">Online Now</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 rounded-full h-8 w-8">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Messages Section */}
                <ScrollArea className="flex-1 p-6 bg-slate-50/50" ref={scrollRef}>
                  <div className="space-y-6">
                    {messages.map((m, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] p-4 shadow-sm ${
                          m.role === 'user' 
                            ? 'bg-red-600 text-white rounded-[2rem] rounded-tr-none' 
                            : 'bg-white text-gray-800 rounded-[2rem] rounded-tl-none border border-red-100/50'
                        }`}>
                          <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'}`}>
                            <Markdown>
                              {m.text}
                            </Markdown>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white p-4 rounded-full border border-red-100 shadow-sm flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thinking...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Quick Options */}
                {!isLoading && messages.length < 5 && (
                  <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
                    {quickOptions.map((opt, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(opt.query)}
                        className="rounded-full border-red-100 text-red-600 hover:bg-red-50 whitespace-nowrap gap-2 font-bold text-xs"
                      >
                        <opt.icon className="w-3 h-3" />
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Input Section */}
                <div className="p-6 border-t bg-white">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 bg-gray-50 p-2 rounded-[1.5rem] border border-gray-100"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isAdmin ? "How can I help with dashboard?" : "Ask a question..."}
                      className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-sm font-medium"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={isLoading || !input.trim()} 
                      className="bg-red-600 hover:bg-red-700 rounded-2xl h-10 w-10 shrink-0 shadow-lg shadow-red-200"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  <p className="text-[9px] text-center text-gray-400 mt-4 uppercase font-black tracking-widest">
                    Empowered by Gemini AI • JMB Mart
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-3 p-4 rounded-full shadow-2xl transition-all duration-500 overflow-hidden ${
            isOpen ? 'bg-white text-red-600 border-2 border-red-600' : 'bg-red-600 text-white'
          }`}
        >
          <div className="relative h-6 w-6">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="flex items-center justify-center h-full w-full"
                >
                  <Bot className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!isOpen && (
            <span className="font-bold text-sm pr-2 whitespace-nowrap">AI Support</span>
          )}
        </motion.button>
      </div>
    </>
  );
}
