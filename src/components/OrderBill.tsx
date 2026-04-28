import { IndianRupee, Printer, X, Download, Loader2 } from "lucide-react";
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
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
              body { 
                font-family: 'Inter', sans-serif; 
                background: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
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
              el.style.color = '#374151'; 
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
    alert("Bill downloaded! You can now upload this PDF to your Google Drive for permanent storage.");
  };

  const subtotal = order.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  const deliveryFee = order.deliveryFee || 20;
  const total = order.total || (subtotal + deliveryFee);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`bg-white w-full ${billFormat === 'a4' ? 'max-w-lg' : 'max-w-[320px]'} rounded-[2.5rem] shadow-2xl relative overflow-hidden print:shadow-none print:rounded-none print:m-0 transition-all duration-500`}
        >
          {/* Format Selector (Hidden in Print) */}
          <div className="absolute top-6 left-6 flex bg-gray-100 p-1 rounded-xl z-10 print:hidden">
            <button 
              onClick={() => setBillFormat('a4')}
              className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${billFormat === 'a4' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}
            >
              A4 Invoice
            </button>
            <button 
              onClick={() => setBillFormat('receipt')}
              className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${billFormat === 'receipt' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}
            >
              Bill Size
            </button>
          </div>

          {/* Header Controls (Hidden in Print) */}
          <div className="absolute top-6 right-6 flex gap-2 print:hidden z-10">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={saveToDrive}
              disabled={isGenerating}
              className="rounded-full bg-white/80 backdrop-blur-md border-gray-100 hover:bg-gray-50 h-10 w-10 shadow-sm"
              title="Save to Drive"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin text-red-600" /> : <div className="w-5 h-5 flex items-center justify-center"><img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-4 h-4" alt="Drive" /></div>}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="rounded-full bg-white/80 backdrop-blur-md border-gray-100 hover:bg-gray-50 h-10 w-10 shadow-sm"
              title="Download PDF"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin text-red-600" /> : <Download className="w-5 h-5 text-gray-600" />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePrint}
              className="rounded-full bg-white/80 backdrop-blur-md border-gray-100 hover:bg-gray-50 h-10 w-10 shadow-sm"
              title="Print Bill"
            >
              <Printer className="w-5 h-5 text-gray-600" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onClose}
              className="rounded-full bg-white/80 backdrop-blur-md border-gray-100 hover:bg-gray-50 h-10 w-10 shadow-sm"
            >
              <X className="w-5 h-5 text-gray-600" />
            </Button>
          </div>

          <div ref={billRef} className="p-8 md:p-10 print:p-0 bg-white" style={{ backgroundColor: '#ffffff' }}>
            {/* JMB MART BRANDING */}
            <div className="text-center space-y-2 mb-10">
              <div 
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-2xl"
                style={{ backgroundColor: '#dc2626' }}
              >
                <span className="font-black text-xl tracking-tighter">JMB</span>
                <span className="font-black text-xl tracking-tighter opacity-80">MART</span>
              </div>
              <h1 className="text-sm font-black tracking-[0.4em] uppercase mt-2" style={{ color: '#dc2626' }}>Jai Maa Bhavani</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest" style={{ color: '#9ca3af' }}>Premium Quality • Express Delivery</p>
            </div>

            {/* BILL INFO */}
            <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-dashed border-gray-100" style={{ borderBottomColor: '#f3f4f6' }}>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9ca3af' }}>Order Details</p>
                <p className="text-sm font-black tracking-tight" style={{ color: '#111827' }}>Invoice #{order.id?.slice(-8).toUpperCase()}</p>
                <p className="text-xs font-bold" style={{ color: '#6b7280' }}>{order.createdAt?.toDate().toLocaleString()}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9ca3af' }}>Payment Method</p>
                <p className="text-sm font-black tracking-tight" style={{ color: '#111827' }}>Cash on Delivery</p>
                <Badge className="font-black text-[9px] uppercase tracking-widest px-2 mt-1" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: 'none' }}>Confirmed</Badge>
              </div>
            </div>

            {/* CUSTOMER INFO */}
            <div className="mb-8 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9ca3af' }}>Delivery To</p>
              <p className="text-sm font-black" style={{ color: '#111827' }}>{order.address?.name}</p>
              <p className="text-xs font-bold leading-relaxed max-w-[250px]" style={{ color: '#6b7280' }}>
                {order.address?.houseNumber}, {order.address?.pincode}
              </p>
              <p className="text-xs font-black mt-1 whitespace-nowrap" style={{ color: '#dc2626' }}>{order.address?.phone}</p>
            </div>

            {/* ITEMS TABLE */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2" style={{ color: '#9ca3af' }}>
                <span>Item Description</span>
                <span>Subtotal</span>
              </div>
              <div className="space-y-4">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-start gap-4 px-2">
                    <div className="flex-1">
                      <p className="text-sm font-black tracking-tight leading-none" style={{ color: '#111827' }}>{item.name}</p>
                      <p className="text-[10px] font-bold mt-1 uppercase tracking-tighter" style={{ color: '#9ca3af' }}>
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-black tracking-tighter" style={{ color: '#111827' }}>₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TOTALS */}
            <div className="rounded-[2rem] p-6 space-y-3" style={{ backgroundColor: '#f9fafb' }}>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold" style={{ color: '#6b7280' }}>Subtotal</span>
                <span className="font-black" style={{ color: '#111827' }}>₹{subtotal}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold" style={{ color: '#6b7280' }}>Delivery Fee</span>
                <span className="font-black" style={{ color: '#111827' }}>₹{deliveryFee}</span>
              </div>
              <div className="pt-3 mt-3 border-t-2 border-white flex justify-between items-center" style={{ borderTopColor: '#ffffff' }}>
                <span className="text-lg font-black uppercase tracking-tighter italic" style={{ color: '#111827' }}>Total Bill</span>
                <div className="text-right">
                  <div className="flex items-center gap-1" style={{ color: '#dc2626' }}>
                    <span className="text-2xl font-black tracking-tighter leading-none">₹{total}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">INR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-10 text-center space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#d1d5db' }}>Thank you for shopping at JMB Mart!</p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=JMB-MART-BILL" className="w-8 h-8 opacity-20" alt="QR" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#9ca3af' }}>Digital Bill</p>
                  <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>Scan for e-receipt</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Branding Bar */}
          <div className="h-2 w-full" style={{ backgroundColor: '#dc2626' }} />
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
