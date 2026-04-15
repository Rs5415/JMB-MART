import { memo } from "react";
import { Product } from "@/src/data/products";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = memo(function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.status === 'out_of_stock';
  const isAvailable = product.status === 'available' || !product.status;
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <Card className={`overflow-hidden border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 group relative bg-white rounded-2xl ${!isAvailable ? 'opacity-75' : ''}`}>
      <div className="relative aspect-square overflow-hidden bg-gray-50/50 p-2">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {discount > 0 && isAvailable && (
          <div className="absolute top-2 right-2 z-20">
            <Badge className="bg-red-600 text-white text-[9px] font-black border-none shadow-lg px-2 py-0.5 rounded-lg animate-pulse">
              {discount}% OFF
            </Badge>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <Badge variant="destructive" className="text-[10px] px-2 py-0.5 shadow-sm font-bold uppercase tracking-wider">Out of Stock</Badge>
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-white/90 text-red-700 text-[10px] font-bold border-none shadow-sm backdrop-blur-sm">
          {product.category}
        </Badge>
      </div>
      <CardContent className="p-3 space-y-1">
        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm leading-tight">{product.name}</h3>
        <p className="text-[10px] text-gray-500 line-clamp-1">{product.description}</p>
        <div className="pt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-black text-gray-900">₹{product.price}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-[9px] text-gray-400 line-through">₹{product.mrp}</span>
            )}
          </div>
          <Button 
            onClick={() => onAddToCart(product)}
            disabled={!isAvailable}
            size="sm"
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 font-black text-xs h-8 px-4 rounded-lg shadow-sm active:scale-95 transition-transform"
          >
            {isAvailable ? 'ADD' : 'SOLD'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
