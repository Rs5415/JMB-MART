import { IndianRupee, Printer, X, Download, Loader2, Scissors, Calendar, Hash, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface OrderBillProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderBill({ order, isOpen, onClose }: OrderBillProps) {
  const billRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [billFormat, setBillFormat] = useState<'a4' | 'receipt'>('a4');

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!billRef.current) return;
    
    // Create a hidden iframe for printing to avoid printing the entire page/modal backdrop
    const content = billRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>JMB Mart - Bill #${order.id?.slice(-8).toUpperCase()}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
              body { 
                font-family: 'Inter', sans-serif; 
                background: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .mono { font-family: 'JetBrains Mono', monospace; }
              .print-container { padding: 40px; max-width: 800px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${content}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadPDF = async () => {
    if (!billRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(billRef.current, {
        scale: 4, // Maximum quality
        useCORS: true,
        logging: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            // Force basic styles to avoid oklch errors in html2canvas/jsPDF
            const style = window.getComputedStyle(el);
            
            // Fix text colors
            if (el.style.color.includes('oklch') || style.color.includes('oklch')) {
              el.style.color = '#111827'; 
            }
            
            // Fix background colors
            if (el.style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklch')) {
              if (el.className.includes('bg-red-600')) el.style.backgroundColor = '#dc2626';
              else if (el.className.includes('bg-gray-50')) el.style.backgroundColor = '#f9fafb';
              else if (el.className.includes('bg-white')) el.style.backgroundColor = '#ffffff';
              else el.style.backgroundColor = 'transparent';
            }

            // Fix border colors
            if (el.style.borderColor.includes('oklch') || style.borderColor.includes('oklch')) {
              el.style.borderColor = '#e5e7eb';
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: billFormat === 'a4' ? 'a4' : [80, 200]
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`JMB-MART-${billFormat.toUpperCase()}-${order.id?.slice(-8).toUpperCase()}.pdf`);
    } catch (error) {
      console.error("Detailed PDF Error:", error);
      alert("There was an issue generating the PDF. Please try the Print option instead.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to trigger Google Drive save (Instructional approach for web)
  const saveToDrive = () => {
    handleDownloadPDF();
    // Provide a tip to the user
    setTimeout(() => {
      alert("✓ Order Bill downloaded to your device!\n\nTo save permanently to Google Drive:\n1. Open your Google Drive 앱 (App)\n2. Tap the '+' icon and select 'Upload'\n3. Choose this PDF from your 'Downloads' folder.");
    }, 1000);
  };

  const subtotal = order.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  const deliveryFee = order.deliveryFee || 20;
  const total = order.total || (subtotal + deliveryFee);

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
             <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`bg-white w-full ${billFormat === 'a4' ? 'max-w-2xl' : 'max-w-[340px]'} rounded-[2.5rem] shadow-[-20px_20px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden print:shadow-none print:rounded-none print:m-0 transition-all duration-700 ease-in-out border border-white/20`}
        >
          {/* Header Controls (Always Visible) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/80 backdrop-blur-xl border-b border-gray-100 p-6 z-20 print:hidden">
            {/* Format Selection */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200/50">
              <button 
                onClick={() => setBillFormat('a4')}
                className={`text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-all ${billFormat === 'a4' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                A4 Invoice
              </button>
              <button 
                onClick={() => setBillFormat('receipt')}
                className={`text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-all ${billFormat === 'receipt' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Bill Size
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={saveToDrive}
                disabled={isGenerating}
                className="rounded-xl bg-white hover:bg-gray-50 h-10 px-4 border-gray-200 gap-2 font-bold text-xs"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-4 h-4" alt="Drive" />
                <span className="hidden xs:inline">Save to Drive</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="rounded-xl bg-white hover:bg-gray-50 h-10 px-4 border-gray-200 gap-2 font-bold text-xs text-gray-700"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden xs:inline">PDF</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
                className="rounded-xl bg-white hover:bg-gray-50 h-10 px-4 border-gray-200 gap-2 font-bold text-xs text-gray-700"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden xs:inline">Print</span>
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full hover:bg-red-50 h-10 w-10 text-gray-400 hover:text-red-500 ml-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div ref={billRef} className="bg-white" style={{ backgroundColor: '#ffffff' }}>
            {/* PERFORATED TOP (Receipt Style) */}
            {billFormat === 'receipt' && (
              <div className="h-6 w-full flex justify-between px-2 overflow-hidden gap-1 mt-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-50 rounded-full shrink-0 -mt-2 border border-gray-100" />
                ))}
              </div>
            )}

            <div className={`p-10 ${billFormat === 'receipt' ? 'pt-2' : 'pt-20'} transition-all duration-700`}>
              {/* BRANDING HEADER */}
              <div className="flex flex-col items-center mb-12 text-center">
                <div 
                  className="flex items-center justify-center w-16 h-16 rounded-[1.5rem] rotate-6 mb-6 shadow-2xl shadow-red-100 border-4 border-white"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <span className="font-black text-2xl text-white -rotate-6">JM</span>
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-gray-900 mb-1 uppercase">JMB Mart</h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Official Invoice</span>
                </div>
              </div>

              {/* META INFO GRID */}
              <div className="grid grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden mb-12 shadow-sm">
                <div className="bg-white p-5 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Hash className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Order ID</span>
                  </div>
                  <p className="text-sm font-bold font-mono text-gray-900">#{order.id?.slice(-8).toUpperCase()}</p>
                </div>
                <div className="bg-white p-5 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Placed On</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {order.createdAt?.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-white p-5 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <CreditCard className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Payment</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">COD/Cash</p>
                </div>
                <div className="bg-white p-5 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Payment Status</span>
                  </div>
                  <p className="text-sm font-bold text-green-600">UNPAID</p>
                </div>
              </div>

              {/* CUSTOMER SECTION */}
              <div className="mb-12 border-l-4 border-red-600 pl-6 py-2 bg-red-50/30 rounded-r-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600/50 block mb-2">Delivery Address</span>
                <h3 className="text-lg font-black text-gray-900 leading-none mb-2">{order.address?.name}</h3>
                <p className="text-xs font-semibold text-gray-600 max-w-[280px] leading-relaxed">
                  {order.address?.houseNumber}, {order.address?.pincode}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white text-[10px] font-black text-gray-900 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-red-600">TEL</span> {order.address?.phone}
                </div>
              </div>

              {/* ITEMS SECTION */}
              <div className="space-y-6 mb-12">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                  <span className="flex-1">Items Description</span>
                  <span className="w-20 text-right">Price</span>
                  <span className="w-20 text-right">Total</span>
                </div>
                
                <div className="h-px bg-gray-100 w-full" />

                <div className="space-y-8">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 px-1 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 tracking-tight mb-1">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-400">Qty {item.quantity}</span>
                          <span className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span className="text-[11px] font-bold text-gray-400">Rate ₹{item.price}</span>
                        </div>
                      </div>
                      <div className="w-20 text-right self-center">
                        <p className="text-xs font-bold text-gray-400 font-mono">₹{item.price}</p>
                      </div>
                      <div className="w-20 text-right self-center">
                        <p className="text-sm font-black text-gray-900 font-mono tracking-tighter">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-dashed border-gray-200" />
              </div>

              {/* FINANCIALS */}
              <div className="space-y-4 mb-12 bg-gray-900 p-8 rounded-[2rem] text-white shadow-2xl shadow-gray-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white/40 uppercase tracking-widest">Sub-Total</span>
                  <span className="font-bold text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white/40 uppercase tracking-widest">Delivery Charge</span>
                  <span className="font-bold text-white">₹{deliveryFee.toFixed(2)}</span>
                </div>
                
                <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1">Amount Due</p>
                    <p className="text-[10px] text-white/40 font-medium">Inclusive of all taxes</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-red-500 leading-none">₹</span>
                      <span className="text-4xl font-black tracking-tighter text-white leading-none italic">{total}</span>
                    </div>
                  </div>
                </div>

                {/* Scan to Pay Section */}
                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-2xl shadow-xl mb-4 group/qr transition-transform hover:scale-110 duration-500">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=archanasharma993151@okaxis&pn=JMB%20Mart&tn=Order%20Payment&cu=INR" 
                      className="w-32 h-32" 
                      alt="Payment QR" 
                    />
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center rounded-2xl pointer-events-none">
                      <span className="text-[8px] font-bold text-gray-900 bg-white/90 px-2 py-1 rounded-full shadow-sm">PAY NOW</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Scan to Pay via G-Pay/UPI</p>
                    <p className="text-[8px] font-medium text-white/30 uppercase tracking-widest">Safe & Secure Transaction</p>
                  </div>
                </div>
              </div>

              {/* SIGNATURE / FOOTER */}
              <div className="flex flex-col items-center text-center">
                <div className="w-full h-px bg-gray-100 mb-10" />
                
                <div 
                  className="mb-8 p-6 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 relative group transition-all hover:border-red-100 hover:scale-105 duration-500"
                >
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=JMB-MART-BILL-VERIFIED-SYSTEM" className="w-24 h-24 opacity-80 mix-blend-multiply" alt="QR" />
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white rotate-12">
                    <span className="text-[10px] font-black">OK</span>
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-200 italic">Official Digital Record</p>
                  <p className="text-[9px] font-black text-gray-400 px-10 leading-relaxed uppercase tracking-tighter">
                    Thank you for supporting Local Enterprise. Your satisfaction is our priority.
                  </p>
                </div>

                <div className="flex items-center gap-6 opacity-30 grayscale contrast-125">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/MasterCard_Logo.svg" className="h-4" alt="Mastercard" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_Pay_Logo.svg" className="h-4" alt="Apple Pay" />
                </div>
              </div>
            </div>

            {/* CUT LINE (Receipt Style) */}
            {billFormat === 'receipt' ? (
              <div className="relative py-12 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 h-px border-t-2 border-dashed border-gray-200" />
                <div className="relative bg-white px-6">
                  <Scissors className="w-5 h-5 text-gray-200 animate-pulse" />
                </div>
                {/* Visual "cut" effect */}
                <div className="absolute bottom-0 w-full flex justify-between px-2 gap-1 translate-y-1/2">
                   {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-gray-50 rounded-full shrink-0 border border-gray-100" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-6 w-full mt-10" style={{ backgroundColor: '#dc2626' }} />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Badge({ children, className, style }: { children: React.ReactNode, className?: string, style?: any }) {
  return (
    <span 
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

