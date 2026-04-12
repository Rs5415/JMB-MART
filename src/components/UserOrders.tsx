import { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, XCircle, Clock, CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UserOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: 'cancelled'
      });
      console.log("Order cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling order:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fetching your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
          <Package className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">My Orders</h1>
          <p className="text-gray-400 font-bold text-sm">Track and manage your recent purchases.</p>
        </div>
      </div>
      
      <ScrollArea className="h-[75vh] pr-4 -mr-4">
        <div className="space-y-6">
          {orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((order) => (
            <Card key={order.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all">
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 tracking-tight">Order #{order.id.slice(-5)}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {order.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={`uppercase text-[10px] font-black px-3 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <div className="bg-gray-50/50 rounded-2xl p-4 space-y-3 border border-gray-50">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.name}</span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 rounded-md">x{item.quantity}</span>
                      </div>
                      <span className="font-black text-gray-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-2xl font-black text-emerald-700 tracking-tighter">₹{order.total}</p>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 font-black rounded-xl px-4 h-10"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-black rounded-xl px-4 h-10"
                    >
                      Need Help?
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-32">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">No orders yet</h3>
              <p className="text-sm text-gray-400 font-bold mt-1">Your order history will appear here.</p>
              <Button 
                className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-emerald-50"
                onClick={() => window.location.reload()}
              >
                Start Shopping
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
