import { useState, useEffect } from "react";
import { auth, googleProvider, db } from "@/src/lib/firebase";
import { signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, writeBatch, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, Mail, Lock, Loader2, Phone, Bike, ShieldCheck } from "lucide-react";

export function AuthModal({ onComplete }: { onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [step, setStep] = useState<'auth' | 'phone'>('auth');
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // If user is already authenticated but we're in AuthModal, 
    // it's likely because they need to complete their profile (phone number)
    const initSync = async () => {
      if (auth.currentUser && !pendingUser) {
        const success = await syncUserToFirestore(auth.currentUser);
        if (success) onComplete();
      }
    };
    initSync();
  }, []);

  const checkPhoneUniqueness = async (phone: string) => {
    const phoneRef = doc(db, "phoneNumbers", phone);
    const phoneSnap = await getDoc(phoneRef);
    return !phoneSnap.exists();
  };

  const handleAuthError = (err: any) => {
    console.error("Auth error:", err);
    const code = err.code || "";
    if (code === 'auth/network-request-failed') {
      setError("Network Error: Could not reach Firebase servers. Please disable any ad-blockers, try disabling Incognito/Private mode, and ensure your internet connection is stable.");
    } else if (code === 'auth/popup-closed-by-user') {
      setError("Sign-in popup was closed. Please try again.");
    } else if (code === 'auth/operation-not-allowed') {
      setError("Sign-in method disabled: Please enable 'Email/Password' and 'Google' providers in your Firebase Console under 'Authentication' > 'Sign-in method'.");
    } else if (code === 'auth/internal-error') {
      setError("A temporary internal error occurred. Please refresh and try again.");
    } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      setError("Invalid email or password. Please check your credentials and try again.");
    } else if (code === 'auth/email-already-in-use') {
      setError("This email is already registered. Please login instead.");
    } else if (code === 'auth/too-many-requests') {
      setError("Too many failed attempts. Your account has been temporarily locked for security. Please try again later.");
    } else if (code === 'auth/weak-password') {
      setError("Password is too weak. Please use at least 6 characters.");
    } else if (err.message?.includes('insufficient permissions')) {
      setError("Profile Sync Failed: You may not have permission to perform this action. Please contact support.");
    } else {
      setError(err.message || "An authentication error occurred.");
    }
  };

  const syncUserToFirestore = async (user: any, phone?: string, requestedRole: string = 'user') => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    const isAdminEmail = user.email === "archanasharma993151@gmail.com";
    const finalRole = isAdminEmail ? "admin" : requestedRole;
    
    if (!userSnap.exists()) {
      if (!phone) {
        setPendingUser({ ...user, requestedRole });
        setStep('phone');
        return false;
      }

      const isUnique = await checkPhoneUniqueness(phone);
      if (!isUnique) {
        throw new Error("This mobile number is already connected to another account.");
      }

      const batch = writeBatch(db);
      batch.set(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        phoneNumber: phone,
        role: finalRole,
        createdAt: serverTimestamp()
      });
      batch.set(doc(db, "phoneNumbers", phone), {
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      await batch.commit();
      setUserRole(finalRole);
    } else {
      const userData = userSnap.data();
      if (!userData.phoneNumber) {
        if (!phone) {
          setPendingUser({ ...user, requestedRole });
          setStep('phone');
          return false;
        }

        const isUnique = await checkPhoneUniqueness(phone);
        if (!isUnique) {
          throw new Error("This mobile number is already connected to another account.");
        }

        const batch = writeBatch(db);
        batch.update(userRef, { phoneNumber: phone });
        batch.set(doc(db, "phoneNumbers", phone), {
          uid: user.uid,
          createdAt: serverTimestamp()
        });
        await batch.commit();
      }
      
      let updatedRole = userData.role;
      // Update role if explicitly requested (e.g. logging in via delivery tab)
      // and not overriding admin
      if (isAdminEmail && userData.role !== "admin") {
        await setDoc(userRef, { role: "admin" }, { merge: true });
        updatedRole = "admin";
      } else if (requestedRole === 'delivery' && userData.role === 'user') {
        await setDoc(userRef, { role: "delivery" }, { merge: true });
        updatedRole = "delivery";
      }
      setUserRole(updatedRole);
    }
    setIsSuccess(true);
    return true;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.match(/^[0-9]{10}$/)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const success = await syncUserToFirestore(pendingUser, phoneNumber, pendingUser.requestedRole);
      if (success) onComplete();
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (retryCount = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const success = await syncUserToFirestore(result.user);
      if (success) onComplete();
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed' && retryCount < 1) {
        console.warn("Retrying Google Login due to network failure...");
        return handleGoogleLogin(retryCount + 1);
      }
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (type: 'login' | 'register', requestedRole: string = 'user', retryCount = 0) => {
    if (type === 'register' && !phoneNumber.match(/^[0-9]{10}$/)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (type === 'register') {
        const isUnique = await checkPhoneUniqueness(phoneNumber);
        if (!isUnique) {
          setError("This mobile number is already registered with another account.");
          setIsLoading(false);
          return;
        }
      }

      let user;
      if (type === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        user = result.user;
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      }
      const success = await syncUserToFirestore(user, type === 'register' ? phoneNumber : undefined, requestedRole);
      if (success) onComplete();
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed' && retryCount < 1) {
        console.warn(`Retrying ${type} due to network failure...`);
        return handleEmailAuth(type, requestedRole, retryCount + 1);
      }
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto border-red-100 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-700">One Last Step!</CardTitle>
          <CardDescription>
            Please connect your mobile number to continue. This helps us prevent fake orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="10-digit number" 
                  className="pl-10" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Registration"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-gray-400 text-xs" 
              onClick={async () => {
                await signOut(auth);
                setStep('auth');
                setPendingUser(null);
              }}
            >
              Cancel and Logout
            </Button>
            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
          </form>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-100 shadow-xl overflow-hidden">
        <div className="h-2 bg-red-600" />
        <CardContent className="p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <UserPlus className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Login Successful!</h2>
            <p className="text-gray-500 font-bold">Welcome back to JMB MART.</p>
          </div>
          
          <div className="pt-6 grid grid-cols-1 gap-4">
            {(userRole === 'admin' || userRole === 'delivery') && (
              <Button 
                onClick={onComplete}
                className="w-full py-8 text-lg font-black bg-red-600 hover:bg-red-700 text-white rounded-3xl shadow-xl shadow-red-100 flex flex-col h-auto"
              >
                <span>ENTER {userRole.toUpperCase()} PORTAL</span>
                <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Launch your dashboard</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onComplete()}
              className="w-full h-14 font-black rounded-3xl border-gray-200"
            >
              GO TO HOME SHOP
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-red-100 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-red-700">Namaste!</CardTitle>
        <CardDescription className="flex flex-col items-center">
          <span className="text-red-600 font-black text-xs tracking-[0.2em] mb-1">JAI MAA BHAVANI</span>
          <span>Login to JMB MART to start shopping</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-red-100 p-1 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center justify-center gap-1">
              <LogIn className="w-3 h-3" /> Login
            </TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center justify-center gap-1">
              <UserPlus className="w-3 h-3" /> Register
            </TabsTrigger>
            <TabsTrigger value="delivery" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center justify-center gap-1">
              <Bike className="w-3 h-3" /> Delivery
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => handleEmailAuth('login')} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4 mr-2" /> Login</>}
            </Button>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              Are you a delivery partner? 
              <button 
                onClick={() => {
                  const tabsList = document.querySelector('[role="tablist"]');
                  const deliveryTab = tabsList?.querySelector('[value="delivery"]') as HTMLElement;
                  deliveryTab?.click();
                }}
                className="text-red-600 font-bold ml-1 hover:underline"
              >
                Go to Delivery Portal
              </button>
            </p>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="reg-email" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="reg-phone" 
                  type="tel" 
                  className="pl-10" 
                  placeholder="10-digit number"
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="reg-password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => handleEmailAuth('register')} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" /> Register</>}
            </Button>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
              <p className="text-xs text-red-800 font-medium">
                Delivery partner portal. Login or register to start delivering.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="del-email">Email</Label>
              <Input id="del-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="del-phone">Mobile Number (For Registration)</Label>
              <Input 
                id="del-phone" 
                type="tel" 
                placeholder="10-digit number"
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="del-password">Password</Label>
              <Input id="del-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleEmailAuth('login', 'delivery')} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
              </Button>
              <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => handleEmailAuth('register', 'delivery')} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
              <p className="text-xs text-red-800 font-medium">
                Admin access is restricted to authorized store owners only.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button className="w-full bg-red-800 hover:bg-red-900" onClick={() => handleEmailAuth('login')} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Admin Login"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
        </div>

        <Button variant="outline" className="w-full border-red-200 hover:bg-red-50" onClick={() => handleGoogleLogin()} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" alt="Google" />
          )}
          Google Login
        </Button>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
            {error.includes("Sign-in method disabled") ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-700 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Configuration Required</span>
                </div>
                <p className="text-xs text-red-600 leading-relaxed font-medium">
                  Authentication providers are currently disabled in your Firebase project. To fix this:
                </p>
                <div className="space-y-2">
                  <div className="bg-white/50 p-3 rounded-lg border border-red-100 space-y-2">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Instructions:</p>
                    <ol className="text-xs text-gray-700 space-y-2 list-decimal ml-4 font-medium">
                      <li>Go to <a href="https://console.firebase.google.com/project/gothic-isotope-454705-h0/authentication/providers" target="_blank" className="text-blue-600 underline font-black">Authentication Settings</a></li>
                      <li>Click "Add new provider"</li>
                      <li>Enable both <strong className="text-gray-900">Email/Password</strong> and <strong className="text-gray-900">Google</strong></li>
                    </ol>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-300 text-red-700 hover:bg-red-100 font-bold text-xs h-10"
                    onClick={() => {
                      setError(null);
                      setIsLoading(false);
                    }}
                  >
                    I've enabled them - Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-red-500 text-xs text-center font-medium">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
