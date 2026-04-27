import { Product } from "@/src/data/products";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, Minus, ShoppingBag, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CartItem extends Product {
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemove, onCheckout }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 gap-4">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-red-200" />
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-gray-900">Your cart is empty</p>
          <p className="text-xs font-medium text-gray-500 mt-1">Add some essentials to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="bg-white p-4 mb-2 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 leading-none">Delivery in 10 mins</p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Shipment 1 of 1</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-50">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 p-1 border border-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-gray-900 truncate leading-tight">{item.name}</h4>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{item.category}</p>
                <p className="text-xs font-black text-red-700 mt-1">₹{item.price}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center bg-red-600 text-white rounded-xl h-10 px-1 shadow-sm">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-red-700 hover:text-white"
                    onClick={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-black w-7 text-center">{item.quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-red-700 hover:text-white"
                    onClick={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <button 
                  className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => onRemove(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 space-y-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500">
            <span>Item Total</span>
            <span>₹{total}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-red-600">
            <span>Delivery Fee</span>
            <span className="line-through text-gray-400 mr-2">₹25</span>
            <span>FREE</span>
          </div>
          <Separator className="bg-gray-100" />
          <div className="flex justify-between items-center text-base font-black text-gray-900">
            <span>Grand Total</span>
            <span className="text-lg">₹{total}</span>
          </div>
        </div>
        <Button 
          className="w-full bg-red-600 hover:bg-red-700 text-white py-7 text-base font-black rounded-2xl shadow-lg shadow-red-100 active:scale-95 transition-all flex justify-between px-6"
          onClick={onCheckout}
        >
          <span>₹{total}</span>
          <span className="flex items-center gap-2 uppercase tracking-widest text-xs">
            Proceed to Pay
            <Plus className="w-4 h-4 rotate-45" />
          </span>
        </Button>
      </div>
    </div>
  );
}
