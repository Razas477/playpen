import { useEffect } from 'react';
import { Lock, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { computeDeliveryFee } from '../lib/storeDb';
import { CartItem, StoreSettings } from '../types/store';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  user: User | null;
  storeSettings?: StoreSettings;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  user,
  storeSettings,
  onProceedToCheckout,
}: CartDrawerProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceAed * item.quantity,
    0
  );
  const freeShippingThreshold = storeSettings?.freeShippingThresholdAed ?? 750;
  const shippingFee = computeDeliveryFee(subtotal, storeSettings);
  const total = subtotal + shippingFee;
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#142220]/35 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Shopping Bag"
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#FAFAF8] border-l border-[#142220]/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#142220]/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#2B5B51]">
                  PLAYPEN · Fast UAE Delivery
                </p>
                <h2 className="font-serif text-2xl font-bold text-[#142220]">
                  Your Shopping Cart
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shopping cart"
                className="w-11 h-11 rounded-full border border-[#142220]/15 flex items-center justify-center text-[#142220] hover:bg-[#E6EAE4] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#E6EAE4] flex items-center justify-center text-[#4A5B57]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 font-serif text-2xl font-bold text-[#142220]">
                    Your Cart is Empty
                  </h3>
                  <p className="mt-2 text-sm text-[#4A5B57] max-w-xs mx-auto leading-relaxed">
                    Browse our wooden, foldable, breathable mesh, and modular playpens to find the
                    right fit for your home.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 min-h-[48px] px-7 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Free UAE Delivery Bar */}
                  <div className={`rounded-2xl p-3.5 text-xs sm:text-[13px] ${remainingForFree === 0 ? 'bg-[#E5EFEA] text-[#1E4639]' : 'bg-[#F1F3EF] text-[#3C4B48]'}`}>
                    {remainingForFree === 0 ? (
                      <span className="font-semibold text-[#1E4639]">
                        Free UAE delivery unlocked!
                      </span>
                    ) : (
                      <span>
                        Add <strong className="text-[#142220] tabular-nums">AED {remainingForFree}</strong> more for free UAE delivery.
                      </span>
                    )}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-[#D7DDD5] overflow-hidden">
                      <div
                        className="h-full bg-[#2B5B51] transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-[#142220]/10">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 24 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="py-4 flex gap-3.5"
                        >
                          <ResilientImage
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-20 h-20 rounded-xl object-cover bg-[#E6EAE4] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-[#142220] leading-snug">
                                {item.product.name}
                              </h3>
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.id)}
                                aria-label={`Remove ${item.product.name}`}
                                className="text-[#4A5B57] hover:text-[#142220] w-9 h-9 -mr-1.5 -mt-1.5 flex items-center justify-center cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="mt-0.5 text-xs text-[#4A5B57]">
                              {item.size} · {item.color}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="inline-flex items-center rounded-full border border-[#142220]/15 bg-[#F1F3EF] p-0.5">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.id, -1)}
                                  aria-label="Decrease quantity"
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#142220] hover:bg-[#D7DDD5] cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2.5 text-xs font-semibold tabular-nums text-[#142220]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.id, 1)}
                                  aria-label="Increase quantity"
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#142220] hover:bg-[#D7DDD5] cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-sm font-bold text-[#142220] tabular-nums">
                                AED {(item.product.priceAed * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 sm:px-6 py-4 sm:py-5 pb-safe border-t border-[#142220]/10 bg-[#F1F3EF]/60 space-y-3">
                <div className="space-y-1.5 text-xs sm:text-[13px] text-[#3C4B48]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-semibold text-[#142220]">
                      AED {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>UAE Delivery</span>
                    <span className="tabular-nums font-semibold text-[#142220]">
                      {shippingFee === 0 ? 'Free' : `AED ${shippingFee}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#142220]/10 flex justify-between text-base font-bold text-[#142220]">
                    <span>Total (Includes VAT)</span>
                    <span className="tabular-nums">AED {total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full min-h-[48px] py-3.5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {!user && <Lock className="w-4 h-4" aria-hidden="true" />}
                  <span>
                    {user
                      ? 'Proceed to Checkout'
                      : 'Sign In to Checkout'}
                  </span>
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
