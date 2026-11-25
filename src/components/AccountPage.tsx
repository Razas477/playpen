import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  LogOut,
  MapPin,
  Package,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Truck,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { PRODUCTS } from '../data/catalog';
import {
  advanceOrderStatusAdmin,
  cancelCustomerOrder,
  formatOrderTimestamp,
  ORDER_TIMELINE_STEPS,
  removeCustomerAddress,
  saveCustomerAddress,
  seedFullCatalogToFirestore,
  UAE_EMIRATES,
  updateUserSettings,
} from '../lib/storeDb';
import {
  AccountTab,
  CustomerAddress,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  OrderTrackingEvent,
  PageRoute,
  Product,
  UserProfile,
} from '../types/store';
import { ProductCard } from './ProductCard';
import { ResilientImage } from './ResilientImage';

interface AccountPageProps {
  user: User | null;
  profile: UserProfile | null;
  isAdminVerified?: boolean;
  liveProducts?: Product[];
  orders: OrderRecord[];
  orderItems: OrderItemRecord[];
  trackingEvents: OrderTrackingEvent[];
  addresses: CustomerAddress[];
  wishlist: string[];
  activeTab: AccountTab;
  focusedOrderId: string | null;
  onTabChange: (tab: AccountTab) => void;
  onFocusOrder: (orderId: string | null) => void;
  onRequireSignIn: () => void;
  onSignOut: () => void;
  onOpenAdmin?: () => void;
  onToggleWishlist: (id: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onQuickAdd: (product: Product, size: string, color: string) => void;
  onNavigate: (route: PageRoute) => void;
}

export function AccountPage({
  user,
  profile,
  isAdminVerified = false,
  liveProducts = PRODUCTS,
  orders,
  orderItems,
  trackingEvents,
  addresses,
  wishlist,
  activeTab,
  focusedOrderId,
  onTabChange,
  onFocusOrder,
  onRequireSignIn,
  onSignOut,
  onOpenAdmin,
  onToggleWishlist,
  onSelectProduct,
  onQuickView,
  onQuickAdd,
  onNavigate,
}: AccountPageProps) {
  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrEmirate, setAddrEmirate] = useState('Dubai');
  const [addrArea, setAddrArea] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrDefault, setAddrDefault] = useState(true);
  const [savingAddr, setSavingAddr] = useState(false);

  // Settings form state
  const [settingsName, setSettingsName] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsEmirate, setSettingsEmirate] = useState('Dubai');
  const [settingsMarketing, setSettingsMarketing] = useState(true);
  const [settingsSms, setSettingsSms] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [catalogSyncMsg, setCatalogSyncMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setSettingsName(profile.displayName || user?.displayName || '');
      setSettingsPhone(profile.phone || '');
      setSettingsEmirate(profile.preferredEmirate || 'Dubai');
      setSettingsMarketing(Boolean(profile.marketingOptIn));
      setSettingsSms(Boolean(profile.smsUpdates));
    } else if (user) {
      setSettingsName(user.displayName || '');
    }
  }, [profile, user]);

  useEffect(() => {
    if (user && !addrRecipient) {
      setAddrRecipient(profile?.displayName || user.displayName || '');
    }
  }, [user, profile, addrRecipient]);

  const trackedOrder = useMemo(() => {
    if (focusedOrderId) {
      const match = orders.find((o) => o.id === focusedOrderId);
      if (match) return match;
    }
    return orders[0] || null;
  }, [orders, focusedOrderId]);

  const trackedOrderItems = useMemo(() => {
    if (!trackedOrder) return [];
    const normalized = orderItems.filter((i) => i.orderId === trackedOrder.id);
    if (normalized.length > 0) return normalized;
    return trackedOrder.itemsSummary.map((s, idx) => ({
      id: `${trackedOrder.id}_summary_${idx}`,
      orderId: trackedOrder.id,
      userId: trackedOrder.userId,
      ...s,
    }));
  }, [trackedOrder, orderItems]);

  const trackedOrderEvents = useMemo(() => {
    if (!trackedOrder) return [];
    return trackingEvents.filter((e) => e.orderId === trackedOrder.id);
  }, [trackedOrder, trackingEvents]);

  const wishlistedProducts = useMemo(
    () => liveProducts.filter((p) => wishlist.includes(p.id)),
    [liveProducts, wishlist]
  );

  const isStoreAdmin = Boolean(isAdminVerified);

  if (!user) {
    return (
      <section className="py-16 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-xl mx-auto px-5 sm:px-8 text-center">
          <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-8 sm:p-12 space-y-5 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#E6EAE4] flex items-center justify-center text-[#142220]">
              <UserIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
              PLAYPEN · My Account
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#142220]">
              Sign In to Your Account
            </h1>
            <p className="text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
              Sign in with Google to view your past orders, track deliveries, manage saved addresses,
              and access your wishlist.
            </p>
            <button
              type="button"
              onClick={onRequireSignIn}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
            >
              Continue with Google
            </button>
          </div>
        </div>
      </section>
    );
  }

  const tabs: { id: AccountTab; label: string; icon: typeof UserIcon }[] = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
    { id: 'tracking', label: 'Track Order', icon: Truck },
    { id: 'addresses', label: `Addresses (${addresses.length})`, icon: MapPin },
    { id: 'wishlist', label: `Wishlist (${wishlistedProducts.length})`, icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || savingAddr) return;
    setSavingAddr(true);
    try {
      await saveCustomerAddress(
        user.uid,
        {
          label: addrLabel,
          recipientName: addrRecipient,
          phone: addrPhone,
          emirate: addrEmirate,
          area: addrArea,
          streetAddress: addrStreet,
          isDefault: addrDefault,
        },
        addresses
      );
      setAddrArea('');
      setAddrStreet('');
      setShowAddressForm(false);
    } finally {
      setSavingAddr(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || savingSettings) return;
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      await updateUserSettings(user.uid, {
        displayName: settingsName,
        phone: settingsPhone,
        preferredEmirate: settingsEmirate,
        marketingOptIn: settingsMarketing,
        smsUpdates: settingsSms,
      });
      setSettingsSaved(true);
      window.setTimeout(() => setSettingsSaved(false), 3000);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAdvanceStatus = async (order: OrderRecord) => {
    const currentIdx = ORDER_TIMELINE_STEPS.indexOf(order.orderStatus);
    if (currentIdx === -1 || currentIdx >= ORDER_TIMELINE_STEPS.length - 1) return;
    const nextStatus = ORDER_TIMELINE_STEPS[currentIdx + 1];
    const notesMap: Record<OrderStatus, { note: string; location: string }> = {
      'Order Placed': { note: 'Playpen order logged in PLAYPEN UAE.', location: 'Dubai Design District' },
      'Order Confirmed': { note: 'Cash on Delivery reservation verified.', location: 'Dubai Design District' },
      Processing: { note: 'Playpen frame & hardware inspected to EN 12227 standards.', location: 'Al Quoz Showroom Depot' },
      Packed: { note: 'Cushioned inside protective architectural transit crating.', location: 'Dubai Packaging Hub' },
      Shipped: { note: 'Dispatched with PLAYPEN White-Glove UAE delivery team.', location: 'Dubai Logistics Hub' },
      'Out for Delivery': { note: `Delivery team en route to ${order.area}, ${order.emirate}.`, location: `${order.emirate} Courier Fleet` },
      Delivered: { note: 'Delivered to residence and Cash on Delivery settled.', location: `${order.area}, ${order.emirate}` },
      Cancelled: { note: 'Order cancelled.', location: 'PLAYPEN UAE Concierge' },
    };
    const info = notesMap[nextStatus];
    await advanceOrderStatusAdmin(order, nextStatus, info.note, info.location);
  };

  const activeStepIdx = trackedOrder
    ? ORDER_TIMELINE_STEPS.indexOf(trackedOrder.orderStatus)
    : -1;

  return (
    <section className="py-8 sm:py-10 lg:py-16 bg-[#FAFAF8] text-[#142220]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Account Header */}
        <div className="pb-8 border-b border-[#142220]/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={profile?.displayName || user.displayName || 'Customer'}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border border-[#142220]/15 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#142220] text-[#FAFAF8] flex items-center justify-center font-serif text-xl shrink-0">
                {(profile?.displayName || user.displayName || 'M').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#2B5B51]">
                Your Account
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#142220] truncate">
                {profile?.displayName || user.displayName || 'PLAYPEN Customer'}
              </h1>
              <p className="text-xs text-[#4A5B57] truncate">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full border border-[#142220]/20 text-xs sm:text-sm font-semibold text-[#142220] hover:bg-[#E6EAE4] transition-colors self-start md:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#142220] text-[#FAFAF8]'
                    : 'bg-[#F1F3EF] text-[#3C4B48] hover:text-[#142220]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="mt-8">
          {/* 1. PROFILE OVERVIEW */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-7 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-2xl font-bold">Profile Info</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2B5B51]">
                    <ShieldCheck className="w-4 h-4" />
                    Signed in with Google
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-[#142220]/10 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-[#4A5B57]">Full Name</span>
                    <span className="font-semibold text-[#142220]">
                      {profile?.displayName || user.displayName || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#4A5B57]">Email</span>
                    <span className="font-semibold text-[#142220] break-all">
                      {profile?.email || user.email}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#4A5B57]">UAE Phone</span>
                    <span className="font-semibold text-[#142220]">
                      {profile?.phone || 'Not added yet'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#4A5B57]">Preferred Emirate</span>
                    <span className="font-semibold text-[#142220]">
                      {profile?.preferredEmirate || 'Dubai'}
                    </span>
                  </div>
                </div>
                <div className="pt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onTabChange('settings')}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs sm:text-sm font-semibold hover:bg-[#2B5B51] cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => onTabChange('addresses')}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full border border-[#142220]/20 text-xs sm:text-sm font-semibold text-[#142220] hover:bg-[#E6EAE4] cursor-pointer"
                  >
                    Manage Addresses
                  </button>
                  {isStoreAdmin && onOpenAdmin && (
                    <button
                      type="button"
                      onClick={onOpenAdmin}
                      className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1F3532] text-[#FAFAF8] text-xs sm:text-sm font-semibold hover:bg-[#142220] transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Open Admin Dashboard</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 min-[375px]:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => onTabChange('orders')}
                  className="rounded-3xl bg-[#E6EAE4] border border-[#142220]/10 p-5 sm:p-6 text-left hover:bg-[#D7DDD5] transition-colors cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[#4A5B57]">
                    Total Orders
                  </span>
                  <p className="mt-2 font-serif text-4xl font-bold tabular-nums">
                    {orders.length}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#3C4B48]">View order history</p>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('wishlist')}
                  className="rounded-3xl bg-[#E6EAE4] border border-[#142220]/10 p-5 sm:p-6 text-left hover:bg-[#D7DDD5] transition-colors cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[#4A5B57]">
                    Saved Items
                  </span>
                  <p className="mt-2 font-serif text-4xl font-bold tabular-nums">
                    {wishlistedProducts.length}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#3C4B48]">View wishlist</p>
                </button>
                <div className="min-[375px]:col-span-2 rounded-3xl bg-[#142220] text-[#FAFAF8] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#CFD7CD]">
                      Latest Order Status
                    </p>
                    <p className="mt-1 font-serif font-bold text-xl truncate">
                      {orders[0]
                        ? `${orders[0].orderNumber} · ${orders[0].orderStatus}`
                        : 'No orders placed yet'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (orders[0]) {
                        onFocusOrder(orders[0].id);
                        onTabChange('tracking');
                      } else {
                        onNavigate('shop');
                      }
                    }}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full bg-[#FAFAF8] text-[#142220] text-xs sm:text-sm font-semibold shrink-0 cursor-pointer"
                  >
                    {orders[0] ? 'Track Order' : 'Shop Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. MY ORDERS & ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              {orders.length === 0 ? (
                <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-12 text-center space-y-4">
                  <Package className="w-8 h-8 mx-auto text-[#4A5B57]" />
                  <h2 className="font-serif text-2xl font-bold">No Orders Yet</h2>
                  <p className="text-sm text-[#3C4B48] max-w-md mx-auto">
                    Your confirmed playpen orders and delivery details will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold cursor-pointer"
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 sm:p-7 space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#142220]/10">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-serif text-2xl font-medium tabular-nums">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full bg-[#142220] text-[#FAFAF8]">
                            {order.orderStatus}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C6D69]">
                          Placed {formatOrderTimestamp(order.createdAt)} · {order.paymentMethod} ({order.paymentStatus})
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="block text-xl font-semibold tabular-nums">
                          AED {order.totalAed}
                        </span>
                        <span className="text-xs text-[#5C6D69]">
                          {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} · {order.emirate}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {order.itemsSummary.map((item, idx) => (
                        <div
                          key={`${order.id}-${item.productId}-${idx}`}
                          className="rounded-2xl bg-[#FAFAF8] p-3 flex items-center gap-3 border border-[#142220]/8"
                        >
                          <ResilientImage
                            src={item.productImage}
                            alt={item.productName}
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#142220] truncate">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-[#5C6D69] truncate">
                              {item.selectedSize} · {item.selectedColor} · Qty {item.quantity}
                            </p>
                            <p className="text-xs font-medium text-[#142220] tabular-nums mt-0.5">
                              AED {item.lineTotalAed}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[#142220]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <span className="text-[#3C4B48] sm:truncate sm:max-w-xl leading-relaxed">
                        Deliver to: {order.deliveryAddress}
                      </span>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {(order.orderStatus === 'Order Placed' ||
                          order.orderStatus === 'Order Confirmed') && (
                          <button
                            type="button"
                            onClick={() => cancelCustomerOrder(order)}
                            className="min-h-[44px] px-4 py-2 rounded-full border border-[#993A32]/30 text-[#6F251F] hover:bg-[#F7E8E6] transition-colors cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onFocusOrder(order.id);
                            onTabChange('tracking');
                          }}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] font-semibold hover:bg-[#2B5B51] cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Order</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* 3. CUSTOMER ORDER TRACKING TIMELINE */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              {orders.length === 0 || !trackedOrder ? (
                <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-12 text-center space-y-4">
                  <Truck className="w-8 h-8 mx-auto text-[#4A5B57]" />
                  <h2 className="font-serif text-2xl font-bold">
                    No Active Orders to Track
                  </h2>
                  <p className="text-sm text-[#3C4B48]">
                    Once you place an order, follow every delivery step from our Dubai warehouse to
                    your doorstep.
                  </p>
                </div>
              ) : (
                <>
                  {/* Order Selector */}
                  {orders.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                      <span className="text-xs font-semibold text-[#4A5B57] mr-1 shrink-0">Select Order:</span>
                      {orders.map((ord) => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => onFocusOrder(ord.id)}
                          className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                            trackedOrder.id === ord.id
                              ? 'bg-[#142220] text-[#FAFAF8]'
                              : 'bg-[#F1F3EF] text-[#142220] hover:bg-[#D7DDD5]'
                          }`}
                        >
                          {ord.orderNumber} · {ord.orderStatus}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tracking Overview Card */}
                  <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-9 space-y-8">
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#142220]/10">
                      <div>
                        <p className="text-xs font-semibold text-[#2B5B51]">
                          Live Delivery Updates
                        </p>
                        <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-bold tabular-nums">
                          Order {trackedOrder.orderNumber}
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-[#3C4B48]">
                          Placed {formatOrderTimestamp(trackedOrder.createdAt)} · Estimated Delivery:{' '}
                          <strong className="text-[#142220]">
                            {trackedOrder.estimatedDelivery}
                          </strong>
                        </p>
                      </div>

                      <div className="space-y-1 text-left sm:text-right">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold">
                          {trackedOrder.orderStatus}
                        </span>
                        {trackedOrder.trackingNumber && (
                          <p className="text-xs text-[#5C6D69] tabular-nums">
                            Tracking #: {trackedOrder.trackingNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Visual 7-Step Progress Timeline or Cancelled Banner */}
                    {trackedOrder.orderStatus === 'Cancelled' ? (
                      <div className="rounded-2xl bg-[#F7E8E6] border border-[#993A32]/20 p-5 flex items-center gap-4 text-[#6F251F]">
                        <XCircle className="w-6 h-6 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold">Order Cancelled</p>
                          <p className="text-xs mt-0.5">
                            This Cash on Delivery order has been cancelled and will not be dispatched.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Mobile Connected Vertical 7-Step Timeline */}
                        <div className="md:hidden relative pl-1">
                          {ORDER_TIMELINE_STEPS.map((step, idx) => {
                            const completed = activeStepIdx >= idx;
                            const isCurrent = activeStepIdx === idx;
                            const isLast = idx === ORDER_TIMELINE_STEPS.length - 1;
                            return (
                              <div
                                key={step}
                                className="relative flex items-start gap-3.5 pb-4 last:pb-0"
                              >
                                {!isLast && (
                                  <span
                                    aria-hidden="true"
                                    className={`absolute left-[15px] top-8 bottom-0 w-px ${
                                      activeStepIdx > idx ? 'bg-[#142220]' : 'bg-[#142220]/15'
                                    }`}
                                  />
                                )}
                                <div
                                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold tabular-nums shrink-0 border ${
                                    isCurrent
                                      ? 'bg-[#142220] text-[#FAFAF8] border-[#142220] ring-4 ring-[#142220]/10'
                                      : completed
                                      ? 'bg-[#E6EAE4] text-[#142220] border-[#142220]/30'
                                      : 'bg-[#FAFAF8] text-[#5C6D69] border-[#142220]/12'
                                  }`}
                                >
                                  {completed ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <span>0{idx + 1}</span>
                                  )}
                                </div>
                                <div
                                  className={`flex-1 min-w-0 rounded-2xl px-3.5 py-2.5 border ${
                                    isCurrent
                                      ? 'bg-[#142220] text-[#FAFAF8] border-[#142220]'
                                      : completed
                                      ? 'bg-[#E6EAE4]/70 text-[#142220] border-[#142220]/15'
                                      : 'bg-[#FAFAF8]/70 text-[#5C6D69] border-[#142220]/8'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-semibold leading-snug">{step}</p>
                                    {isCurrent && (
                                      <span className="text-[10px] uppercase tracking-[0.14em] text-[#CFD7CD]">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tablet & Desktop 7-Step Grid (Intact) */}
                        <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-7 gap-3">
                          {ORDER_TIMELINE_STEPS.map((step, idx) => {
                            const completed = activeStepIdx >= idx;
                            const isCurrent = activeStepIdx === idx;
                            return (
                              <div
                                key={step}
                                className={`rounded-2xl p-3.5 border transition-colors ${
                                  isCurrent
                                    ? 'bg-[#142220] text-[#FAFAF8] border-[#142220]'
                                    : completed
                                    ? 'bg-[#E6EAE4] text-[#142220] border-[#142220]/20'
                                    : 'bg-[#FAFAF8]/70 text-[#5C6D69] border-[#142220]/8'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] tabular-nums mb-1.5">
                                  <span>0{idx + 1}</span>
                                  {completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                                <p className="text-xs font-semibold leading-snug">{step}</p>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Status Update History & Delivery Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-[#142220]/10">
                      <div className="lg:col-span-7 space-y-4">
                        <h3 className="text-xs uppercase tracking-[0.14em] text-[#5C6D69]">
                          Status Update History
                        </h3>
                        <div className="space-y-4">
                          {trackedOrderEvents.length > 0 ? (
                            trackedOrderEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className="flex gap-3.5 items-start rounded-2xl bg-[#FAFAF8] p-4 border border-[#142220]/8"
                              >
                                <div className="w-2.5 h-2.5 rounded-full bg-[#142220] mt-1.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-[#142220]">
                                      {ev.status}
                                    </span>
                                    <span className="text-[11px] text-[#5C6D69] tabular-nums">
                                      {formatOrderTimestamp(ev.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-[#3C4B48] leading-relaxed">
                                    {ev.note}
                                  </p>
                                  {ev.location && (
                                    <p className="mt-1 text-[11px] text-[#5C6D69]">
                                      {ev.location}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[#5C6D69]">
                              Order confirmed and awaiting atelier scan.
                            </p>
                          )}
                        </div>

                        {/* Store Admin Live Dispatch Controls (only visible to verified admin email) */}
                        {isStoreAdmin &&
                          trackedOrder.orderStatus !== 'Delivered' &&
                          trackedOrder.orderStatus !== 'Cancelled' && (
                            <div className="mt-4 rounded-2xl bg-[#E6EAE4] border border-[#142220]/15 p-4 flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs">
                                <span className="font-semibold text-[#142220] block">
                                  Atelier Dispatch Console (Admin)
                                </span>
                                <span className="text-[#3C4B48]">
                                  Advance live parcel milestone in Firestore
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAdvanceStatus(trackedOrder)}
                                className="px-4 py-2 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-medium hover:bg-[#1F3532] cursor-pointer"
                              >
                                Advance to{' '}
                                {
                                  ORDER_TIMELINE_STEPS[
                                    Math.min(
                                      ORDER_TIMELINE_STEPS.length - 1,
                                      activeStepIdx + 1
                                    )
                                  ]
                                }
                              </button>
                            </div>
                          )}
                      </div>

                      <div className="lg:col-span-5 space-y-5">
                        <div className="rounded-2xl bg-[#FAFAF8] p-5 border border-[#142220]/8 space-y-2 text-xs">
                          <span className="uppercase tracking-[0.14em] text-[#5C6D69] block">
                            Delivery Address
                          </span>
                          <p className="font-semibold text-[#142220]">
                            {trackedOrder.customerName}
                          </p>
                          <p className="text-[#3C4B48] leading-relaxed">
                            {trackedOrder.deliveryAddress}
                          </p>
                          <p className="text-[#5C6D69] tabular-nums">
                            {trackedOrder.customerPhone}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#FAFAF8] p-5 border border-[#142220]/8 space-y-3">
                          <span className="uppercase tracking-[0.14em] text-[11px] text-[#5C6D69] block">
                            Ordered Pieces ({trackedOrderItems.length})
                          </span>
                          <div className="divide-y divide-[#142220]/10">
                            {trackedOrderItems.map((it) => (
                              <div key={it.id} className="py-2.5 flex items-center gap-3">
                                <ResilientImage
                                  src={it.productImage}
                                  alt={it.productName}
                                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-[#142220] truncate">
                                    {it.productName}
                                  </p>
                                  <p className="text-[11px] text-[#5C6D69]">
                                    {it.selectedSize} · {it.selectedColor} × {it.quantity}
                                  </p>
                                </div>
                                <span className="text-xs font-semibold tabular-nums">
                                  AED {it.lineTotalAed}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                    Saved Addresses
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4A5B57]">
                    Save your home or office address for faster checkout across the UAE.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressForm((p) => !p)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs sm:text-sm font-semibold hover:bg-[#2B5B51] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddressForm ? 'Cancel' : 'Add New Address'}</span>
                </button>
              </div>

              {showAddressForm && (
                <form
                  onSubmit={handleSaveAddress}
                  className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-8 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-[#3C4B48] mb-1">Label</label>
                      <input
                        required
                        maxLength={60}
                        type="text"
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        placeholder="Villa / Residence"
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#3C4B48] mb-1">
                        Recipient Name
                      </label>
                      <input
                        required
                        maxLength={120}
                        type="text"
                        value={addrRecipient}
                        onChange={(e) => setAddrRecipient(e.target.value)}
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#3C4B48] mb-1">
                        UAE Phone
                      </label>
                      <input
                        required
                        maxLength={32}
                        type="tel"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        placeholder="+971 50 123 4567"
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-[#3C4B48] mb-1">Emirate</label>
                      <select
                        value={addrEmirate}
                        onChange={(e) => setAddrEmirate(e.target.value)}
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                      >
                        {UAE_EMIRATES.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#3C4B48] mb-1">Area</label>
                      <input
                        required
                        maxLength={100}
                        type="text"
                        value={addrArea}
                        onChange={(e) => setAddrArea(e.target.value)}
                        placeholder="Jumeirah 2 / Saadiyat"
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#3C4B48] mb-1">
                        Street / Villa
                      </label>
                      <input
                        required
                        maxLength={300}
                        type="text"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        placeholder="Villa 8, Street 14B"
                        className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2.5 min-h-[40px] text-xs text-[#3C4B48] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addrDefault}
                      onChange={(e) => setAddrDefault(e.target.checked)}
                      className="accent-[#142220] w-4 h-4"
                    />
                    <span>Set as default UAE courier address</span>
                  </label>
                  <button
                    type="submit"
                    disabled={savingAddr}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer"
                  >
                    {savingAddr ? 'Saving...' : 'Save Address'}
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-10 text-center text-sm text-[#3C4B48]">
                  No saved addresses yet. Add your residence above or check "Save address" during checkout.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-6 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-semibold uppercase tracking-[0.12em] text-[#142220]">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[11px] font-medium text-[#5C6D69]">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[#142220]">
                          {addr.recipientName}
                        </p>
                        <p className="text-xs text-[#3C4B48] mt-1 leading-relaxed">
                          {addr.streetAddress}, {addr.area}, {addr.emirate}, UAE
                        </p>
                        <p className="text-xs text-[#5C6D69] mt-1 tabular-nums">
                          {addr.phone}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#142220]/10 flex items-center justify-between text-xs">
                        {!addr.isDefault ? (
                          <button
                            type="button"
                            onClick={() =>
                              saveCustomerAddress(
                                user.uid,
                                { ...addr, isDefault: true },
                                addresses
                              )
                            }
                            className="min-h-[40px] underline text-[#3C4B48] hover:text-[#142220] cursor-pointer"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <span className="text-[#5C6D69]">Primary Courier Spot</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeCustomerAddress(addr.id)}
                          aria-label={`Delete ${addr.label}`}
                          className="w-11 h-11 rounded-full text-[#5C6D69] hover:text-[#6F251F] hover:bg-[#E6EAE4] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. SYNCED WISHLIST */}
          {activeTab === 'wishlist' && (
            <div>
              {wishlistedProducts.length === 0 ? (
                <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-12 text-center space-y-4">
                  <Heart className="w-8 h-8 mx-auto text-[#4A5B57]" />
                  <h2 className="font-serif text-2xl font-bold">Your Wishlist is Empty</h2>
                  <p className="text-sm text-[#3C4B48]">
                    Tap the heart icon on any playpen to save it here for later.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold cursor-pointer"
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
                  {wishlistedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlist.includes(product.id)}
                      onToggleWishlist={onToggleWishlist}
                      onSelect={onSelectProduct}
                      onQuickView={onQuickView}
                      onQuickAdd={onQuickAdd}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. ACCOUNT SETTINGS & LOGOUT */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveSettings}
                className="lg:col-span-7 rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-8 space-y-5"
              >
                <h2 className="font-serif text-2xl font-bold">Account Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#3C4B48] mb-1">
                      Display Name
                    </label>
                    <input
                      required
                      maxLength={120}
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#3C4B48] mb-1">
                      UAE Mobile Number
                    </label>
                    <input
                      maxLength={32}
                      type="tel"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#3C4B48] mb-1">
                    Preferred Emirate
                  </label>
                  <select
                    value={settingsEmirate}
                    onChange={(e) => setSettingsEmirate(e.target.value)}
                    className="w-full sm:w-64 min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/12"
                  >
                    {UAE_EMIRATES.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-[#142220]/10">
                  <label className="flex items-center gap-2.5 min-h-[40px] text-xs text-[#142220] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsSms}
                      onChange={(e) => setSettingsSms(e.target.checked)}
                      className="accent-[#142220] w-4 h-4 shrink-0"
                    />
                    <span>Receive UAE courier WhatsApp / SMS delivery updates</span>
                  </label>
                  <label className="flex items-center gap-2.5 min-h-[40px] text-xs text-[#142220] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsMarketing}
                      onChange={(e) => setSettingsMarketing(e.target.checked)}
                      className="accent-[#142220] w-4 h-4 shrink-0"
                    />
                    <span>Private previews for new PLAYPEN architectural editions</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer"
                  >
                    {savingSettings ? 'Saving...' : 'Save Preferences'}
                  </button>
                  {settingsSaved && (
                    <span className="text-xs font-medium text-[#142220]">
                      Preferences updated in your account.
                    </span>
                  )}
                </div>
              </form>

              <div className="lg:col-span-5 space-y-5">
                <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-6 space-y-3">
                  <h3 className="font-serif text-xl font-bold">Account Security</h3>
                  <p className="text-xs sm:text-sm text-[#3C4B48] leading-relaxed">
                    You are signed in securely with Google. We never store passwords or card details.
                  </p>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full min-h-[48px] py-3 rounded-full border border-[#142220]/20 text-xs sm:text-sm font-semibold text-[#142220] hover:bg-[#E6EAE4] inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>

                {isStoreAdmin && (
                  <div className="rounded-3xl bg-[#E6EAE4] border border-[#142220]/15 p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif text-xl font-bold">
                        Store Admin Access
                      </h3>
                      <ShieldCheck className="w-4 h-4 text-[#142220]" />
                    </div>
                    <p className="text-xs sm:text-sm text-[#3C4B48] leading-relaxed">
                      Manage orders, delivery tracking, products, stock levels, customers, and sales reports.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {onOpenAdmin && (
                        <button
                          type="button"
                          onClick={onOpenAdmin}
                          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs sm:text-sm font-semibold hover:bg-[#2B5B51] cursor-pointer"
                        >
                          Open Admin Dashboard
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          setCatalogSyncMsg('Syncing catalog...');
                          await seedFullCatalogToFirestore();
                          setCatalogSyncMsg('All catalog collections & inventory synced.');
                        }}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full border border-[#142220]/20 text-[#142220] text-xs font-medium hover:bg-[#D7DDD5] cursor-pointer"
                      >
                        Sync Catalog Collections
                      </button>
                    </div>
                    {catalogSyncMsg && (
                      <p className="text-xs font-medium text-[#142220]">{catalogSyncMsg}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
