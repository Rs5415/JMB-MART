import { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, XCircle, Clock, CheckCircle2, Loader2, ShoppingBag, Phone, Navigation, KeyRound, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OrderBill } from "@/src/components/OrderBill";

export function UserOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<any | null>(null);

  const [deliveryLocations, setDeliveryLocations] = useState<{[key: string]: any}>({});

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }

        // Fetch orders
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid)
        );

        const unsubscribeOrders = onSnapshot(q, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOrders(ordersData);
          setIsLoading(false);
        }, (error) => {
          console.error("Orders snapshot error:", error);
          setIsLoading(false);
        });

        return () => unsubscribeOrders();
      } else {
        setIsLoading(false);
        setOrders([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Separate effect for delivery locations to manage listeners properly
  useEffect(() => {
    const activeDeliveryIds = Array.from(new Set(
      orders
        .filter(o => o.deliveryPersonId && (o.status === 'assigned' || o.status === 'out_for_delivery'))
        .map(o => o.deliveryPersonId)
    ));

    const unsubscribes: (() => void)[] = [];

    activeDeliveryIds.forEach(id => {
      const unsub = onSnapshot(doc(db, "users", id), (userDoc) => {
        if (userDoc.exists()) {
          setDeliveryLocations(prev => ({
            ...prev,
            [id]: userDoc.data().location
          }));
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [orders]);

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
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fetching your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter">My Orders</h1>
          <p className="text-gray-400 font-bold text-[10px] md:text-sm">Track and manage your recent purchases.</p>
          {userProfile && (
            <p className="text-[10px] text-red-600 font-black mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Connected: {userProfile.phoneNumber}
            </p>
          )}
        </div>
      </div>
      
      <ScrollArea className="h-[75vh] pr-4 -mr-4">
        <div className="space-y-4 md:space-y-6">
          {orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((order) => (
            <Card key={order.id} className="border-none shadow-sm bg-white rounded-2xl md:rounded-3xl overflow-hidden group hover:shadow-md transition-all">
              <CardHeader className="p-4 md:p-6 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 tracking-tight text-sm md:text-base truncate">Order #{order.id.slice(-5)}</p>
                      <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
                        {order.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={`uppercase text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full whitespace-nowrap ${
                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {order.status === 'out_for_delivery' && order.otp && (
                  <div className="mt-3 md:mt-4 bg-red-600 text-white p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-between shadow-lg shadow-red-100">
                    <div>
                      <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-80">Delivery OTP</p>
                      <p className="text-xl md:text-2xl font-black tracking-[0.3em]">{order.otp}</p>
                    </div>
                    <div className="text-right">
                      <KeyRound className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
                      <p className="text-[7px] md:text-[9px] font-bold mt-1 max-w-[100px] md:max-w-[120px]">Share with delivery partner only</p>
                    </div>
                  </div>
                )}

                {order.deliveryPersonId && (order.status === 'assigned' || order.status === 'out_for_delivery') && (
                  <div className="mt-3 md:mt-4 bg-blue-50 border border-blue-100 p-3 md:p-4 rounded-xl md:rounded-2xl space-y-2 md:space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Navigation className="w-3 h-3 md:w-4 md:h-4 text-blue-600 animate-pulse" />
                        <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Live Tracking</p>
                      </div>
                      {deliveryLocations[order.deliveryPersonId] && (
                        <a 
                          href={`https://www.google.com/maps?q=${deliveryLocations[order.deliveryPersonId].lat},${deliveryLocations[order.deliveryPersonId].lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] md:text-[10px] font-black text-blue-600 underline"
                        >
                          View Map
                        </a>
                      )}
                    </div>
                    <p className="text-[9px] md:text-[10px] text-blue-600 font-bold">
                      {order.status === 'out_for_delivery' 
                        ? "Delivery partner is on the way!" 
                        : "Partner assigned & preparing."}
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-4">
                <div className="bg-gray-50/50 rounded-xl md:rounded-2xl p-3 md:p-4 space-y-2 md:space-y-3 border border-gray-50">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs md:text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-gray-900 truncate">{item.name}</span>
                        <span className="text-[8px] md:text-[10px] font-black text-red-600 bg-red-50 px-1 md:px-1.5 rounded-md whitespace-nowrap">x{item.quantity}</span>
                      </div>
                      <span className="font-black text-gray-900 whitespace-nowrap">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-end mt-4 md:mt-6">
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-xl md:text-2xl font-black text-red-700 tracking-tighter leading-none">₹{order.total}</p>
                  </div>
                  <div className="flex gap-1.5 md:gap-2">
                    {order.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 font-black rounded-lg md:rounded-xl px-2 md:px-4 h-8 md:h-10 text-[10px] md:text-sm"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-100 text-red-600 hover:bg-red-50 font-black rounded-lg md:rounded-xl px-2 md:px-4 h-8 md:h-10 text-[10px] md:text-sm"
                      onClick={() => setSelectedOrderForBill(order)}
                    >
                      <ReceiptText className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                      Bill
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-100 text-red-600 hover:bg-red-50 font-black rounded-lg md:rounded-xl px-2 md:px-4 h-8 md:h-10 text-[10px] md:text-sm"
                    >
                      Help
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
                className="mt-8 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-red-50"
                onClick={() => window.location.reload()}
              >
                Start Shopping
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <OrderBill 
        order={selectedOrderForBill} 
        isOpen={!!selectedOrderForBill} 
        onClose={() => setSelectedOrderForBill(null)} 
      />
    </div>
  );
}
