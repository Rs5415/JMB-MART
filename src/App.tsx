/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { products as localProducts, Product } from "@/src/data/products";
import { Navbar } from "@/src/components/Navbar";
import { ProductCard } from "@/src/components/ProductCard";
import { Cart } from "@/src/components/Cart";
import { Checkout } from "@/src/components/Checkout";
import { Chatbot } from "@/src/components/Chatbot";
import { ImageGenerator } from "@/src/components/ImageGenerator";
import { AuthModal } from "@/src/components/AuthModal";
import { AdminDashboard } from "@/src/components/AdminDashboard";
import { DeliveryDashboard } from "@/src/components/DeliveryDashboard";
import { UserOrders } from "@/src/components/UserOrders";
import { SplashScreen } from "@/src/components/SplashScreen";
import { SlidingBanner } from "@/src/components/SlidingBanner";
import { auth, db } from "@/src/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, onSnapshot, orderBy, setDoc, serverTimestamp } from "firebase/firestore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Sparkles, Home as HomeIcon, LogOut, User as UserIcon, ShieldCheck, Loader2, Package, Navigation, Ban } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CartItem extends Product {
  quantity: number;
}

type Page = 'home' | 'checkout' | 'auth' | 'admin' | 'orders' | 'delivery' | 'blocked';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('jmb_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{name: string, icon: string}[]>([
    { name: 'Grains', icon: '🌾' },
    { name: 'Oils', icon: '🛢️' },
    { name: 'Soaps', icon: '🧼' },
    { name: 'Spices', icon: '🌶️' },
    { name: 'Dairy', icon: '🥛' },
    { name: 'Snacks', icon: '🍪' },
  ]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('jmb_cart', JSON.stringify(cart));
    
    // Sync to Firestore if user is logged in
    if (user) {
      const cartRef = doc(db, "carts", user.uid);
      setDoc(cartRef, { items: cart, updatedAt: serverTimestamp() }, { merge: true })
        .catch(err => console.error("Error syncing cart:", err));
    }
  }, [cart, user]);

  useEffect(() => {
    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      if (fetchedProducts.length > 0) {
        setStoreProducts(fetchedProducts);
      } else {
        setStoreProducts(localProducts);
      }
      setIsProductsLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setStoreProducts(localProducts);
      setIsProductsLoading(false);
    });

    const categoriesQuery = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      if (!snapshot.empty) {
        setCategories(snapshot.docs.map(doc => ({
          name: doc.data().name,
          icon: doc.data().icon
        })));
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        const role = userData.role;
        setUserRole(role);
        
        if (userData.isBlocked) {
          setCurrentPage('blocked');
          return;
        }
        
        // Force phone number connection if missing
        if (!userData.phoneNumber) {
          setCurrentPage('auth');
        } else {
          // Role based routing - only if we are on a restricted page or home
          if (currentPage === 'home' || currentPage === 'auth' || currentPage === 'admin' || currentPage === 'delivery') {
            if (role === 'admin') {
              setCurrentPage('admin');
            } else if (role === 'delivery') {
              setCurrentPage('delivery');
            } else {
              if (currentPage === 'admin' || currentPage === 'delivery') {
                setCurrentPage('home');
              }
            }
          }
        }

        // Load cart from Firestore
        const cartDoc = await getDoc(doc(db, "carts", uid));
        if (cartDoc.exists()) {
          const firestoreCart = cartDoc.data().items || [];
          if (firestoreCart.length > 0) {
            setCart(firestoreCart);
          }
        }
      } else {
        // If no doc exists, we must go to auth to complete profile (phone number)
        setCurrentPage('auth');
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserProfile(currentUser.uid);
      } else {
        setUser(null);
        setUserRole(null);
        setUserProfile(null);
        setCurrentPage('home');
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    if (q === 'admin' && currentPage !== 'admin') {
      if (!user || userRole !== 'admin') {
        setCurrentPage('auth');
      } else {
        setCurrentPage('admin');
      }
    } else if (q === 'delivery-dashboard' && currentPage !== 'delivery') {
      if (!user || userRole !== 'delivery') {
        setCurrentPage('auth');
      } else {
        setCurrentPage('delivery');
      }
    } else if (q === '' && (currentPage === 'admin' || currentPage === 'delivery' || currentPage === 'orders')) {
      setCurrentPage('home');
    }
  }, [searchQuery, user, userRole, currentPage]);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentPage('home');
  };

  const filteredProducts = useMemo(() => {
    return storeProducts.filter(p => 
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      p.status !== 'unavailable' // Hide unavailable products from shop
    );
  }, [searchQuery, storeProducts]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white pb-24">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <Navbar 
        cartCount={cartCount} 
        onSearch={setSearchQuery} 
        onOpenCart={() => setIsCartOpen(true)} 
        userRole={userRole}
        userProfile={userProfile}
        currentPage={currentPage}
      />

      <main className="container mx-auto px-4 py-6">
        {isAuthLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : currentPage === 'auth' ? (
          <AuthModal onComplete={() => {
            if (user) fetchUserProfile(user.uid);
            else setCurrentPage('home');
          }} />
        ) : currentPage === 'admin' ? (
          <AdminDashboard />
        ) : currentPage === 'delivery' ? (
          <DeliveryDashboard onBack={() => setCurrentPage('home')} />
        ) : currentPage === 'blocked' ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 border-4 border-red-100">
              <Ban className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">Account Blocked</h1>
            <p className="text-gray-500 font-bold max-w-md mb-8">
              Your account has been suspended due to unauthorized activity or violation of our terms. 
              Please contact support if you believe this is a mistake.
            </p>
            <Button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl px-12 h-14 shadow-xl shadow-red-100 active:scale-95 transition-all"
            >
              Logout
            </Button>
          </div>
        ) : currentPage === 'orders' ? (
          <UserOrders />
        ) : currentPage === 'home' ? (
          <div className="space-y-8">
            {/* Sliding Banner */}
            {!searchQuery && <SlidingBanner onAction={setSearchQuery} />}

            {/* Category Section */}
            {!searchQuery && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Shop by category</h2>
                  <Button variant="link" className="text-red-600 font-bold p-0">See all</Button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {categories.map((cat) => (
                    <button 
                      key={cat.name}
                      onClick={() => setSearchQuery(cat.name)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-red-50/50 hover:bg-red-100/50 transition-colors group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Bestsellers Section */}
            {!searchQuery && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Bestsellers</h2>
                    <Badge className="bg-red-500 text-white border-none text-[10px] font-black uppercase tracking-widest">Hot</Badge>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                  {storeProducts.slice(0, 5).map(product => (
                    <div key={product.id} className="min-w-[160px] md:min-w-[200px]">
                      <ProductCard product={product} onAddToCart={addToCart} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Main Shop Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  {searchQuery ? `Results for "${searchQuery}"` : 'Everything else'}
                </h2>
              </div>
              
              {userRole === 'admin' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    Admin Mode Active
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage('admin')} className="text-red-600 border-red-200 rounded-xl font-bold">
                      Dashboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 rounded-xl font-bold">
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                  </div>
                </div>
              )}

              {userRole === 'delivery' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                    <Navigation className="w-5 h-5" />
                    Delivery Partner Mode
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage('delivery')} className="text-blue-600 border-blue-200 rounded-xl font-bold">
                      Delivery Panel
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="text-blue-600 border-blue-200 rounded-xl font-bold">
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart} 
                  />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-lg font-bold">No products found</p>
                  <p className="text-sm">Try a different search or category.</p>
                  <Button 
                    variant="link" 
                    className="text-red-600 mt-2 font-bold"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </section>

            {/* Footer */}
            <footer className="pt-12 pb-8 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    <div className="p-1 bg-red-600 text-white rounded-lg font-black text-sm">JMB</div>
                    <span className="font-black text-sm tracking-tighter">MART</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                    Jai Maa Bhavani Mart - Your neighborhood grocery store delivered to your doorstep in minutes.
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Company</h4>
                  <ul className="space-y-2 text-[10px] font-bold text-gray-500">
                    <li>About Us</li>
                    <li>Careers</li>
                    <li>Terms & Conditions</li>
                    <li>Privacy Policy</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Help</h4>
                  <ul className="space-y-2 text-[10px] font-bold text-gray-500">
                    <li>Contact Us</li>
                    <li>FAQs</li>
                    <li>Refund Policy</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Partners</h4>
                  <ul className="space-y-2 text-[10px] font-bold text-gray-500">
                    <li>
                      <button 
                        onClick={() => setCurrentPage('auth')}
                        className="hover:text-red-600 transition-colors"
                      >
                        Become a Delivery Partner
                      </button>
                    </li>
                    <li>Merchant Login</li>
                  </ul>
                </div>
              </div>
              <div className="text-center pt-8 border-t border-gray-50">
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">
                  © 2026 JMB MART. JAI MAA BHAVANI.
                </p>
              </div>
            </footer>
          </div>
        ) : (
          <Checkout 
            total={cartTotal} 
            cart={cart}
            user={userProfile || user}
            onBack={() => setCurrentPage('home')} 
            onComplete={() => {
              setCart([]);
              setCurrentPage('home');
            }} 
          />
        )}
      </main>

      {/* Cart Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-red-700">
              <ShoppingBag className="w-5 h-5" />
              Your Shopping Cart
            </SheetTitle>
          </SheetHeader>
          <Cart 
            items={cart} 
            onUpdateQuantity={updateQuantity} 
            onRemove={removeFromCart}
            onCheckout={() => {
              setIsCartOpen(false);
              setCurrentPage('checkout');
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Chatbot */}
      <Chatbot />

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-around items-center md:hidden z-30">
        <Button 
          variant="ghost" 
          className={`flex flex-col gap-1 h-auto ${currentPage === 'home' ? 'text-red-600' : 'text-gray-400'}`}
          onClick={() => setCurrentPage('home')}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px]">Home</span>
        </Button>
        {user && userRole !== 'admin' && userRole !== 'delivery' && (
          <Button 
            variant="ghost" 
            className={`flex flex-col gap-1 h-auto ${currentPage === 'orders' ? 'text-red-600' : 'text-gray-400'}`}
            onClick={() => setCurrentPage('orders')}
          >
            <Package className="w-6 h-6" />
            <span className="text-[10px]">Orders</span>
          </Button>
        )}
        {userRole === 'admin' && (
          <Button 
            variant="ghost" 
            className={`flex flex-col gap-1 h-auto ${currentPage === 'admin' ? 'text-red-600' : 'text-gray-400'}`}
            onClick={() => setCurrentPage('admin')}
          >
            <ShieldCheck className="w-6 h-6" />
            <span className="text-[10px]">Admin</span>
          </Button>
        )}
        {userRole === 'delivery' && (
          <Button 
            variant="ghost" 
            className={`flex flex-col gap-1 h-auto ${currentPage === 'delivery' ? 'text-red-600' : 'text-gray-400'}`}
            onClick={() => setCurrentPage('delivery')}
          >
            <Navigation className="w-6 h-6" />
            <span className="text-[10px]">Delivery</span>
          </Button>
        )}
        <Button 
          variant="ghost" 
          className={`flex flex-col gap-1 h-auto ${currentPage === 'auth' ? 'text-red-600' : 'text-gray-400'}`}
          onClick={() => user ? handleLogout() : setCurrentPage('auth')}
        >
          {user ? <LogOut className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
          <span className="text-[10px]">{user ? 'Logout' : 'Login'}</span>
        </Button>
        <Button 
          variant="ghost" 
          className="flex flex-col gap-1 h-auto text-gray-400 relative"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingBag className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-2 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px]">Cart</span>
        </Button>
      </div>
    </div>
  );
}
