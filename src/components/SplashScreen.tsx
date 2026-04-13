import { motion } from "motion/react";
import { ShoppingBag } from "lucide-react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1, delay: 3 }}
      onAnimationComplete={onComplete}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.8 
        }}
        className="flex flex-col items-center"
      >
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl mb-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col items-center justify-center">
            <div className="bg-red-600 text-white font-black text-4xl px-4 py-2 rounded-2xl mb-2 shadow-lg">JMB</div>
            <div className="text-red-600 font-black text-xl tracking-tighter">MART</div>
          </div>
        </div>
        <motion.h1 
          className="text-6xl font-black tracking-tighter mb-2 drop-shadow-md"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          JMB MART
        </motion.h1>
        <motion.p 
          className="text-red-100 font-black tracking-[0.4em] uppercase text-sm mb-2 opacity-90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          JAI MAA BHAVANI
        </motion.p>
        <div className="h-1 w-12 bg-white/30 rounded-full mb-4" />
        <motion.p 
          className="text-red-50 font-bold tracking-widest uppercase text-[12px] opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Aapki Apni Dukaan
        </motion.p>
      </motion.div>

      <motion.div 
        className="absolute bottom-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ 
                repeat: Infinity, 
                duration: 1, 
                delay: i * 0.2 
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
