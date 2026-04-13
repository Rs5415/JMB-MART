import { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase";
import { collection, query, onSnapshot, updateDoc, doc, where, orderBy, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, MapPin, CheckCircle2, Loader2, Phone, Navigation, KeyRound, Home, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { signOut } from "firebase/auth";

export function DeliveryDashboard({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState<{[key: string]: string}>({});
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const ordersQuery = query(
      collection(db, "orders"), 
      where("deliveryPersonId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      console.error("Delivery orders snapshot error:", error);
      setIsLoading(false);
    });

    // Location Tracking
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          try {
            const userRef = doc(db, "users", auth.currentUser!.uid);
            await updateDoc(userRef, {
              location: {
                lat: latitude,
                lng: longitude,
                updatedAt: serverTimestamp()
              }
            });
          } catch (err) {
            console.error("Error updating location:", err);
          }
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      unsubscribe();
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleVerifyOtp = async (order: any) => {
    const inputOtp = otpInputs[order.id];
    if (inputOtp === order.otp) {
      try {
        await updateDoc(doc(db, "orders", order.id), { status: 'delivered' });
        setError(null);
      } catch (err) {
        console.error("Error completing delivery:", err);
      }
    } else {
      setError("Invalid OTP. Please ask the customer for the correct code.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
        <p className="text-red-800 font-medium tracking-widest uppercase text-xs">Loading Deliveries...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Delivery Panel</h1>
          <p className="text-gray-500 font-bold">Manage your assigned deliveries and track your location.</p>
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-2xl w-fit border border-red-100">
            <Navigation className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">Live Location Active</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="rounded-2xl border-gray-200 font-bold h-12 px-6"
            onClick={onBack}
          >
            <Home className="w-5 h-5 mr-2" /> Home
          </Button>
          <Button 
            variant="outline" 
            className="rounded-2xl border-red-100 text-red-600 hover:bg-red-50 font-bold h-12 px-6"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </Button>
        </div>
      </header>

      {currentLocation && (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-gray-900 tracking-tight">Your Current Location</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Real-time tracking enabled</CardDescription>
                </div>
              </div>
              <a 
                href={`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:bg-blue-50 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors"
              >
                Open in Maps
              </a>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-48 w-full rounded-2xl overflow-hidden border border-gray-100 relative bg-gray-50">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15&output=embed`}
                allowFullScreen
              ></iframe>
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Coordinates</p>
                <p className="text-[10px] font-bold text-gray-900">{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 ? (
          <Card className="border-none shadow-sm rounded-3xl p-12 text-center bg-white">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-900">No assigned orders</h3>
            <p className="text-gray-400 font-bold mt-1">New orders will appear here once assigned by admin.</p>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 tracking-tight text-lg">Order #{order.id.slice(-5)}</p>
                        <Badge className={`uppercase text-[10px] font-black px-3 py-1 rounded-full mt-1 ${
                          order.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Delivery Address
                        </p>
                        <p className="font-bold text-gray-900 text-sm">{order.address?.name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">{order.address?.houseNumber}, {order.address?.landmark}</p>
                        <p className="text-xs text-red-600 font-black mt-2 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {order.address?.phone}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Items</p>
                        <div className="flex flex-wrap gap-2">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="bg-white border border-gray-100 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                              <span className="text-[10px] font-bold text-gray-900">{item.name}</span>
                              <span className="text-[9px] font-black text-red-600 bg-red-50 px-1 rounded-md">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-lg font-black text-gray-900 mt-3 tracking-tighter">Total: ₹{order.total}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-4 min-w-[200px]">
                    {order.status === 'assigned' && (
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl h-14 shadow-lg shadow-orange-100 active:scale-95 transition-all"
                        onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                      >
                        Start Delivery
                      </Button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <KeyRound className="w-3 h-3" /> Enter Customer OTP
                          </Label>
                          <Input 
                            placeholder="4-digit OTP"
                            maxLength={4}
                            className="rounded-xl border-red-100 bg-red-50/30 focus:bg-white focus:ring-red-500 h-12 font-black text-center text-lg tracking-[0.5em]"
                            value={otpInputs[order.id] || ''}
                            onChange={(e) => setOtpInputs({...otpInputs, [order.id]: e.target.value.replace(/\D/g, '')})}
                          />
                        </div>
                        <Button 
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl h-14 shadow-lg shadow-red-100 active:scale-95 transition-all"
                          onClick={() => handleVerifyOtp(order)}
                        >
                          Complete Delivery
                        </Button>
                        {error && <p className="text-[10px] text-red-500 font-bold text-center">{error}</p>}
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-2xl border border-green-100">
                        <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                        <p className="text-xs font-black text-green-700 uppercase tracking-widest">Delivered</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
