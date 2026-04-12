import { useState, useEffect } from "react";
import { db } from "@/src/lib/firebase";
import { collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, orderBy, getDocs, writeBatch } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, XCircle, Clock, Plus, Loader2, Package, IndianRupee, Sparkles, CheckCircle2, Trash2, AlertCircle, RefreshCw, EyeOff, Eye, DatabaseBackup } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageGenerator } from "@/src/components/ImageGenerator";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { products as initialProducts } from "@/src/data/products";

export function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    description: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Orders snapshot error:", error);
    });

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      console.error("Products snapshot error:", error);
      setIsLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

  const handleSyncProducts = async () => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      const existingProductsSnap = await getDocs(collection(db, "products"));
      const existingNames = new Set(existingProductsSnap.docs.map(d => d.data().name));

      initialProducts.forEach(p => {
        if (!existingNames.has(p.name)) {
          const newDocRef = doc(collection(db, "products"));
          batch.set(newDocRef, {
            ...p,
            status: 'available',
            createdAt: serverTimestamp()
          });
        }
      });

      await batch.commit();
      console.log("Initial products synced to store!");
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'delivered' | 'cancelled') => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleUpdateProductStatus = async (productId: string, status: 'available' | 'out_of_stock' | 'unavailable') => {
    try {
      await updateDoc(doc(db, "products", productId), { status });
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: Number(newProduct.price),
        status: 'available',
        createdAt: serverTimestamp()
      });
      setNewProduct({ name: '', price: '', category: '', image: '', description: '' });
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-emerald-800 font-medium">Loading Store Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Dashboard</h1>
          <p className="text-gray-500 font-bold mt-1">Manage your store inventory and customer orders.</p>
        </div>
        <Button 
          onClick={handleSyncProducts} 
          disabled={isSyncing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
        >
          {isSyncing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <DatabaseBackup className="w-5 h-5 mr-2" />}
          Sync Products
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'emerald' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'orange' },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'blue' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'red' }
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center justify-center relative">
              <div className={`absolute top-2 right-2 p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 opacity-40 group-hover:opacity-100 transition-all`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-1">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="flex w-full bg-gray-100 p-1.5 rounded-2xl h-14 mb-8">
          <TabsTrigger value="orders" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]">Orders</TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]">Inventory</TabsTrigger>
          <TabsTrigger value="add" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]">Add Product</TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            AI Lab
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-0">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 tracking-tight">Order #{order.id.slice(-5)}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.createdAt?.toDate().toLocaleString()}</p>
                          </div>
                          <Badge className={`uppercase text-[10px] font-black px-3 py-1 rounded-full ${
                            order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer Details</p>
                          <p className="font-bold text-gray-900 text-sm">{order.address?.name}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">{order.address?.houseNumber}, {order.address?.landmark}</p>
                          <p className="text-xs text-emerald-600 font-black mt-2">📞 {order.address?.phone}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="bg-white border border-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                              <span className="text-xs font-bold text-gray-900">{item.name}</span>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 rounded-md">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-end gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bill</p>
                          <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{order.total}</p>
                        </div>
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-6 h-10 shadow-md active:scale-95 transition-all"
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Deliver
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 font-black rounded-xl px-6 h-10"
                              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            >
                              <XCircle className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="py-32 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-gray-200" />
                      </div>
                      <p className="font-black text-gray-900 tracking-tight">No orders yet</p>
                      <p className="text-xs text-gray-400 font-bold mt-1">Orders will appear here once customers start buying.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <ScrollArea className="h-[700px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-gray-50">
                  {products.map((product) => (
                    <div key={product.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 p-2 flex-shrink-0">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className={`w-full h-full object-contain ${product.status === 'unavailable' ? 'grayscale opacity-50' : ''}`} 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-900 tracking-tight leading-tight">{product.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{product.category}</p>
                          <p className="text-xl font-black text-emerald-700 mt-2">₹{product.price}</p>
                          <Badge className={`mt-2 text-[10px] font-black uppercase tracking-widest ${
                            product.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                            product.status === 'out_of_stock' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {product.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {product.status !== 'available' ? (
                          <Button 
                            size="sm" 
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-10"
                            onClick={() => handleUpdateProductStatus(product.id, 'available')}
                          >
                            <RefreshCw className="w-3 h-3 mr-2" /> Restock
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 font-black text-[10px] uppercase tracking-widest h-10"
                            onClick={() => handleUpdateProductStatus(product.id, 'out_of_stock')}
                          >
                            <AlertCircle className="w-3 h-3 mr-2" /> Out Stock
                          </Button>
                        )}

                        {product.status !== 'unavailable' ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-black text-[10px] uppercase tracking-widest h-10"
                            onClick={() => handleUpdateProductStatus(product.id, 'unavailable')}
                          >
                            <EyeOff className="w-3 h-3 mr-2" /> Hide
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-black text-[10px] uppercase tracking-widest h-10"
                            onClick={() => handleUpdateProductStatus(product.id, 'available')}
                          >
                            <Eye className="w-3 h-3 mr-2" /> Show
                          </Button>
                        )}

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="col-span-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest h-10"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" /> Remove Product
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="mt-0">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-2xl mx-auto">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Add New Product</CardTitle>
              <CardDescription className="font-bold text-gray-400">Fill in the details to add a new item to your catalog.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name</Label>
                    <Input required className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-emerald-500 h-12 font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g., Basmati Rice" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₹)</Label>
                    <Input required type="number" className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-emerald-500 h-12 font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="450" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</Label>
                    <Input required className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-emerald-500 h-12 font-bold" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="Grains" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image URL</Label>
                    <Input required className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-emerald-500 h-12 font-bold" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</Label>
                  <Input required className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-emerald-500 h-12 font-bold" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Product details..." />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-8 text-lg font-black rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all" disabled={isAdding}>
                  {isAdding ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6 mr-2" /> Add to Catalog</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">AI Product Visualizer</CardTitle>
              <CardDescription className="font-bold text-gray-400">Generate professional product images using Gemini AI.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <ImageGenerator />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
