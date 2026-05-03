import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/src/lib/firebase";
import { collection, query, onSnapshot, updateDoc, doc, where, orderBy, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, MapPin, CheckCircle2, Loader2, Phone, Navigation, KeyRound, Home, LogOut, History, Wallet, Settings, LayoutDashboard, Bike, ReceiptText } from "lucide-react";
import { OrderBill } from "@/src/components/OrderBill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import { signOut } from "firebase/auth";

export function DeliveryDashboard({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
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
      setOrders(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setIsLoading(false);
    }, (error) => {
      console.error("Delivery orders snapshot error:", error);
      setIsLoading(false);
    });

    // Location Tracking
    let watchId: number;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 10000; // 10 seconds

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          const now = Date.now();
          if (now - lastUpdate > UPDATE_INTERVAL) {
            lastUpdate = now;
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

  const stats = useMemo(() => {
    const active = orders.filter(o => o.status === 'assigned' || o.status === 'out_for_delivery').length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    const earnings = completed * 30; // Flat 30 rupees per delivery
    return { active, completed, earnings };
  }, [orders]);

  const activeOrders = orders.filter(o => o.status === 'assigned' || o.status === 'out_for_delivery');
  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="bg-red-600 p-2 rounded-xl">
              <Bike className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">Delivery HQ</h1>
          </div>
          <p className="text-gray-500 font-bold text-sm">Partner Portal • JMB MART</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none rounded-2xl border-gray-200 font-black h-14 md:h-12 px-6 shadow-sm hover:bg-gray-50"
            onClick={onBack}
          >
            <Home className="w-5 h-5 mr-2" /> SHOP
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none rounded-2xl border-red-100 text-red-600 hover:bg-red-50 font-black h-14 md:h-12 px-6 shadow-sm"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" /> LOGOUT
          </Button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="border-none shadow-sm rounded-3xl bg-white p-4 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-2 md:p-3 bg-blue-50 rounded-xl md:rounded-2xl">
              <Package className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-gray-900">{stats.active}</p>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Active</p>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white p-4 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-2 md:p-3 bg-green-50 rounded-xl md:rounded-2xl">
              <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-gray-900">{stats.completed}</p>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Done</p>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white p-4 md:p-6 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-2 md:p-3 bg-red-50 rounded-xl md:rounded-2xl">
              <Wallet className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl md:text-3xl font-black text-gray-900">₹{stats.earnings}</p>
          </div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Earnings</p>
        </Card>
      </div>

      <Tabs defaultValue="active" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-2xl h-14 mb-8 flex w-full overflow-x-auto scrollbar-hide flex-nowrap justify-start md:justify-around md:flex-wrap">
          <TabsTrigger value="active" className="min-w-[100px] md:flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2 px-4 whitespace-nowrap">
            <LayoutDashboard className="w-3 h-3" /> Active
          </TabsTrigger>
          <TabsTrigger value="map" className="min-w-[100px] md:flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2 px-4 whitespace-nowrap">
            <Navigation className="w-3 h-3" /> Map
          </TabsTrigger>
          <TabsTrigger value="history" className="min-w-[100px] md:flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2 px-4 whitespace-nowrap">
            <History className="w-3 h-3" /> History
          </TabsTrigger>
          <TabsTrigger value="settings" className="min-w-[100px] md:flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2 px-4 whitespace-nowrap">
            <Settings className="w-3 h-3" /> Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 gap-6">
            {activeOrders.length === 0 ? (
              <Card className="border-none shadow-sm rounded-3xl p-12 text-center bg-white">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900">No active tasks</h3>
                <p className="text-gray-400 font-bold mt-1">Enjoy your break! New orders will pop up here.</p>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <Card key={order.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-all border border-gray-50">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 tracking-tight text-lg">Order #{order.orderNumber || order.id.slice(-5)}</p>
                            <Badge className={`uppercase text-[10px] font-black px-3 py-1 rounded-full mt-1 ${
                              order.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
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
                            <p className="text-lg font-black text-gray-900 mt-3 tracking-tighter">Amount: ₹{order.total}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                        {order.status === 'assigned' && (
                          <>
                            <Button 
                              variant="outline"
                              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl h-12 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mb-2"
                              onClick={() => setSelectedOrderForBill(order)}
                            >
                              <ReceiptText className="w-4 h-4" /> VIEW BILL
                            </Button>
                            <Button 
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl h-14 shadow-lg shadow-orange-100 active:scale-95 transition-all"
                              onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                            >
                              PICKUP ORDER
                            </Button>
                            <Button 
                              variant="ghost"
                              className="w-full text-gray-400 hover:text-red-600 font-bold text-xs"
                              onClick={() => {
                                if (confirm("Are you sure you want to cancel this delivery assignment? The order will go back to pending.")) {
                                  handleUpdateStatus(order.id, 'pending');
                                  // Also clear deliveryPersonId
                                  updateDoc(doc(db, "orders", order.id), { deliveryPersonId: null });
                                }
                              }}
                            >
                              CAN'T DELIVER? CANCEL
                            </Button>
                          </>
                        )}

                        {order.status === 'out_for_delivery' && (
                          <div className="space-y-3">
                            <Button 
                              variant="outline"
                              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl h-12 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                              onClick={() => setSelectedOrderForBill(order)}
                            >
                              <ReceiptText className="w-4 h-4" /> VIEW BILL
                            </Button>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <KeyRound className="w-3 h-3" /> Customer OTP
                              </Label>
                              <Input 
                                placeholder="Enter 4-digit OTP"
                                maxLength={4}
                                className="rounded-xl border-red-100 bg-white focus:ring-red-500 h-12 font-black text-center text-lg shadow-sm"
                                value={otpInputs[order.id] || ''}
                                onChange={(e) => setOtpInputs({...otpInputs, [order.id]: e.target.value.replace(/\D/g, '')})}
                              />
                            </div>
                            <Button 
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl h-14 shadow-lg shadow-red-100 active:scale-95 transition-all"
                              onClick={() => handleVerifyOtp(order)}
                            >
                              COMPLETE DELIVERY
                            </Button>
                            {error && <p className="text-[10px] text-red-500 font-bold text-center">{error}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          <AnimatePresence mode="wait">
            {currentLocation ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-600 rounded-2xl">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Real-time Location</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-red-600">Location tracking active</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl border-gray-200 font-bold text-xs"
                      onClick={() => window.open(`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`, '_blank')}
                    >
                      NAVIGATE
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-gray-100 relative bg-gray-100">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15&output=embed shadow-xl`}
                        allowFullScreen
                      ></iframe>
                      <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precise Coordinates</p>
                          <p className="font-black text-gray-900">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</p>
                        </div>
                        <Badge className="bg-red-50 text-red-600 border-none animate-pulse">LIVE</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="border-none shadow-sm rounded-3xl p-20 text-center bg-white flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <Navigation className="w-8 h-8 text-red-300 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-gray-900">Waiting for GPS...</h3>
                <p className="text-gray-400 font-bold max-w-xs mx-auto">Please allow location access to enable navigation features.</p>
              </Card>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {pastOrders.length === 0 ? (
                  <div className="p-20 text-center">
                    <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">No past deliveries found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {pastOrders.map((order) => (
                      <div key={order.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${order.status === 'delivered' ? 'bg-green-50' : 'bg-red-50'}`}>
                            {order.status === 'delivered' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          </div>
                          <div>
                            <p className="font-black text-gray-900">Order #{order.orderNumber || order.id.slice(-5)}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">₹{order.total} • {order.address?.name}</p>
                          </div>
                        </div>
                        <Badge className={`uppercase text-[10px] font-black px-3 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-3xl p-8 bg-white">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Partner Settings
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Display Name</Label>
                  <Input disabled value={auth.currentUser?.displayName || "N/A"} className="rounded-xl bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</Label>
                  <Input disabled value={auth.currentUser?.email || "N/A"} className="rounded-xl bg-gray-50" />
                </div>
                <div className="pt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                  <p className="text-xs text-orange-800 font-bold mb-1 italic">Want to change details?</p>
                  <p className="text-[10px] text-orange-600">Please contact the admin for profile modifications or shift changes.</p>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl p-8 bg-red-600 text-white">
              <h3 className="text-xl font-black mb-4">Partner Support</h3>
              <p className="text-red-100 font-bold text-sm mb-6 leading-relaxed">Need help while on the road? Our support team is available 24/7 for delivery partners.</p>
              <Button className="w-full bg-white text-red-600 hover:bg-red-50 font-black rounded-2xl h-14">
                CONTACT ADMIN
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <OrderBill 
        order={selectedOrderForBill} 
        isOpen={!!selectedOrderForBill} 
        onClose={() => setSelectedOrderForBill(null)} 
      />
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
