import { useState, useEffect } from "react";
import { auth, db } from "@/src/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Package, ShoppingBag, IndianRupee, LogOut, ShieldCheck, MapPin, Phone, ArrowRight, Settings, HelpCircle, Heart } from "lucide-react";
import { motion } from "motion/react";

export function Profile({ onLogout, onNavigate }: { onLogout: () => void, onNavigate: (page: any) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSpent: 0,
    orderCount: 0,
    wishlistCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch User Profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }

        // Fetch Stats
        const ordersQuery = query(collection(db, "orders"), where("userId", "==", user.uid));
        const ordersSnap = await getDocs(ordersQuery);
        const deliveredOrders = ordersSnap.docs.map(d => d.data()).filter(o => o.status === 'delivered');
        
        setStats({
          totalSpent: deliveredOrders.reduce((acc, o) => acc + (o.total || 0), 0),
          orderCount: ordersSnap.size,
          wishlistCount: 0 // Placeholder for future feature
        });
      } catch (err) {
        console.error("Error fetching profile stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  const user = auth.currentUser;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header Profile Section */}
      <div className="relative pt-12 pb-6 px-4">
        <div className="absolute top-0 left-0 w-full h-32 bg-red-600 rounded-b-[3rem] -z-10 shadow-lg shadow-red-100" />
        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-red-50 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-xl shadow-red-100 transition-transform group-hover:scale-105">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-red-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-50 text-red-600">
                  <Heart className="w-5 h-5 fill-red-600" />
                </div>
              </div>
              
              <div className="mt-6">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase font-sans">
                  {profile?.username || user.displayName || 'Super User'}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge className="bg-red-50 text-red-600 border-none font-black text-[10px] py-1 px-3 rounded-full uppercase tracking-widest">
                    Verified {profile?.role || 'Customer'}
                  </Badge>
                  {profile?.role === 'admin' && (
                    <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[10px] py-1 px-3 rounded-full uppercase tracking-widest">
                      Admin Access
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 w-full gap-4 mt-8 pt-8 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter">{stats.orderCount}</p>
                </div>
                <div className="text-center border-x border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Spent</p>
                  <p className="text-xl md:text-2xl font-black text-red-600 tracking-tighter">₹{stats.totalSpent}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verified</p>
                  <p className="text-xl md:text-2xl font-black text-green-600 tracking-tighter">100%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Options */}
      <div className="px-4 space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">My Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('orders')}
            className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-red-100 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-gray-900 tracking-tight">Order History</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Track your items</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300" />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-red-100 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-gray-900 tracking-tight">Saved Addresses</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Home, Work, Village</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>

        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4 mt-8">Account</h3>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-2 space-y-1">
            <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-red-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">Email Address</p>
                  <p className="text-[10px] text-gray-400 font-bold">{user.email}</p>
                </div>
              </div>
            </button>
            <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-red-600 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">Phone Number</p>
                  <p className="text-[10px] text-gray-400 font-bold">{profile?.phoneNumber || 'Not Linked'}</p>
                </div>
              </div>
            </button>
            <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-red-600 transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">Member Since</p>
                  <p className="text-[10px] text-gray-400 font-bold">May 2024</p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 mt-8 pt-4">
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-2xl border-gray-200 text-gray-900 font-black tracking-widest text-xs uppercase"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout Account
          </Button>
          
          <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
            Jai Maa Bhavani Mart v1.2.0
          </p>
        </div>
      </div>
    </div>
  );
}
