import { ShoppingBag } from "lucide-react";

export function BrandLogo({ className = "w-8 h-8", variant = "default" }: { className?: string, variant?: "default" | "white" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Dynamic Background */}
      <div className={`absolute inset-0 rounded-2xl rotate-6 transition-transform hover:rotate-0 ${variant === 'white' ? 'bg-white opacity-20' : 'bg-red-50'}`} />
      
      {/* Primary Container */}
      <div className={`relative w-full h-full rounded-2xl shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${variant === 'white' ? 'bg-white' : 'bg-red-600'}`}>
        <ShoppingBag className={`w-3/5 h-3/5 ${variant === 'white' ? 'text-red-600' : 'text-white'}`} strokeWidth={3} />
        
        {/* Modern Accent */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${variant === 'white' ? 'bg-red-500 border-white shadow-sm' : 'bg-white border-red-600 shadow-md animate-pulse'}`} />
      </div>
    </div>
  );
}
