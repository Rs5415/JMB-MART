import { IndianRupee, Printer, X, Download, Loader2, Scissors, Calendar, Hash, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { BrandLogo } from "@/src/components/BrandLogo";

interface OrderBillProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderBill({ order, isOpen, onClose }: OrderBillProps) {
  const billRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [billFormat, setBillFormat] = useState<'a4' | 'receipt'>('a4');
  const [isPaid, setIsPaid] = useState(false);

  // Sync isPaid state whenever order changes or modal opens
  useEffect(() => {
    if (order) {
      setIsPaid(order.paymentStatus === 'paid');
    }
  }, [order?.id, isOpen]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    if (!billRef.current) return;
    
    // Create a hidden iframe for printing to avoid printing the entire page/modal backdrop
    const content = billRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>JMB Mart - Sales Invoice #${order.id?.slice(-8).toUpperCase()}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
              body { 
                font-family: 'Inter', sans-serif; 
                background: white;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .mono { font-family: 'JetBrains Mono', monospace; }
              @media print {
                @page { 
                  margin: 0; 
                  size: ${billFormat === 'receipt' ? '80mm auto' : 'A4 portrait'};
                }
                body { margin: 0; padding: 0; }
                .print-container { 
                  padding: ${billFormat === 'receipt' ? '0' : '20px'}; 
                  max-width: ${billFormat === 'receipt' ? '100%' : '800px'};
                  margin: 0 auto;
                }
                /* Thermal printer optimizations */
                ${billFormat === 'receipt' ? `
                  .p-10 { padding: 12px !important; }
                  .mb-12 { margin-bottom: 20px !important; }
                  .text-2xl { font-size: 18px !important; line-height: 1.2 !important; }
                  .text-lg { font-size: 14px !important; }
                  .text-sm { font-size: 11px !important; }
                  .text-xs { font-size: 9px !important; }
                  .rounded-[2.5rem] { border-radius: 0 !important; }
                  .shadow-2xl { box-shadow: none !important; }
                  .bg-gray-900 { background: white !important; color: black !important; border: 1px solid #000 !important; }
                  .text-white { color: black !important; }
                  .text-white\/40 { color: #666 !important; }
                ` : ''}
              }
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
                }, 700);
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
            
            // Helper to clean oklab/oklch from any computed style string
            const hasOkl = (val: string) => val.includes('oklch') || val.includes('oklab') || val.includes('okl');

            // Fix text colors
            if (hasOkl(el.style.color) || hasOkl(style.color)) {
              el.style.color = '#111827'; 
            }
            
            // Fix background colors
            if (hasOkl(el.style.backgroundColor) || hasOkl(style.backgroundColor)) {
              if (el.className.includes('bg-red-600')) el.style.backgroundColor = '#dc2626';
              else if (el.className.includes('bg-green-600')) el.style.backgroundColor = '#16a34a';
              else if (el.className.includes('bg-gray-50')) el.style.backgroundColor = '#f9fafb';
              else if (el.className.includes('bg-white')) el.style.backgroundColor = '#ffffff';
              else if (el.className.includes('bg-gray-900')) el.style.backgroundColor = '#111827';
              else el.style.backgroundColor = 'transparent';
            }

            // Fix border colors
            if (hasOkl(el.style.borderColor) || hasOkl(style.borderColor)) {
              el.style.borderColor = '#e5e7eb';
            }

            // Fix Box Shadows - these often cause the oklab parsing error
            if (hasOkl(el.style.boxShadow) || hasOkl(style.boxShadow)) {
              el.style.boxShadow = 'none';
            }

            // Fix Fill/Stroke for SVGs
            if (el instanceof SVGElement || el.tagName === 'svg' || el.tagName === 'path') {
              const fill = style.getPropertyValue('fill');
              const stroke = style.getPropertyValue('stroke');
              if (hasOkl(fill)) el.setAttribute('fill', 'currentColor');
              if (hasOkl(stroke)) el.setAttribute('stroke', 'currentColor');
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
          {/* Header (Simplified) */}
          <div className="flex items-center justify-between bg-white border-b border-gray-100 px-6 py-4 z-20 print:hidden sticky top-0 backdrop-blur-md bg-white/90">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Invoice Preview</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="rounded-full hover:bg-red-50 h-8 w-8 text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-[70vh] scroll-smooth">
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
                <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-red-100 mb-6 relative overflow-hidden border-2 border-red-50">
                  <div className="relative flex flex-col items-center justify-center">
                    <BrandLogo className="w-16 h-16 mb-4" />
                    <div className="flex flex-col items-center">
                      <div className="bg-red-600 text-white font-black text-2xl px-3 py-1.5 rounded-xl mb-1 shadow-md w-fit leading-none">JMB</div>
                      <div className="text-red-600 font-black text-lg tracking-tighter leading-none mb-1">MART</div>
                      <p className="text-[8px] font-black tracking-[0.3em] text-red-600/60 uppercase">Jai Maa Bhavani</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Tax Sales Invoice</span>
                </div>
              </div>

              {/* PAID/UNPAID STAMP (Overlays Content) */}
              <div className="absolute top-40 right-10 pointer-events-none z-10 opacity-20 rotate-[-25deg]">
                {isPaid ? (
                  <div className="border-8 border-green-600 text-green-600 px-8 py-4 rounded-3xl text-6xl font-black uppercase tracking-tighter shadow-2xl">PAID</div>
                ) : (
                  <div className="border-8 border-red-600 text-red-600 px-8 py-4 rounded-3xl text-6xl font-black uppercase tracking-tighter shadow-2xl uppercase">UNPAID</div>
                )}
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
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Payment Status</span>
                  </div>
                  <p className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-red-900'}`}>{isPaid ? 'PAID' : 'PENDING'}</p>
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
          </div>

          {/* Bottom Footer Controls (Always Visible) */}
          <div className="bg-gray-900 border-t border-white/10 p-6 z-20 print:hidden">
            <div className="flex flex-col gap-6">
              {/* Top Row: Format & Status Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setBillFormat('a4')}
                    className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${billFormat === 'a4' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    A4 Paper
                  </button>
                  <button 
                    onClick={() => setBillFormat('receipt')}
                    className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${billFormat === 'receipt' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    POS/Bill
                  </button>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setIsPaid(true)}
                    className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${isPaid ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    Paid
                  </button>
                  <button 
                    onClick={() => setIsPaid(false)}
                    className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${!isPaid ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  onClick={saveToDrive}
                  disabled={isGenerating}
                  className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 h-12 gap-2 font-black text-[10px] text-white uppercase tracking-widest"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-3.5 h-3.5" alt="Drive" />
                  <span className="hidden xs:inline">Drive</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 h-12 gap-2 font-black text-[10px] text-white uppercase tracking-widest"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span className="hidden xs:inline">PDF</span>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handlePrint}
                  className="rounded-xl bg-red-600 border-red-600 hover:bg-red-700 h-12 gap-2 font-black text-[10px] text-white uppercase tracking-widest shadow-xl shadow-red-900/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Print</span>
                </Button>
              </div>
            </div>
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

