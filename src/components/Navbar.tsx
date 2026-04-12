import { Search, Mic, ShoppingCart, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  cartCount: number;
  onSearch: (query: string) => void;
  onOpenCart: () => void;
  userRole?: string | null;
  currentPage?: string;
}

export function Navbar({ cartCount, onSearch, onOpenCart, userRole, currentPage }: NavbarProps) {
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdminView = userRole === 'admin' && currentPage === 'admin';

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Voice search is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      onSearch(transcript);
    };

    recognition.start();
  };

  return (
    <nav className={`sticky top-0 z-40 w-full bg-white border-b border-gray-100 transition-all duration-300 ${isAdminView ? 'bg-emerald-900 text-white' : 'text-gray-900'}`}>
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Location */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <div className={`p-1 rounded-lg font-black text-xl ${isAdminView ? 'bg-white text-emerald-900' : 'bg-emerald-600 text-white'}`}>JMB</div>
                <span className="font-black text-xl tracking-tighter">{isAdminView ? 'ADMIN' : 'MART'}</span>
              </div>
              {!isAdminView && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>Delivery in 10 mins</span>
                </div>
              )}
            </div>
          </div>
            
          {/* Search Bar - Desktop */}
          {!isAdminView && (
            <div className="hidden md:flex relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search for groceries, snacks and more..."
                className="pl-10 pr-10 py-5 bg-gray-50 border-gray-100 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-full ${isListening ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}
                onClick={startVoiceSearch}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isAdminView && (
              <>
                <Button 
                  variant="ghost" 
                  className="hidden md:flex font-bold text-gray-700 hover:text-emerald-600"
                >
                  Login
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-4 md:px-6 h-11 flex items-center gap-2 shadow-md active:scale-95 transition-all"
                  onClick={onOpenCart}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] opacity-80 uppercase tracking-wider">My Cart</span>
                    <span className="text-sm">{cartCount} {cartCount === 1 ? 'Item' : 'Items'}</span>
                  </div>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar - Mobile */}
        {!isAdminView && (
          <div className="mt-3 md:hidden relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search for groceries..."
                className="pl-10 pr-10 py-5 bg-gray-50 border-gray-100 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-full ${isListening ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}
                onClick={startVoiceSearch}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-50 px-4 py-2 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2 border-t border-emerald-100"
          >
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            Listening... Try saying "Rice" or "Soap"
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
