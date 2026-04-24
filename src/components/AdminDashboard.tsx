import { useState, useEffect, useRef } from "react";
import { db } from "@/src/lib/firebase";
import { collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, orderBy, getDocs, writeBatch, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, XCircle, Clock, Plus, Loader2, Package, IndianRupee, Sparkles, CheckCircle2, Trash2, AlertCircle, RefreshCw, EyeOff, Eye, DatabaseBackup, Users, FileUp, Download, Check, Ban, UserCheck, LayoutGrid, Tag, MapPin, Navigation, Percent, BarChart2, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageGenerator } from "@/src/components/ImageGenerator";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { products as initialProducts } from "@/src/data/products";
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

export function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    mrp: '',
    category: '',
    image: '',
    description: ''
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState({ total: 0, current: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    highlight: '',
    description: '',
    image: '',
    searchQuery: '',
    color: 'bg-red-600'
  });

  useEffect(() => {
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const deliveryQuery = query(collection(db, "users"), where("role", "==", "delivery"));

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

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setUsersCount(snapshot.size);
    }, (error) => {
      console.error("Users snapshot error:", error);
    });

    const unsubscribeDelivery = onSnapshot(deliveryQuery, (snapshot) => {
      setDeliveryPartners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeCategories = onSnapshot(query(collection(db, "categories"), orderBy("name", "asc")), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeBanners = onSnapshot(query(collection(db, "banners"), orderBy("createdAt", "desc")), (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeUsers();
      unsubscribeDelivery();
      unsubscribeCategories();
      unsubscribeBanners();
    };
  }, []);

  const handleSyncProducts = async () => {
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      
      // Sync Products
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

      // Sync Categories
      const existingCatsSnap = await getDocs(collection(db, "categories"));
      if (existingCatsSnap.empty) {
        const initialCategories = [
          { name: 'Grains', icon: '🌾' },
          { name: 'Oils', icon: '🛢️' },
          { name: 'Soaps', icon: '🧼' },
          { name: 'Spices', icon: '🌶️' },
          { name: 'Dairy', icon: '🥛' },
          { name: 'Snacks', icon: '🍪' },
        ];
        initialCategories.forEach(cat => {
          const newDocRef = doc(collection(db, "categories"));
          batch.set(newDocRef, {
            ...cat,
            createdAt: serverTimestamp()
          });
        });
      }

      await batch.commit();
      console.log("Initial data synced to store!");
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    users: usersCount
  };

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analytics");

  const handleAssignDelivery = async (orderId: string, deliveryPersonId: string) => {
    try {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(db, "orders", orderId), { 
        deliveryPersonId,
        status: 'assigned',
        otp
      });
    } catch (error) {
      console.error("Error assigning delivery:", error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'delivered' | 'cancelled' | 'out_for_delivery') => {
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

  const handleToggleUserBlock = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { isBlocked: !currentStatus });
    } catch (error) {
      console.error("Error toggling user block:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to remove this product?")) return;
    setIsDeleting(productId);
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please check your permissions.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.icon) return;
    try {
      await addDoc(collection(db, "categories"), {
        ...newCategory,
        createdAt: serverTimestamp()
      });
      setNewCategory({ name: '', icon: '' });
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title || !newBanner.image) return;
    try {
      await addDoc(collection(db, "banners"), {
        ...newBanner,
        createdAt: serverTimestamp()
      });
      setNewBanner({
        title: '',
        subtitle: '',
        highlight: '',
        description: '',
        image: '',
        searchQuery: '',
        color: 'bg-red-600'
      });
    } catch (error) {
      console.error("Error adding banner:", error);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      await deleteDoc(doc(db, "banners", bannerId));
    } catch (error) {
      console.error("Error deleting banner:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, "categories", categoryId));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleUpdateCategoryIcon = async (categoryId: string, newIcon: string) => {
    try {
      await updateDoc(doc(db, "categories", categoryId), { icon: newIcon });
    } catch (error) {
      console.error("Error updating category icon:", error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addDoc(collection(db, "products"), {
        name: newProduct.name,
        price: Number(newProduct.price),
        mrp: newProduct.mrp ? Number(newProduct.mrp) : null,
        category: newProduct.category,
        image: newProduct.image,
        description: newProduct.description,
        status: 'available',
        createdAt: serverTimestamp()
      });
      setNewProduct({ name: '', price: '', mrp: '', category: '', image: '', description: '' });
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        setBulkUploadProgress({ total: data.length, current: 0 });

        try {
          const batchSize = 500; // Firestore batch limit
          for (let i = 0; i < data.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = data.slice(i, i + batchSize);

            chunk.forEach(item => {
              const newDocRef = doc(collection(db, "products"));
              batch.set(newDocRef, {
                name: item.name,
                price: Number(item.price),
                category: item.category,
                image: item.image,
                description: item.description,
                status: 'available',
                createdAt: serverTimestamp()
              });
            });

            await batch.commit();
            setBulkUploadProgress(prev => ({ ...prev, current: Math.min(prev.total, i + batchSize) }));
          }
          console.log("Bulk upload complete!");
        } catch (error) {
          console.error("Bulk upload error:", error);
        } finally {
          setIsBulkUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error("CSV Parse error:", error);
        setIsBulkUploading(false);
      }
    });
  };

  const downloadSampleCSV = () => {
    const csvContent = "name,price,category,image,description\nBasmati Rice,450,Grains,https://picsum.photos/seed/rice/400/400,Premium quality long grain rice\nFresh Milk,60,Dairy,https://picsum.photos/seed/milk/400/400,Farm fresh cow milk";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_products.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDailySales = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    const salesMap: { [key: string]: number } = {};
    orders.filter(o => o.status === 'delivered').forEach(order => {
      const date = order.createdAt?.toDate().toLocaleDateString();
      if (date) {
        salesMap[date] = (salesMap[date] || 0) + (order.total || 0);
      }
    });

    return last7Days.map(date => ({
      name: date.split('/')[0] + '/' + date.split('/')[1],
      total: salesMap[date] || 0
    }));
  };

  const getCategoryPerformance = () => {
    const catSales: { [key: string]: number } = {};
    orders.filter(o => o.status === 'delivered').forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.category) {
            catSales[item.category] = (catSales[item.category] || 0) + (item.price * (item.quantity || 1));
          }
        });
      }
    });
    return Object.entries(catSales).map(([name, value]) => ({ name, value }));
  };

  const CHART_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
        <p className="text-red-800 font-medium">Loading Store Data...</p>
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
          className="bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-red-100 active:scale-95 transition-all"
        >
          {isSyncing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <DatabaseBackup className="w-5 h-5 mr-2" />}
          Sync Products
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'red', tab: 'orders' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'orange', tab: 'orders' },
          { label: 'Banners', value: banners.length, icon: Sparkles, color: 'blue', tab: 'offers' },
          { label: 'Total Users', value: stats.users, icon: Users, color: 'purple', tab: 'users' },
          { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, icon: XCircle, color: 'red', tab: 'orders' }
        ].map((stat) => (
          <Card 
            key={stat.label} 
            className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all cursor-pointer active:scale-95"
            onClick={() => setActiveTab(stat.tab)}
          >
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full bg-gray-100 p-1.5 rounded-2xl h-14 mb-8">
          <TabsTrigger value="analytics" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <BarChart2 className="w-3 h-3" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]">Orders</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]">Users</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]">Categories</TabsTrigger>
          <TabsTrigger value="offers" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <Percent className="w-3 h-3" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]">Inventory</TabsTrigger>
          <TabsTrigger value="add" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]">Add Product</TabsTrigger>
          <TabsTrigger value="bulk" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <FileUp className="w-3 h-3" />
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            AI Lab
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-2xl text-green-600">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Lifetime Revenue</p>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter mt-1">₹{orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.total || 0), 0)}</h4>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 p-3 rounded-2xl text-red-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Delivered Orders</p>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter mt-1">{orders.filter(o => o.status === 'delivered').length}</h4>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Avg. Order Value</p>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter mt-1">
                      ₹{orders.filter(o => o.status === 'delivered').length > 0 
                        ? Math.round(orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.total || 0), 0) / orders.filter(o => o.status === 'delivered').length)
                        : 0}
                    </h4>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Success Rate</p>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter mt-1">
                      {orders.length > 0 ? Math.round((orders.filter(o => o.status === 'delivered').length / orders.length) * 100) : 0}%
                    </h4>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-black text-gray-900 tracking-tighter uppercase font-sans italic">Daily Sales</CardTitle>
                <CardDescription className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Last 7 days performance</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getDailySales()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900 }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        itemStyle={{ color: '#ef4444', fontWeight: 900 }}
                        labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#ef4444" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-black text-gray-900 tracking-tighter uppercase font-sans italic">Category Share</CardTitle>
                <CardDescription className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Sales distribution by category</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getCategoryPerformance()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getCategoryPerformance().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        itemStyle={{ fontWeight: 900 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto mt-4">
                  {getCategoryPerformance().map((cat, idx) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter truncate">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="offers" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-red-50/50 p-6 border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-2 rounded-xl">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Create Offer Banner</CardTitle>
                    <CardDescription className="text-gray-500 font-bold">Design an eye-catching banner for your customers.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddBanner} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</Label>
                      <Input 
                        placeholder="Onion Special Offer" 
                        className="rounded-xl border-gray-100 bg-gray-50 focus:ring-red-600 h-11 font-bold"
                        value={newBanner.title}
                        onChange={(e) => setNewBanner({...newBanner, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitle</Label>
                      <Input 
                        placeholder="Fresh from farms" 
                        className="rounded-xl border-gray-100 bg-gray-50 focus:ring-red-600 h-11 font-bold"
                        value={newBanner.subtitle}
                        onChange={(e) => setNewBanner({...newBanner, subtitle: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Highlight Text</Label>
                      <Input 
                        placeholder="₹8 per kg" 
                        className="rounded-xl border-gray-100 bg-gray-50 focus:ring-red-600 h-11 font-bold"
                        value={newBanner.highlight}
                        onChange={(e) => setNewBanner({...newBanner, highlight: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Search Query (Redirect)</Label>
                      <Input 
                        placeholder="onion" 
                        className="rounded-xl border-gray-100 bg-gray-50 focus:ring-red-600 h-11 font-bold"
                        value={newBanner.searchQuery}
                        onChange={(e) => setNewBanner({...newBanner, searchQuery: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</Label>
                    <Input 
                      placeholder="Limited time deal on premium quality onions." 
                      className="rounded-xl border-gray-100 bg-gray-50 focus:ring-red-600 h-11 font-bold"
                      value={newBanner.description}
                      onChange={(e) => setNewBanner({...newBanner, description: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banner Image</Label>
                    <ImageGenerator 
                      onImageGenerated={(url) => setNewBanner({...newBanner, image: url})}
                      promptOverride={`${newBanner.title} ${newBanner.description} realistic grocery store high quality`}
                    />
                    {newBanner.image && (
                      <div className="w-full h-32 rounded-2xl overflow-hidden border border-gray-100">
                        <img src={newBanner.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Background Color</Label>
                    <div className="flex gap-2">
                      {['bg-red-600', 'bg-gray-900', 'bg-red-800', 'bg-blue-600', 'bg-green-600'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewBanner({...newBanner, color})}
                          className={`w-10 h-10 rounded-xl transition-all ${color} ${newBanner.color === color ? 'ring-4 ring-red-100 scale-110' : 'opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl h-14 shadow-xl shadow-red-100 active:scale-95 transition-all mt-4">
                    <Plus className="w-5 h-5 mr-2" /> CREATE BANNER
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50 p-6 border-b border-gray-100">
                <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Active Banners</CardTitle>
                <CardDescription className="text-gray-500 font-bold">Manage your live marketing content.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-gray-50">
                    {banners.map(banner => (
                      <div key={banner.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-xl overflow-hidden ${banner.color}`}>
                            <img src={banner.image} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 tracking-tight">{banner.title}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Target: "{banner.searchQuery}"</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          onClick={() => handleDeleteBanner(banner.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {banners.length === 0 && (
                      <div className="py-20 text-center">
                        <Sparkles className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <p className="font-black text-gray-900">No active banners</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                            order.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {order.deliveryPersonId && (
                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> Delivery Partner
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">
                                  {deliveryPartners.find(p => p.uid === order.deliveryPersonId)?.displayName || 
                                   deliveryPartners.find(p => p.uid === order.deliveryPersonId)?.email || 
                                   'Unknown Partner'}
                                </p>
                                {deliveryPartners.find(p => p.uid === order.deliveryPersonId)?.location && (
                                  <p className="text-[10px] text-blue-600 font-bold mt-1">
                                    Last updated: {deliveryPartners.find(p => p.uid === order.deliveryPersonId)?.location?.updatedAt?.toDate().toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                              {deliveryPartners.find(p => p.uid === order.deliveryPersonId)?.location && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-200 text-blue-600 hover:bg-blue-100 rounded-xl font-black text-[10px] h-8"
                                  onClick={() => {
                                    const loc = deliveryPartners.find(p => p.uid === order.deliveryPersonId)?.location;
                                    if (loc) window.open(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`, '_blank');
                                  }}
                                >
                                  <MapPin className="w-3 h-3 mr-1" /> View Location
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer Details</p>
                          <p className="font-bold text-gray-900 text-sm">{order.address?.name}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">{order.address?.houseNumber}, {order.address?.landmark}</p>
                          <p className="text-xs text-red-600 font-black mt-2">📞 {order.address?.phone}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="bg-white border border-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                              <span className="text-xs font-bold text-gray-900">{item.name}</span>
                              <span className="text-[10px] font-black text-red-600 bg-red-50 px-1.5 rounded-md">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {order.status === 'pending' && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Delivery Partner</p>
                            <div className="flex flex-wrap gap-2">
                              {deliveryPartners.map(partner => (
                                <Button 
                                  key={partner.id}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-xl text-[10px] h-8"
                                  onClick={() => handleAssignDelivery(order.id, partner.uid)}
                                >
                                  {partner.displayName || partner.email}
                                </Button>
                              ))}
                              {deliveryPartners.length === 0 && (
                                <p className="text-[10px] text-gray-400 font-bold">No delivery partners available</p>
                              )}
                            </div>
                          </div>
                        )}
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
                              className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl px-6 h-10 shadow-md active:scale-95 transition-all"
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
        
        <TabsContent value="users" className="mt-0">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="divide-y divide-gray-50">
                  {users.map((user) => {
                    const userOrders = orders.filter(o => o.userId === user.uid);
                    const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                    const totalItems = userOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

                    return (
                      <div key={user.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                            <Users className="w-7 h-7 text-red-600" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 tracking-tight text-lg">{user.displayName || 'Anonymous User'}</p>
                            <p className="text-xs text-gray-400 font-bold">{user.email}</p>
                            <p className="text-xs text-red-600 font-black mt-1">📞 {user.phoneNumber || 'No Number'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="uppercase text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {user.role || 'user'}
                              </Badge>
                              {user.isBlocked && (
                                <Badge className="uppercase text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                  Blocked
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className="grid grid-cols-3 gap-8 text-right">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Orders</p>
                              <p className="text-xl font-black text-gray-900 tracking-tighter">{userOrders.length}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items</p>
                              <p className="text-xl font-black text-gray-900 tracking-tighter">{totalItems}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Spent</p>
                              <p className="text-xl font-black text-red-700 tracking-tighter">₹{totalSpent}</p>
                            </div>
                          </div>

                          {user.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4 ${
                                user.isBlocked 
                                  ? 'border-green-200 text-green-600 hover:bg-green-50' 
                                  : 'border-red-200 text-red-600 hover:bg-red-50'
                              }`}
                              onClick={() => handleToggleUserBlock(user.id, !!user.isBlocked)}
                            >
                              {user.isBlocked ? (
                                <><UserCheck className="w-3 h-3 mr-2" /> Unblock</>
                              ) : (
                                <><Ban className="w-3 h-3 mr-2" /> Block User</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <div className="py-32 text-center">
                      <Users className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                      <p className="font-black text-gray-900">No users found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 border-none shadow-sm rounded-3xl bg-white h-fit">
              <CardHeader>
                <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Add Category</CardTitle>
                <CardDescription className="text-xs font-bold">Create a new product category</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Name</Label>
                    <Input 
                      placeholder="e.g. Grains" 
                      className="rounded-xl border-gray-100"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Icon (Emoji)</Label>
                    <Input 
                      placeholder="e.g. 🌾" 
                      className="rounded-xl border-gray-100 text-2xl text-center"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-12">
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-sm rounded-3xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Manage Categories</CardTitle>
                <CardDescription className="text-xs font-bold">Edit or remove existing categories</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-gray-50">
                    {categories.map((cat) => (
                      <div key={cat.id} className="p-6 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl border border-red-100 shadow-sm group-hover:scale-105 transition-transform">
                            {cat.icon}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 tracking-tight text-lg">{cat.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {products.filter(p => p.category === cat.name).length} Products
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                            {['🌾', '🛢️', '🧼', '🌶️', '🥛', '🍪', '🍎', '🥩', '🍞'].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleUpdateCategoryIcon(cat.id, emoji)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all ${cat.icon === emoji ? 'bg-white shadow-sm ring-1 ring-red-100' : ''}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <div className="py-20 text-center">
                        <LayoutGrid className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <p className="font-black text-gray-900">No categories found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
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
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-xl font-black text-red-700">₹{product.price}</p>
                            {product.mrp && (
                              <p className="text-[10px] font-bold text-gray-400 line-through">₹{product.mrp}</p>
                            )}
                          </div>
                          <Badge className={`mt-2 text-[10px] font-black uppercase tracking-widest ${
                            product.status === 'available' ? 'bg-red-100 text-red-700' :
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
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest h-10"
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
                            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest h-10"
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
                          disabled={isDeleting === product.id}
                        >
                          {isDeleting === product.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="w-3 h-3 mr-2" />
                          )}
                          Remove Product
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
                    <Input required className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-red-500 h-12 font-bold" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g., Basmati Rice" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selling Price (₹)</Label>
                    <Input required type="number" className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-red-500 h-12 font-bold" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="450" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MRP (₹) - Optional</Label>
                    <Input type="number" className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-red-500 h-12 font-bold" value={newProduct.mrp} onChange={e => setNewProduct({...newProduct, mrp: e.target.value})} placeholder="500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</Label>
                    <select 
                      required 
                      className="w-full rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-red-500 h-12 font-bold px-3 outline-none" 
                      value={newProduct.category} 
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image URL</Label>
                    <Input required className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-red-500 h-12 font-bold" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</Label>
                  <Input required className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-red-500 h-12 font-bold" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Product details..." />
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-8 text-lg font-black rounded-2xl shadow-lg shadow-red-100 active:scale-95 transition-all" disabled={isAdding}>
                  {isAdding ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6 mr-2" /> Add to Catalog</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-0">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white max-w-2xl mx-auto">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Bulk Upload Products</CardTitle>
              <CardDescription className="font-bold text-gray-400">Upload a CSV file to add multiple products at once.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-8">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-red-900 uppercase tracking-widest text-xs">Instructions</h4>
                  <Button variant="ghost" size="sm" onClick={downloadSampleCSV} className="text-red-600 hover:bg-red-100 font-bold text-[10px] uppercase tracking-widest h-8">
                    <Download className="w-3 h-3 mr-2" /> Download Sample
                  </Button>
                </div>
                <ul className="text-xs text-red-800 font-medium space-y-2 list-disc list-inside">
                  <li>File must be in CSV format.</li>
                  <li>Headers must be: <code className="bg-red-100 px-1 rounded">name,price,category,image,description</code></li>
                  <li>Price must be a number.</li>
                  <li>Image must be a valid URL.</li>
                </ul>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl p-12 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer relative group" onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleBulkUpload}
                  disabled={isBulkUploading}
                />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  {isBulkUploading ? <Loader2 className="w-8 h-8 animate-spin text-red-600" /> : <FileUp className="w-8 h-8 text-red-600" />}
                </div>
                <p className="font-black text-gray-900 tracking-tight">
                  {isBulkUploading ? `Uploading ${bulkUploadProgress.current}/${bulkUploadProgress.total}...` : "Click to select CSV file"}
                </p>
                <p className="text-xs text-gray-400 font-bold mt-1">or drag and drop your file here</p>
              </div>

              {bulkUploadProgress.total > 0 && !isBulkUploading && bulkUploadProgress.current === bulkUploadProgress.total && (
                <div className="flex items-center gap-3 bg-green-50 p-4 rounded-2xl border border-green-100 text-green-700">
                  <Check className="w-5 h-5" />
                  <p className="text-sm font-bold">Successfully uploaded {bulkUploadProgress.total} products!</p>
                </div>
              )}
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
