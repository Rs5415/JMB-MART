import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Percent, Zap } from 'lucide-react';

const banners = [
  {
    id: 1,
    title: "Onion Special Offer",
    subtitle: "Fresh from farms to your kitchen",
    highlight: "₹8 per kg",
    description: "Limited time deal on premium quality onions.",
    color: "bg-red-600",
    icon: <Sparkles className="w-6 h-6" />,
    image: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    title: "Lowest Price Ever",
    subtitle: "Unbeatable deals on everything",
    highlight: "Best Price Guaranteed",
    description: "Lowest price ever on anything that you want. Shop now!",
    color: "bg-gray-900",
    icon: <Zap className="w-6 h-6" />,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    title: "Loyalty Rewards",
    subtitle: "We value your trust",
    highlight: "Up to 60% OFF",
    description: "Get up to 60% off on every order you have placed in your account.",
    color: "bg-red-800",
    icon: <Percent className="w-6 h-6" />,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800"
  }
];

export function SlidingBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[240px] md:h-[320px] overflow-hidden rounded-[32px] shadow-2xl shadow-red-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute inset-0 ${banners[currentIndex].color} flex items-center`}
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src={banners[currentIndex].image} 
              alt={banners[currentIndex].title}
              className="w-full h-full object-cover opacity-30 scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 px-8 md:px-16 w-full md:w-2/3 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-white/80"
            >
              {banners[currentIndex].icon}
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">{banners[currentIndex].subtitle}</span>
            </motion.div>

            <div className="space-y-1">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none"
              >
                {banners[currentIndex].title}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-block bg-white text-gray-900 px-4 py-1 rounded-full text-sm md:text-lg font-black tracking-tight"
              >
                {banners[currentIndex].highlight}
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/70 text-xs md:text-sm font-bold max-w-md leading-relaxed"
            >
              {banners[currentIndex].description}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-100 transition-colors"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-8 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
