import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Package,
  Truck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatAed } from '../data/catalog';
import { formatOrderTimestamp } from '../lib/storeDb';
import { OrderRecord, PageRoute } from '../types/store';
import { ResilientImage } from './ResilientImage';

interface OrderConfirmationPageProps {
  order: OrderRecord | null;
  onTrackOrder: (orderId: string) => void;
  onNavigate: (route: PageRoute) => void;
}

export function OrderConfirmationPage({
  order,
  onTrackOrder,
  onNavigate,
}: OrderConfirmationPageProps) {
  if (!order) {
    return (
      <section className="py-16 lg:py-24 bg-[#FAFAF8] text-center">
        <div className="max-w-lg mx-auto px-5 space-y-4">
          <h1 className="font-serif font-bold text-3xl text-[#142220]">
            No Recent Order Selected
          </h1>
          <button
            type="button"
            onClick={() => onNavigate('account')}
            className="px-6 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold cursor-pointer"
          >
            View My Orders
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-12 lg:py-20 bg-[#FAFAF8] text-[#142220]">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-11 shadow-sm"
        >
          <div className="text-center pb-7 sm:pb-8 border-b border-[#142220]/10">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#142220] text-[#FAFAF8] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
              Order Confirmed
            </p>
            <h1 className="mt-2 font-serif text-2xl sm:text-4xl font-bold text-[#142220]">
              Thank You, {order.customerName}
            </h1>
            <p className="mt-3 text-sm sm:text-[15px] text-[#3C4B48] max-w-lg mx-auto leading-relaxed">
              Your order number is{' '}
              <strong className="font-bold text-[#142220] tabular-nums">
                {order.orderNumber}
              </strong>
              . Our UAE team is preparing your playpen for delivery.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onTrackOrder(order.id)}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Track Order</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-[#142220]/20 text-sm font-semibold text-[#142220] hover:bg-[#E6EAE4] transition-colors cursor-pointer"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Delivery, Tracking & Payment Info */}
          <div className="py-7 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b border-[#142220]/10 text-xs sm:text-[13px]">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#142220]">
                <MapPin className="w-3.5 h-3.5 text-[#2B5B51]" />
                <span>Delivery Address</span>
              </span>
              <p className="font-semibold text-[#142220]">{order.customerName}</p>
              <p className="text-[#3C4B48] leading-relaxed">{order.deliveryAddress}</p>
              <p className="text-[#4A5B57] tabular-nums">{order.customerPhone}</p>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#142220]">
                <Truck className="w-3.5 h-3.5 text-[#2B5B51]" />
                <span>Estimated Delivery</span>
              </span>
              <p className="font-semibold text-[#142220]">{order.estimatedDelivery}</p>
              <p className="text-[#3C4B48]">
                Status: <strong className="text-[#142220]">{order.orderStatus}</strong>
              </p>
              {order.trackingNumber && (
                <p className="text-[#4A5B57] tabular-nums">
                  Tracking #: {order.trackingNumber}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#142220] block">
                Order &amp; Payment
              </span>
              <p className="font-semibold text-[#142220] tabular-nums">
                {order.orderNumber}
              </p>
              <p className="text-[#3C4B48]">
                {order.paymentMethod} · {order.paymentStatus}
              </p>
              <p className="text-[#4A5B57]">
                Placed: {formatOrderTimestamp(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Ordered Items Summary */}
          <div className="pt-7">
            <h2 className="font-serif text-2xl font-bold text-[#142220] mb-4">
              Items Ordered
            </h2>
            <div className="divide-y divide-[#142220]/10">
              {order.itemsSummary.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="py-3.5 flex items-center gap-4"
                >
                  <ResilientImage
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-12 rounded-xl object-cover bg-[#D7DDD5] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#142220] truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-[#4A5B57]">
                      Size: {item.selectedSize} · Color: {item.selectedColor} · Qty:{' '}
                      <span className="tabular-nums">{item.quantity}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#142220] tabular-nums">
                      {formatAed(item.lineTotalAed)}
                    </p>
                    <p className="text-xs text-[#4A5B57] tabular-nums">
                      {formatAed(item.unitPriceAed)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#142220]/12 space-y-1.5 text-xs sm:text-sm text-[#3C4B48]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-[#142220]">
                  {formatAed(order.subtotalAed)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>UAE Delivery</span>
                <span className="tabular-nums font-semibold text-[#142220]">
                  {order.deliveryFeeAed === 0 ? 'Free' : formatAed(order.deliveryFeeAed)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#142220]/10 flex justify-between text-base font-bold text-[#142220]">
                <span>Total Amount</span>
                <span className="tabular-nums">{formatAed(order.totalAed)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
