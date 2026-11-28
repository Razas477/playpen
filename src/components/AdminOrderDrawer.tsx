import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Package,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { formatAed } from '../data/catalog';
import {
  formatOrderTimestamp,
  UAE_EMIRATES,
  updateOrderAdmin,
} from '../lib/storeDb';
import {
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  OrderTrackingEvent,
  PaymentStatus,
} from '../types/store';
import { ResilientImage } from './ResilientImage';

interface AdminOrderDrawerProps {
  order: OrderRecord | null;
  orderItems: OrderItemRecord[];
  trackingEvents: OrderTrackingEvent[];
  onClose: () => void;
}

const ALL_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'Pending on Delivery',
  'Paid on Delivery',
  'Refunded',
  'Cancelled',
];

export function AdminOrderDrawer({
  order,
  orderItems,
  trackingEvents,
  onClose,
}: AdminOrderDrawerProps) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('Order Confirmed');
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>('Pending on Delivery');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [emirate, setEmirate] = useState('Dubai');
  const [area, setArea] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [hubLocation, setHubLocation] = useState('Dubai Design District (d3)');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!order) return;
    setOrderStatus(order.orderStatus);
    setPaymentStatus(order.paymentStatus);
    setCourierName(order.courierName || 'PLAYPEN White-Glove UAE');
    setTrackingNumber(order.trackingNumber || '');
    setEstimatedDelivery(order.estimatedDelivery || '');
    setEmirate(order.emirate || 'Dubai');
    setArea(order.area || '');
    setDeliveryAddress(order.deliveryAddress || '');
    setCancellationReason(order.cancellationReason || '');
    setStatusNote('');
    setHubLocation('Dubai Design District (d3)');
    setFeedback('');
    setErrorMsg('');
  }, [order]);

  useEffect(() => {
    if (!order) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [order, onClose]);

  const itemsForOrder = useMemo(() => {
    if (!order) return [];
    const normalized = orderItems.filter((i) => i.orderId === order.id);
    if (normalized.length > 0) return normalized;
    return order.itemsSummary.map((s, idx) => ({
      id: `sum_${idx}`,
      orderId: order.id,
      userId: order.userId,
      productId: s.productId,
      productName: s.productName,
      productImage: s.productImage,
      selectedSize: s.selectedSize,
      selectedColor: s.selectedColor,
      quantity: s.quantity,
      unitPriceAed: s.unitPriceAed,
      lineTotalAed: s.lineTotalAed,
    }));
  }, [order, orderItems]);

  const eventsForOrder = useMemo(() => {
    if (!order) return [];
    return trackingEvents.filter((e) => e.orderId === order.id);
  }, [order, trackingEvents]);

  const isTerminal =
    order?.orderStatus === 'Delivered' || order?.orderStatus === 'Cancelled';

  const applyQuickAction = async (
    nextStatus: OrderStatus,
    defaultNote: string,
    defaultLoc: string
  ) => {
    if (!order || isTerminal) return;
    setSaving(true);
    setErrorMsg('');
    setFeedback('');
    try {
      const nextPay: PaymentStatus =
        nextStatus === 'Delivered'
          ? 'Paid on Delivery'
          : nextStatus === 'Cancelled'
          ? 'Cancelled'
          : paymentStatus;
      const nextTracking =
        trackingNumber.trim() ||
        order.trackingNumber ||
        `UAE-PP-${Date.now().toString().slice(-6)}`;
      const nextEst =
        nextStatus === 'Delivered'
          ? 'Delivered to Recipient'
          : estimatedDelivery;

      await updateOrderAdmin(order, {
        orderStatus: nextStatus,
        paymentStatus: nextPay,
        courierName: courierName || 'PLAYPEN White-Glove UAE',
        trackingNumber: nextTracking,
        estimatedDelivery: nextEst,
        emirate,
        area,
        deliveryAddress,
        cancellationReason:
          nextStatus === 'Cancelled'
            ? cancellationReason || 'Cancelled by PLAYPEN administration.'
            : '',
        note: statusNote.trim() || defaultNote,
        location: hubLocation.trim() || defaultLoc,
      });
      setOrderStatus(nextStatus);
      setPaymentStatus(nextPay);
      setTrackingNumber(nextTracking);
      setFeedback(`Order updated to "${nextStatus}" and synced to customer account.`);
      setStatusNote('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to save order update.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFullFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || isTerminal) return;
    if (orderStatus === 'Cancelled' && !cancellationReason.trim()) {
      setErrorMsg('Please provide a cancellation reason before cancelling an order.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setFeedback('');
    try {
      const autoNote =
        orderStatus === 'Cancelled'
          ? `Order cancelled: ${cancellationReason.trim()}`
          : statusNote.trim() ||
            `Order updated to ${orderStatus}${
              courierName ? ` via ${courierName}` : ''
            }.`;
      await updateOrderAdmin(order, {
        orderStatus,
        paymentStatus:
          orderStatus === 'Delivered'
            ? 'Paid on Delivery'
            : orderStatus === 'Cancelled'
            ? 'Cancelled'
            : paymentStatus,
        courierName,
        trackingNumber,
        estimatedDelivery,
        emirate,
        area,
        deliveryAddress,
        cancellationReason: orderStatus === 'Cancelled' ? cancellationReason : '',
        note: autoNote,
        location: hubLocation,
      });
      setFeedback('Order record and customer tracking timeline updated.');
      setStatusNote('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to save changes.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#142220]/40 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Order Details & Fulfillment"
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl bg-[#FAFAF8] border-l border-[#142220]/12 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#142220]/10 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#4A5B57] truncate">
                  Order Details · {formatOrderTimestamp(order.createdAt)}
                </p>
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#142220]">
                    Order #{order.orderNumber}
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-[#E6EAE4] text-xs font-semibold text-[#142220]">
                    {order.orderStatus}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close order panel"
                className="w-11 h-11 rounded-full border border-[#142220]/15 flex items-center justify-center text-[#142220] hover:bg-[#E6EAE4] shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6 pb-safe">
              {isTerminal && (
                <div className="rounded-2xl bg-[#E6EAE4] border border-[#142220]/15 px-4 py-3 text-xs text-[#3C4B48] flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-[#142220] shrink-0" />
                  <span>
                    This order is marked as <strong>{order.orderStatus}</strong> and can no longer be edited.
                  </span>
                </div>
              )}

              {feedback && (
                <div className="rounded-2xl bg-[#E5EFEA] border border-[#2B5B51]/20 px-4 py-3 text-xs text-[#1E4639] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{feedback}</span>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-2xl bg-[#F7E8E6] border border-[#993A32]/20 px-4 py-3 text-xs text-[#6F251F]">
                  {errorMsg}
                </div>
              )}

              {/* Quick Fulfillment Pipeline Buttons */}
              {!isTerminal && (
                <div className="rounded-2xl bg-[#F1F3EF] border border-[#142220]/10 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5B57]">
                    Quick Status Updates
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        applyQuickAction(
                          'Order Confirmed',
                          'Order confirmed by the PLAYPEN UAE team.',
                          'Dubai Design District (d3)'
                        )
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-full border border-[#142220]/20 bg-[#FAFAF8] text-xs font-semibold text-[#142220] hover:bg-[#E6EAE4] cursor-pointer disabled:opacity-50"
                    >
                      Confirm Order
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        applyQuickAction(
                          'Processing',
                          'Playpen frame and parts are passing safety inspection.',
                          'Al Quoz Warehouse, Dubai'
                        )
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-full border border-[#142220]/20 bg-[#FAFAF8] text-xs font-semibold text-[#142220] hover:bg-[#E6EAE4] cursor-pointer disabled:opacity-50"
                    >
                      Mark Processing
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        applyQuickAction(
                          'Packed',
                          'Packed securely and ready for UAE courier pickup.',
                          'Dubai Logistics Hub'
                        )
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-full border border-[#142220]/20 bg-[#FAFAF8] text-xs font-semibold text-[#142220] hover:bg-[#E6EAE4] cursor-pointer disabled:opacity-50"
                    >
                      Mark Packed
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        applyQuickAction(
                          'Shipped',
                          `Shipped with ${courierName || 'UAE Express Courier'}.`,
                          'UAE Courier Hub'
                        )
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer disabled:opacity-50"
                    >
                      Mark Shipped
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        applyQuickAction(
                          'Out for Delivery',
                          'Driver is on the way to the delivery address.',
                          order.emirate
                        )
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-full border border-[#142220]/20 bg-[#FAFAF8] text-xs font-semibold text-[#142220] hover:bg-[#E6EAE4] cursor-pointer disabled:opacity-50"
                    >
                      Out for Delivery
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        applyQuickAction(
                          'Delivered',
                          'Order delivered and Cash on Delivery collected.',
                          order.emirate
                        )
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-full bg-[#2B5B51] text-white text-xs font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                    >
                      Mark Delivered
                    </button>
                  </div>
                </div>
              )}

              {/* Customer & Delivery Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#F1F3EF] p-4 space-y-1.5 text-xs">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5B57]">
                    Customer Contact
                  </p>
                  <p className="text-sm font-semibold text-[#142220]">
                    {order.customerName}
                  </p>
                  <p className="text-[#3C4B48]">{order.customerEmail}</p>
                  <p className="text-[#3C4B48] tabular-nums">{order.customerPhone}</p>
                  <p className="text-[#4A5B57] pt-1">
                    Gift Wrap:{' '}
                    <span className="text-[#142220] font-semibold">
                      {order.giftWrap ? 'Luxury Gift Wrap' : 'Standard'}
                    </span>
                  </p>
                  {order.giftNote && (
                    <p className="italic text-[#3C4B48]">"{order.giftNote}"</p>
                  )}
                </div>

                <div className="rounded-2xl bg-[#F1F3EF] p-4 space-y-1.5 text-xs">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5B57] inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Delivery & Payment</span>
                  </p>
                  <p className="text-sm font-semibold text-[#142220]">
                    {order.emirate} · {order.area}
                  </p>
                  <p className="text-[#3C4B48] leading-relaxed">
                    {order.deliveryAddress}
                  </p>
                  <p className="text-[#4A5B57] pt-1">
                    {order.paymentMethod} ·{' '}
                    <span className="text-[#142220] font-semibold">
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>

              {/* Ordered Items */}
              <div className="rounded-2xl bg-[#F1F3EF] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5B57] inline-flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>Items Ordered ({order.itemCount})</span>
                  </p>
                  <span className="text-sm font-bold text-[#142220] tabular-nums">
                    Total {formatAed(order.totalAed)}
                  </span>
                </div>

                <div className="divide-y divide-[#142220]/10">
                  {itemsForOrder.map((item) => (
                    <div key={item.id} className="py-3 flex items-center gap-3">
                      <ResilientImage
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-12 rounded-xl object-cover bg-[#E6EAE4] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#142220] truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-[#4A5B57]">
                          Size: {item.selectedSize} · Color: {item.selectedColor} · Qty:{' '}
                          {item.quantity} × {formatAed(item.unitPriceAed)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#142220] tabular-nums shrink-0">
                        {formatAed(item.lineTotalAed)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#142220]/10 flex justify-between text-xs text-[#3C4B48]">
                  <span>
                    Subtotal {formatAed(order.subtotalAed)} + Delivery{' '}
                    {order.deliveryFeeAed === 0
                      ? 'Free'
                      : formatAed(order.deliveryFeeAed)}
                  </span>
                  <span className="font-semibold text-[#142220] tabular-nums">
                    {formatAed(order.totalAed)}
                  </span>
                </div>
              </div>

              {/* Courier, Delivery Info & Status Update Form */}
              <form
                onSubmit={handleFullFormSubmit}
                className="rounded-2xl bg-[#F1F3EF] border border-[#142220]/10 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5B57] inline-flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Courier, Status & Delivery Details</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Order Status
                    </label>
                    <select
                      disabled={isTerminal || saving}
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs font-medium text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Payment Status
                    </label>
                    <select
                      disabled={isTerminal || saving}
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs font-medium text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                    >
                      {PAYMENT_STATUSES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Courier Name
                    </label>
                    <input
                      disabled={isTerminal || saving}
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="PLAYPEN Express UAE"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Tracking Number
                    </label>
                    <input
                      disabled={isTerminal || saving}
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="UAE-PP-000123"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs font-mono text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Estimated Delivery Window
                    </label>
                    <input
                      disabled={isTerminal || saving}
                      type="text"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Emirate
                    </label>
                    <select
                      disabled={isTerminal || saving}
                      value={emirate}
                      onChange={(e) => setEmirate(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                    >
                      {UAE_EMIRATES.map((em) => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Area / Community
                    </label>
                    <input
                      disabled={isTerminal || saving}
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Current Hub / Location
                    </label>
                    <input
                      disabled={isTerminal || saving}
                      type="text"
                      value={hubLocation}
                      onChange={(e) => setHubLocation(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Full Delivery Street Address
                  </label>
                  <input
                    disabled={isTerminal || saving}
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                  />
                </div>

                {orderStatus === 'Cancelled' && (
                  <div>
                    <label className="block text-xs text-[#993A32] font-semibold mb-1">
                      Cancellation Reason *
                    </label>
                    <input
                      required
                      disabled={isTerminal || saving}
                      type="text"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Customer requested cancellation / Item out of stock..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#993A32]/30 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Customer Tracking Note
                  </label>
                  <input
                    disabled={isTerminal || saving}
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional note shown on the customer's tracking page..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs text-[#142220] border border-[#142220]/10 focus:outline-none disabled:opacity-60"
                  />
                </div>

                {!isTerminal && (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {saving ? 'Saving Update...' : 'Save & Update Tracking'}
                    </button>
                    {orderStatus !== 'Cancelled' && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setOrderStatus('Cancelled')}
                        className="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-full border border-[#993A32]/30 text-[#993A32] text-xs font-semibold hover:bg-[#F7E8E6] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                )}
              </form>

              {/* Complete Order Tracking History */}
              <div className="rounded-2xl bg-[#F1F3EF] p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5B57] inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Order Status History</span>
                </p>
                {order.cancellationReason && (
                  <p className="text-xs text-[#993A32] bg-[#F7E8E6] px-3 py-2 rounded-xl">
                    Cancellation Reason: {order.cancellationReason}
                  </p>
                )}
                {eventsForOrder.length === 0 ? (
                  <p className="text-xs text-[#4A5B57]">
                    No tracking updates recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {eventsForOrder.map((ev) => (
                      <div
                        key={ev.id}
                        className="border-l-2 border-[#142220]/25 pl-3.5 py-0.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#142220]">
                            {ev.status}
                          </span>
                          <span className="text-xs text-[#4A5B57]">
                            {formatOrderTimestamp(ev.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[#3C4B48]">{ev.note}</p>
                        {(ev.location || ev.courierName || ev.trackingNumber) && (
                          <p className="mt-0.5 text-xs text-[#4A5B57]">
                            {[ev.location, ev.courierName, ev.trackingNumber]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
