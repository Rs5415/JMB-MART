import { motion } from "motion/react";
import { ShoppingBag } from "lucide-react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-emerald-600 flex flex-col items-center justify-center text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1, delay: 2.5 }}
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
        <div className="bg-white p-6 rounded-3xl shadow-2xl mb-6">
          <ShoppingBag className="w-20 h-20 text-emerald-600" />
        </div>
        <motion.h1 
          className="text-5xl font-black tracking-tighter mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          JMB MART
        </motion.h1>
        <motion.p 
          className="text-emerald-100 font-medium tracking-widest uppercase text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Your Village Store
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
