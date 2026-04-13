import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, User, Home, CheckCircle2, ArrowLeft, Loader2, Navigation, IndianRupee } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "motion/react";
import { db } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CheckoutProps {
  total: number;
  cart: any[];
  user: any;
  onBack: () => void;
  onComplete: () => void;
}

const VALID_PINCODE = "814152";

export function Checkout({ total, cart, user, onBack, onComplete }: CheckoutProps) {
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    houseNumber: '',
    village: 'JMB Village',
    phone: user?.phoneNumber || '',
    pincode: '',
    landmark: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await res.json();
          
          setFormData(prev => ({
            ...prev,
            houseNumber: data.display_name || `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`,
            pincode: data.address?.postcode || prev.pincode
          }));
        } catch (err) {
          setFormData(prev => ({
            ...prev,
            houseNumber: `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`
          }));
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setLocationError("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      console.error("Please login to place an order.");
      return;
    }

    if (formData.pincode !== VALID_PINCODE) {
      console.warn(`Sorry, we only deliver to pincode ${VALID_PINCODE}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total,
        address: formData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (error) {
      console.error("Error placing order:", error);
      console.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-white">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
          className="w-24 h-24 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-sky-50"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Order Confirmed!</h2>
        <p className="text-gray-500 font-medium max-w-xs mx-auto mb-8">
          Namaste, {formData.name}. Your order is being packed and will reach you in 10 minutes.
        </p>
        <div className="w-full max-w-xs bg-sky-50 p-4 rounded-2xl border border-sky-100">
          <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">Delivery Address</p>
          <p className="text-sm font-bold text-sky-900">{formData.houseNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={onBack} size="icon" className="rounded-full hover:bg-sky-50 text-sky-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-sky-600" />
              </div>
              <h2 className="font-black text-gray-900 tracking-tight uppercase text-xs">Delivery Address</h2>
            </div>
            
            <Card className="border-none shadow-sm bg-gray-50/50 rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</Label>
                  <Input 
                    required 
                    className="bg-white border-gray-100 rounded-xl focus:ring-sky-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">House No. / Address</Label>
                    <button 
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-1"
                    >
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                      Auto Detect
                    </button>
                  </div>
                  <Input 
                    required 
                    className="bg-white border-gray-100 rounded-xl focus:ring-sky-500"
                    value={formData.houseNumber}
                    onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pincode</Label>
                    <Input 
                      required 
                      placeholder="814152"
                      className={`bg-white border-gray-100 rounded-xl focus:ring-sky-500 ${formData.pincode && formData.pincode !== VALID_PINCODE ? "border-red-500" : ""}`}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</Label>
                    <Input 
                      required 
                      type="tel"
                      className="bg-white border-gray-100 rounded-xl focus:ring-sky-500"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-sky-600" />
              </div>
              <h2 className="font-black text-gray-900 tracking-tight uppercase text-xs">Payment Summary</h2>
            </div>

            <Card className="border-none shadow-sm bg-gray-50/50 rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{total}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-sky-600">
                    <span>Delivery Fee</span>
                    <span>FREE</span>
                  </div>
                  <Separator className="bg-gray-200/50" />
                  <div className="flex justify-between text-xl font-black text-gray-900 pt-2">
                    <span>Total Bill</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                <div className="bg-sky-600/5 p-4 rounded-xl border border-sky-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <IndianRupee className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900">Cash on Delivery</p>
                    <p className="text-[10px] font-bold text-gray-400">Pay when you receive</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-8 text-lg font-black rounded-2xl shadow-lg shadow-sky-100 active:scale-95 transition-all mt-4"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : `Pay ₹${total}`}
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
