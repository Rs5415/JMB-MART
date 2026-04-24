import { memo, useState } from "react";
import { Product } from "@/src/data/products";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductReviews } from "./ProductReviews";
import { MessageCircle, Star } from "lucide-react";
import { motion } from "motion/react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = memo(function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [showReviews, setShowReviews] = useState(false);
  const isOutOfStock = product.status === 'out_of_stock';
  const isAvailable = product.status === 'available' || !product.status;
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={`overflow-hidden border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 group relative bg-white rounded-3xl ${!isAvailable ? 'opacity-75' : ''}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-50/50 p-4">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-in-out"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
            {discount > 0 && isAvailable && (
              <Badge className="bg-red-600 text-white text-[9px] font-black border-none shadow-lg px-2 py-0.5 rounded-lg animate-pulse">
                {discount}% OFF
              </Badge>
            )}
            <Sheet open={showReviews} onOpenChange={setShowReviews}>
              <SheetTrigger 
                render={
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="w-8 h-8 rounded-xl bg-white/80 backdrop-blur-md shadow-sm border-none hover:bg-white transition-all scale-0 group-hover:scale-100"
                  />
                }
              >
                <MessageCircle className="w-4 h-4 text-gray-900" />
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md rounded-l-3xl border-none">
                <SheetHeader className="pb-4">
                  <SheetTitle className="flex items-center gap-2 text-red-700">
                    <Star className="w-5 h-5 fill-red-700" />
                    Customer Reviews
                  </SheetTitle>
                </SheetHeader>
                <ProductReviews productId={product.id} productName={product.name} />
              </SheetContent>
            </Sheet>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <Badge variant="destructive" className="text-[10px] px-3 py-1 shadow-sm font-black uppercase tracking-widest rounded-full">Out of Stock</Badge>
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-white/90 text-red-700 text-[10px] font-black border-none shadow-sm backdrop-blur-sm uppercase tracking-tighter rounded-lg px-2">
            {product.category}
          </Badge>
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="space-y-0.5">
            <h3 className="font-black text-gray-900 line-clamp-1 text-sm leading-tight tracking-tight">{product.name}</h3>
            <p className="text-[10px] text-gray-400 font-bold line-clamp-1 uppercase tracking-tight">{product.description}</p>
          </div>
          
          <div className="pt-2 flex items-center justify-between border-t border-gray-50 mt-2">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-gray-900 tracking-tighter">₹{product.price}</span>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-[10px] text-gray-300 font-bold line-through">₹{product.mrp}</span>
                )}
              </div>
            </div>
            <Button 
              onClick={() => onAddToCart(product)}
              disabled={!isAvailable}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] h-10 px-6 rounded-2xl shadow-lg shadow-red-100 active:scale-95 transition-all uppercase tracking-widest"
            >
              {isAvailable ? 'Buy Now' : 'Sold Out'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
