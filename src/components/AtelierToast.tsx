import { Check, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Product } from '../types/store';
import { ResilientImage } from './ResilientImage';

export interface ToastBagNotice {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

interface AtelierToastProps {
  notice: ToastBagNotice | null;
  onDismiss: () => void;
  onOpenBag: () => void;
  hasStickyBottomBar?: boolean;
}

export function AtelierToast({
  notice,
  onDismiss,
  onOpenBag,
  hasStickyBottomBar = false,
}: AtelierToastProps) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className={`fixed ${
            hasStickyBottomBar ? 'bottom-20 lg:bottom-5' : 'bottom-4 sm:bottom-5'
          } right-4 sm:right-5 z-50 w-[calc(100%-2rem)] sm:w-[calc(100%-2.5rem)] max-w-sm rounded-2xl bg-[#142220] text-[#FAFAF8] p-3.5 sm:p-4 shadow-2xl border border-[#FAFAF8]/12 flex items-center gap-3`}
        >
          <div className="w-16 h-12 rounded-xl overflow-hidden bg-[#1F3532] shrink-0">
            <ResilientImage
              src={notice.product.image}
              alt={notice.product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-[#D4B483] font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Added to Cart</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold truncate mt-0.5">
              {notice.quantity > 1 ? `${notice.quantity} × ` : ''}
              {notice.product.name}
            </p>
            <p className="text-xs text-[#C6D2CD] truncate">
              {notice.size} · {notice.color}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onDismiss();
                onOpenBag();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FAFAF8] text-[#142220] text-xs font-semibold hover:bg-[#E6EAE4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Cart</span>
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#B4C2BC] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
