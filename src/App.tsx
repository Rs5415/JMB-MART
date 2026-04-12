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
import { UserOrders } from "@/src/components/UserOrders";
import { SplashScreen } from "@/src/components/SplashScreen";
import { auth, db } from "@/src/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, onSnapshot, orderBy, setDoc, serverTimestamp } from "firebase/firestore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Sparkles, Home as HomeIcon, LogOut, User as UserIcon, ShieldCheck, Loader2, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CartItem extends Product {
  quantity: number;
}

type Page = 'home' | 'checkout' | 'auth' | 'admin' | 'orders';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  useEffect(() => {
    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // If Firestore is empty, fallback to local products (or wait for admin to sync)
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

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Proactive check for admin email
        const isAdminEmail = currentUser.email === "archanasharma993151@gmail.com";
        if (isAdminEmail) {
          setUserRole('admin');
          setCurrentPage('admin');
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);
          if (role === 'admin') {
            setCurrentPage('admin');
          }
        } else {
          // Create user document if it doesn't exist
          const role = isAdminEmail ? 'admin' : 'user';
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            role: role,
            createdAt: serverTimestamp()
          });
          setUserRole(role);
          if (role === 'admin') {
            setCurrentPage('admin');
          }
        }
      } else {
        setUserRole(null);
        setCurrentPage('home');
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.toLowerCase() === 'admin' && currentPage !== 'admin') {
      if (!user || userRole !== 'admin') {
        setCurrentPage('auth');
      } else {
        setCurrentPage('admin');
      }
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

  const categories = [
    { name: 'Grains', icon: '🌾' },
    { name: 'Oils', icon: '🛢️' },
    { name: 'Soaps', icon: '🧼' },
    { name: 'Spices', icon: '🌶️' },
    { name: 'Dairy', icon: '🥛' },
    { name: 'Snacks', icon: '🍪' },
  ];

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
        currentPage={currentPage}
      />

      <main className="container mx-auto px-4 py-6">
        {isAuthLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : currentPage === 'auth' ? (
          <AuthModal onComplete={() => setCurrentPage('home')} />
        ) : currentPage === 'admin' ? (
          <AdminDashboard />
        ) : currentPage === 'orders' ? (
          <UserOrders />
        ) : currentPage === 'home' ? (
          <div className="space-y-8">
            {/* Category Section */}
            {!searchQuery && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Shop by category</h2>
                  <Button variant="link" className="text-emerald-600 font-bold p-0">See all</Button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {categories.map((cat) => (
                    <button 
                      key={cat.name}
                      onClick={() => setSearchQuery(cat.name)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors group"
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
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    Admin Mode Active
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage('admin')} className="text-emerald-600 border-emerald-200 rounded-xl font-bold">
                      Dashboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleLogout} className="text-emerald-600 border-emerald-200 rounded-xl font-bold">
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
                    className="text-emerald-600 mt-2 font-bold"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </section>
          </div>
        ) : (
          <Checkout 
            total={cartTotal} 
            cart={cart}
            user={user}
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
            <SheetTitle className="flex items-center gap-2 text-emerald-700">
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
          className={`flex flex-col gap-1 h-auto ${currentPage === 'home' ? 'text-emerald-600' : 'text-gray-400'}`}
          onClick={() => setCurrentPage('home')}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px]">Home</span>
        </Button>
        {user && (
          <Button 
            variant="ghost" 
            className={`flex flex-col gap-1 h-auto ${currentPage === 'orders' ? 'text-emerald-600' : 'text-gray-400'}`}
            onClick={() => setCurrentPage('orders')}
          >
            <Package className="w-6 h-6" />
            <span className="text-[10px]">Orders</span>
          </Button>
        )}
        {userRole === 'admin' && (
          <Button 
            variant="ghost" 
            className={`flex flex-col gap-1 h-auto ${currentPage === 'admin' ? 'text-emerald-600' : 'text-gray-400'}`}
            onClick={() => setCurrentPage('admin')}
          >
            <ShieldCheck className="w-6 h-6" />
            <span className="text-[10px]">Admin</span>
          </Button>
        )}
        <Button 
          variant="ghost" 
          className={`flex flex-col gap-1 h-auto ${currentPage === 'auth' ? 'text-emerald-600' : 'text-gray-400'}`}
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
            <span className="absolute top-0 right-2 bg-emerald-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px]">Cart</span>
        </Button>
      </div>
    </div>
  );
}
