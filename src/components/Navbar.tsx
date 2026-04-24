import { Search, Mic, ShoppingCart, MapPin, User, ShieldCheck, Navigation, Loader2 } from "lucide-react";
import { BrandLogo } from "@/src/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  cartCount: number;
  deliveryCount?: number;
  onSearch: (query: string) => void;
  onOpenCart: () => void;
  userRole?: string | null;
  userProfile?: any;
  currentPage?: string;
}

export function Navbar({ cartCount, deliveryCount = 0, onSearch, onOpenCart, userRole, userProfile, currentPage }: NavbarProps) {
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdminView = userRole === 'admin' && currentPage === 'admin';
  const isDeliveryView = userRole === 'delivery' && currentPage === 'delivery';
  const isSpecialView = isAdminView || isDeliveryView;

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser. Please try using Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Try to support both Hindi and English
    recognition.lang = 'hi-IN'; // Default to Hindi for village users
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setSearchQuery('');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      if (event.results[0].isFinal) {
        onSearch(transcript);
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable it in your browser settings.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <nav className={`sticky top-0 z-40 w-full bg-white border-b border-gray-100 transition-all duration-300 ${isSpecialView ? 'bg-red-900 text-white' : 'text-gray-900'}`}>
      <div className="container mx-auto px-4 py-2 md:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Location */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <BrandLogo className="w-10 h-10 md:w-11 md:h-11 shadow-sm" variant={isSpecialView ? "white" : "default"} />
              <div className="flex flex-col">
                <div className="flex items-center gap-0.5">
                  <span className={`font-black text-xl md:text-2xl tracking-tighter ${isSpecialView ? 'text-white' : 'text-red-600'}`}>JMB</span>
                  <span className={`font-black text-xl md:text-2xl tracking-tighter pl-1 ${isSpecialView ? 'text-white' : 'text-gray-900'}`}>{isAdminView ? 'ADMIN' : isDeliveryView ? 'DELIVERY' : 'MART'}</span>
                  {!isSpecialView && (
                    <Badge variant="outline" className={`ml-2 text-[8px] font-black uppercase tracking-tighter rounded-full px-2 py-0 h-4 ${new Date().getHours() >= 6 && new Date().getHours() < 22 ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-400 bg-gray-50'}`}>
                      {new Date().getHours() >= 6 && new Date().getHours() < 22 ? 'OPEN' : 'CLOSED'}
                    </Badge>
                  )}
                </div>
                <div className={`text-[7px] md:text-[8px] font-black tracking-[0.25em] leading-none ${isSpecialView ? 'text-red-200' : 'text-red-600'}`}>
                  JAI MAA BHAVANI
                </div>
              </div>
            </div>
          </div>
            
          {/* Search Bar - Desktop */}
          {!isSpecialView && (
            <div className="hidden md:flex relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={isListening ? "Listening... (Bolye...)" : "Search for groceries, snacks and more..."}
                className={`pl-10 pr-10 py-5 bg-gray-50 border-gray-100 rounded-xl focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:bg-white transition-all ${isListening ? 'ring-2 ring-red-500 bg-white' : ''}`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-red-600 hover:bg-red-50'}`}
                onClick={startVoiceSearch}
                title="Voice Search"
              >
                <Mic className={isListening ? "w-6 h-6" : "w-5 h-5"} />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isSpecialView ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSearch('')} 
                className="border-white/20 text-white hover:bg-white/10 font-black rounded-xl text-[10px] uppercase tracking-widest h-11 px-4"
              >
                Go to Shop
              </Button>
            ) : (
              <>
                {userRole === 'admin' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSearch('admin')} 
                    className="flex border-red-200 text-red-600 hover:bg-red-50 font-black rounded-xl text-[10px] uppercase tracking-widest h-11 px-4"
                  >
                    <ShieldCheck className="w-4 h-4 md:mr-2" /> 
                    <span className="hidden md:inline">Admin Panel</span>
                  </Button>
                )}
                {userRole === 'delivery' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSearch('delivery-dashboard')} 
                    className="flex relative border-red-200 text-red-600 hover:bg-red-50 font-black rounded-xl text-[10px] uppercase tracking-widest h-11 px-4 overflow-visible"
                  >
                    <Navigation className="w-4 h-4 md:mr-2" /> 
                    <span className="hidden md:inline">Delivery Portal</span>
                    {deliveryCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg">
                        {deliveryCount}
                      </span>
                    )}
                  </Button>
                )}
                {userProfile ? (
                  <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                    <User className="w-4 h-4 text-red-600" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-red-800 leading-none">{userProfile.displayName || 'User'}</span>
                      <span className="text-[8px] font-bold text-red-600 mt-0.5">{userProfile.phoneNumber}</span>
                    </div>
                  </div>
                ) : userRole ? (
                   <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    <span className="text-[10px] font-black text-gray-400 leading-none">Loading Profile...</span>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="hidden md:flex font-bold text-gray-700 hover:text-red-600"
                    onClick={() => onSearch('auth')}
                  >
                    Login
                  </Button>
                )}
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl px-4 md:px-6 h-11 flex items-center gap-2 shadow-md active:scale-95 transition-all"
                  onClick={onOpenCart}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-[10px] opacity-80 uppercase tracking-wider">My Cart</span>
                    <span className="text-sm">{cartCount} {cartCount === 1 ? 'Item' : 'Items'}</span>
                  </div>
                  <span className="sm:hidden text-sm font-black">{cartCount}</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar - Mobile */}
        {!isSpecialView && (
          <div className="mt-3 md:hidden relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={isListening ? "Listening... (Bolye...)" : "Search for groceries..."}
                className={`pl-10 pr-10 py-5 bg-gray-50 border-gray-100 rounded-xl focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:bg-white transition-all ${isListening ? 'ring-2 ring-red-500 bg-white' : ''}`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-red-600 hover:bg-red-50'}`}
                onClick={startVoiceSearch}
                title="Voice Search"
              >
                <Mic className={isListening ? "w-6 h-6" : "w-5 h-5"} />
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
            className="bg-red-50 px-4 py-2 text-center text-xs font-bold text-red-700 flex items-center justify-center gap-2 border-t border-red-100"
          >
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            Listening... Try saying "Chawal" or "Soap"
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
