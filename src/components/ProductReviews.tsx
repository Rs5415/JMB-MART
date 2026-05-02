import { useState, useEffect } from "react";
import { db, auth } from "@/src/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, MessageSquare, Trash2, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review)));
      setIsLoading(false);
    }, (err) => {
      console.error("Reviews listener error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        productId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || "Anonymous",
        rating,
        comment: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment("");
      setRating(5);
    } catch (error) {
      console.error("Error adding review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Delete your review?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="space-y-1">
        <h3 className="text-xl font-black text-gray-900 tracking-tight">{productName}</h3>
        <div className="flex items-center gap-2">
          {averageRating ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3 h-3 ${Number(averageRating) >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs font-black text-gray-900">{averageRating}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">({reviews.length} reviews)</span>
            </div>
          ) : (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No reviews yet</p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-4 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <MessageSquare className="w-8 h-8 text-gray-100 mx-auto" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={review.id} 
                  className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-2.5 h-2.5 ${review.rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-gray-900">{review.userName}</span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                      {review.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">{review.comment}</p>
                  
                  {auth.currentUser?.uid === review.userId && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 hover:text-red-600 rounded-lg hover:bg-white shadow-sm"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {auth.currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white pt-2">
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rate this product</Label>
            <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl w-fit border border-gray-100">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`p-1 transition-all ${rating >= s ? 'scale-110' : 'opacity-40 grayscale'}`}
                >
                  <Star className={`w-5 h-5 ${rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Input 
              placeholder="Write your experience..." 
              className="rounded-2xl border-gray-100 bg-gray-50/50 pr-12 focus:bg-white h-14 font-medium shadow-sm transition-all"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-2 top-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 transition-all active:scale-90"
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <Star className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xs font-bold text-red-800 uppercase tracking-tight">Login to leave a review</p>
        </div>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={className}>{children}</label>;
}
