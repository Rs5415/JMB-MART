import { ArrowLeft, ShoppingBag, Zap, Star, ShieldCheck, Truck, RefreshCcw, Share2 } from "lucide-react";
import { Product } from "@/src/data/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { ProductReviews } from "./ProductReviews";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export function ProductDetails({ product, onBack, onAddToCart, onBuyNow }: ProductDetailsProps) {
  const isAvailable = product.status === 'available' || !product.status;
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} at JMB Mart!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-50 bg-white flex flex-col md:relative md:inset-auto md:z-0 md:bg-transparent md:h-full"
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-50 bg-white flex items-center justify-between sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-gray-50">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Button>
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest truncate max-w-[200px]">
          Product Details
        </h2>
        <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full hover:bg-gray-50 text-red-600">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-6xl mx-auto p-4 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
              {/* Image Section */}
              <div className="space-y-6">
                <div className="aspect-square bg-gray-50/50 rounded-[3rem] p-8 md:p-16 flex items-center justify-center relative overflow-hidden group shadow-inner">
                  <motion.img 
                    layoutId={`product-image-${product.id}`}
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {discount > 0 && (
                    <Badge className="absolute top-8 right-8 bg-red-600 text-white font-black text-sm px-4 py-1.5 rounded-2xl shadow-xl animate-pulse">
                      -{discount}% OFF
                    </Badge>
                  )}
                </div>
                
                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2 text-center">
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">100% Quality</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2 text-center">
                    <Truck className="w-5 h-5 text-red-600" />
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Fast Delivery</span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl flex flex-col items-center gap-2 text-center">
                    <RefreshCcw className="w-5 h-5 text-red-600" />
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Easy Returns</span>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="flex flex-col gap-8">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-red-600 border-red-100 font-black uppercase tracking-widest text-[10px] rounded-full px-3">
                    {product.category}
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-[0.9] font-sans">
                    {product.name}
                  </h1>
                  <p className="text-gray-400 font-bold text-lg leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black text-red-700 tracking-tighter">₹{product.price}</span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-xl text-gray-300 font-bold line-through">₹{product.mrp}</span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest animate-bounce">
                    Inclusive of all taxes
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    onClick={() => onAddToCart(product)}
                    disabled={!isAvailable}
                    size="lg"
                    className="flex-1 bg-white hover:bg-gray-50 text-red-600 border-2 border-red-600 font-black h-16 rounded-[1.5rem] shadow-lg shadow-red-50 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 transition-all text-xs"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Add To Cart
                  </Button>
                  <Button 
                    onClick={() => onBuyNow(product)}
                    disabled={!isAvailable}
                    size="lg"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black h-16 rounded-[1.5rem] shadow-xl shadow-red-100 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 transition-all group text-xs"
                  >
                    <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" />
                    Order Now
                  </Button>
                </div>

                {/* Reviews Section Card */}
                <div className="mt-8 border-t border-gray-100 pt-12">
                   <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-gray-100 border border-gray-50 h-[600px] overflow-hidden flex flex-col">
                      <ProductReviews productId={product.id} productName={product.name} />
                   </div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-20 md:hidden" /> {/* Mobile bottom nav spacer */}
        </ScrollArea>
      </div>
    </motion.div>
  );
}
