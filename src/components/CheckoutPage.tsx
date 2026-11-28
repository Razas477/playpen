import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Gift,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { formatAed, getProductUnitPrice, roundCurrency } from '../data/catalog';
import {
  computeDeliveryFee,
  getEstimatedDeliveryWindow,
  placeOrderInFirestore,
  UAE_EMIRATES,
} from '../lib/storeDb';
import {
  CartItem,
  CustomerAddress,
  OrderRecord,
  PageRoute,
  StoreSettings,
  UserProfile,
} from '../types/store';
import { ResilientImage } from './ResilientImage';

interface CheckoutPageProps {
  user: User | null;
  profile: UserProfile | null;
  items: CartItem[];
  addresses: CustomerAddress[];
  idempotencyKey: string;
  storeSettings?: StoreSettings;
  onRequireSignIn: () => void;
  onNavigate: (route: PageRoute) => void;
  onOrderPlaced: (order: OrderRecord) => void;
}

export function CheckoutPage({
  user,
  profile,
  items,
  addresses,
  idempotencyKey,
  storeSettings,
  onRequireSignIn,
  onNavigate,
  onOrderPlaced,
}: CheckoutPageProps) {
  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) || addresses[0] || null,
    [addresses]
  );

  const [customerName, setCustomerName] = useState(
    defaultAddress?.recipientName || profile?.displayName || user?.displayName || ''
  );
  const [customerEmail, setCustomerEmail] = useState(
    profile?.email || user?.email || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    defaultAddress?.phone || profile?.phone || ''
  );
  const [emirate, setEmirate] = useState(
    defaultAddress?.emirate || profile?.preferredEmirate || 'Dubai'
  );
  const [area, setArea] = useState(defaultAddress?.area || '');
  const [streetAddress, setStreetAddress] = useState(
    defaultAddress?.streetAddress || ''
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress?.id || ''
  );
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(
    addresses.length === 0
  );
  const [giftWrap, setGiftWrap] = useState(true);
  const [giftNote, setGiftNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submitLockRef = useRef(false);

  // Sync user / saved address defaults when auth or addresses hydrate
  useEffect(() => {
    if (user && !customerEmail) {
      setCustomerEmail(profile?.email || user.email || '');
    }
    if (user && !customerName) {
      setCustomerName(profile?.displayName || user.displayName || '');
    }
    if (profile?.phone && !customerPhone) {
      setCustomerPhone(profile.phone);
    }
  }, [user, profile, customerEmail, customerName, customerPhone]);

  useEffect(() => {
    if (defaultAddress && !selectedAddressId && !area && !streetAddress) {
      setSelectedAddressId(defaultAddress.id);
      setCustomerName(defaultAddress.recipientName);
      setCustomerPhone(defaultAddress.phone);
      setEmirate(defaultAddress.emirate);
      setArea(defaultAddress.area);
      setStreetAddress(defaultAddress.streetAddress);
      setSaveAddressToProfile(false);
    }
  }, [defaultAddress, selectedAddressId, area, streetAddress]);

  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setCustomerName(addr.recipientName);
    setCustomerPhone(addr.phone);
    setEmirate(addr.emirate);
    setArea(addr.area);
    setStreetAddress(addr.streetAddress);
    setSaveAddressToProfile(false);
  };

  const subtotalAed = roundCurrency(
    items.reduce(
      (sum, item) =>
        sum + roundCurrency(getProductUnitPrice(item.product, item.size) * item.quantity),
      0
    )
  );
  const deliveryFeeAed = roundCurrency(computeDeliveryFee(subtotalAed, storeSettings));
  const totalAed = roundCurrency(subtotalAed + deliveryFeeAed);
  const estimatedWindow = getEstimatedDeliveryWindow(emirate);

  if (!user) {
    return (
      <section className="py-12 sm:py-16 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-xl mx-auto px-4 sm:px-8 text-center">
          <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 sm:p-12 space-y-5 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#E6EAE4] flex items-center justify-center text-[#142220]">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
              PLAYPEN · Secure Checkout
            </p>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#142220]">
              Sign In to Checkout
            </h1>
            <p className="text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
              Sign in with Google before placing your order so your saved UAE addresses and live
              delivery tracking stay linked to your account.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onRequireSignIn}
                className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
              >
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-full border border-[#142220]/20 text-sm font-semibold text-[#142220] hover:bg-[#E6EAE4] transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-24 bg-[#FAFAF8]">
        <div className="max-w-xl mx-auto px-4 sm:px-8 text-center">
          <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 sm:p-12 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#E6EAE4] flex items-center justify-center text-[#4A5B57]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#142220]">
              Your Cart is Empty
            </h1>
            <p className="text-sm text-[#3C4B48]">
              Add a mesh playpen, gate activity yard, foldable play mat, or ocean ball set to your
              cart before checking out.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="mt-2 w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
            >
              Shop Now
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanArea = area.trim();
    const cleanStreet = streetAddress.trim();

    if (cleanName.length < 2 || cleanPhone.length < 7 || cleanArea.length < 2 || cleanStreet.length < 4) {
      setSubmitError('Please complete your full name, UAE phone number, city/area, and delivery address.');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const createdOrder = await placeOrderInFirestore({
        user,
        idempotencyKey,
        customerName: cleanName,
        customerEmail: customerEmail.trim() || user.email || '',
        customerPhone: cleanPhone,
        emirate,
        area: cleanArea,
        streetAddress: cleanStreet,
        items,
        giftWrap,
        giftNote,
        saveAddressToProfile,
        existingAddresses: addresses,
        storeSettings,
      });
      onOrderPlaced(createdOrder);
    } catch (err) {
      console.error('Checkout error:', err);
      setSubmitError(
        'We could not finalize your order right now. Please check your connection and try again.'
      );
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-8 sm:py-10 lg:py-16 bg-[#FAFAF8] text-[#142220]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="pb-5 sm:pb-6 border-b border-[#142220]/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-2 min-h-[40px] text-xs sm:text-sm font-semibold text-[#3C4B48] hover:text-[#142220] mb-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Shop</span>
            </button>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#142220]">
              Checkout
            </h1>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-full bg-[#E6EAE4] text-xs font-medium text-[#142220] max-w-full">
            <ShieldCheck className="w-4 h-4 text-[#2B5B51] shrink-0" />
            <span className="truncate">Signed in as {user.displayName || user.email}</span>
          </div>
        </div>

        {/* Compact Mobile Order Total Strip */}
        <div className="lg:hidden mt-5 rounded-2xl bg-[#E6EAE4] border border-[#142220]/10 px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#4A5B57]">
              {items.reduce((s, i) => s + i.quantity, 0)} Items · {emirate}
            </p>
            <p className="text-xs font-semibold text-[#142220] truncate">
              {deliveryFeeAed === 0
                ? 'Free UAE Delivery'
                : `Includes ${formatAed(deliveryFeeAed)} delivery`}
            </p>
          </div>
          <span className="font-serif text-lg font-bold text-[#142220] tabular-nums shrink-0">
            {formatAed(totalAed)}
          </span>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* LEFT: Customer Details, UAE Delivery & Configurable Payment */}
          <form
            id="playpen-checkout-form"
            onSubmit={handleSubmit}
            className="lg:col-span-7 min-w-0 space-y-5 sm:space-y-6"
          >
            {/* Saved UAE Addresses Picker */}
            {addresses.length > 0 && (
              <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[#142220]">
                    <MapPin className="w-4 h-4 text-[#2B5B51]" />
                    <span>Saved Addresses</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId('');
                      setArea('');
                      setStreetAddress('');
                      setSaveAddressToProfile(true);
                    }}
                    className="text-xs font-semibold underline text-[#2B5B51] hover:text-[#142220] min-h-[36px] cursor-pointer"
                  >
                    + Use New Address
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const active = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#142220] text-[#FAFAF8] border-[#142220]'
                            : 'bg-[#FAFAF8] text-[#142220] border-[#142220]/10 hover:border-[#142220]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-[11px] font-medium opacity-80">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-90 truncate">
                          {addr.recipientName} · {addr.phone}
                        </p>
                        <p className="text-xs opacity-75 truncate mt-0.5">
                          {addr.streetAddress}, {addr.area}, {addr.emirate}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customer Details & Delivery Address */}
            <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-8 space-y-5">
              <div>
                <p className="text-xs font-semibold text-[#2B5B51]">
                  Step 1 · Delivery Information
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#142220]">
                  Delivery Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                    Full Name
                  </label>
                  <input
                    required
                    maxLength={120}
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Noura Al Qasimi"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/12 focus:outline-none focus:border-[#142220]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    maxLength={200}
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/12 focus:outline-none focus:border-[#142220]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                    UAE Phone Number
                  </label>
                  <input
                    required
                    maxLength={32}
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/12 focus:outline-none focus:border-[#142220]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                    Emirate / City
                  </label>
                  <select
                    value={emirate}
                    onChange={(e) => setEmirate(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/12 focus:outline-none focus:border-[#142220] cursor-pointer"
                  >
                    {UAE_EMIRATES.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                    Area / Community
                  </label>
                  <input
                    required
                    maxLength={100}
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Jumeirah 1 / Al Maryah"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/12 focus:outline-none focus:border-[#142220]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                  Street Address (Villa, Building, Landmark)
                </label>
                <input
                  required
                  maxLength={300}
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Villa 14, Al Wasl Road, near Dar Al Wasl"
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/12 focus:outline-none focus:border-[#142220]"
                />
              </div>

              <label className="flex items-center gap-2.5 min-h-[40px] text-xs sm:text-sm font-medium text-[#3C4B48] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveAddressToProfile}
                  onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                  className="accent-[#142220] w-4 h-4 shrink-0"
                />
                <span>Save this address to my account</span>
              </label>
            </div>

            {/* Delivery Notes & Gift Option */}
            <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-6 space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer min-h-[40px]">
                <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-[#142220]">
                  <Gift className="w-4 h-4 text-[#2B5B51] shrink-0" />
                  <span>Include Setup Guide &amp; Gift Note</span>
                </span>
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="accent-[#142220] w-4 h-4 shrink-0"
                />
              </label>
              {giftWrap && (
                <input
                  type="text"
                  maxLength={280}
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="Optional gift message or delivery instructions..."
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#FAFAF8] text-base sm:text-sm text-[#142220] border border-[#142220]/10 focus:outline-none"
                />
              )}
            </div>

            {/* Configurable Payment Method (Cash on Delivery) */}
            <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 sm:p-8 space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#2B5B51]">
                  Step 2 · Payment
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#142220]">
                  Payment Method
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#142220] text-[#FAFAF8] p-4 border border-[#142220]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Cash on Delivery</span>
                    <CheckCircle2 className="w-4 h-4 text-[#CFD7CD]" />
                  </div>
                  <p className="mt-1.5 text-xs text-[#DCE2DA] leading-relaxed">
                    Pay in AED cash when your playpen arrives at your door.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAFAF8]/80 text-[#4A5B57] p-4 border border-[#142220]/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Card &amp; Apple Pay</span>
                    <span className="text-[11px] font-semibold">Coming Soon</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    Online card payment will be available soon. Right now, all orders use Cash on Delivery.
                  </p>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="rounded-2xl bg-[#F7E8E6] border border-[#993A32]/25 px-5 py-3.5 text-xs font-medium text-[#6F251F]">
                {submitError}
              </div>
            )}
          </form>

          {/* RIGHT: Sticky Order Summary */}
          <aside className="lg:col-span-5 min-w-0 lg:sticky lg:top-24">
            <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#142220]/10">
                <h2 className="font-serif text-2xl font-bold text-[#142220]">
                  Order Summary
                </h2>
                <span className="text-xs font-semibold text-[#4A5B57] tabular-nums">
                  {items.reduce((s, i) => s + i.quantity, 0)} Items
                </span>
              </div>

              <div className="divide-y divide-[#142220]/10 max-h-[340px] overflow-y-auto pr-1">
                {items.map((item) => {
                  const itemUnit = getProductUnitPrice(item.product, item.size);
                  const itemLine = roundCurrency(itemUnit * item.quantity);
                  return (
                    <div key={item.id} className="py-3.5 flex gap-3.5">
                      <ResilientImage
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-12 rounded-xl object-cover bg-[#D7DDD5] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#142220] truncate">
                          {item.product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#4A5B57]">
                          Size: <strong className="font-semibold text-[#142220]">{item.size}</strong> · Color:{' '}
                          <strong className="font-semibold text-[#142220]">{item.color}</strong>
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-xs">
                          <span className="text-[#4A5B57] tabular-nums">
                            Qty {item.quantity} × {formatAed(itemUnit)}
                          </span>
                          <span className="font-bold text-[#142220] tabular-nums">
                            {formatAed(itemLine)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#142220]/10 space-y-2.5 text-xs sm:text-sm text-[#3C4B48]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#142220] tabular-nums">
                    {formatAed(subtotalAed)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>UAE Delivery</span>
                  <span className="font-semibold text-[#142220] tabular-nums">
                    {deliveryFeeAed === 0 ? 'Free' : formatAed(deliveryFeeAed)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#4A5B57]">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Estimated Delivery</span>
                  </span>
                  <span className="font-medium">{estimatedWindow}</span>
                </div>
                <div className="pt-3 border-t border-[#142220]/10 flex justify-between text-base font-bold text-[#142220]">
                  <span>Total (Includes VAT)</span>
                  <span className="tabular-nums">{formatAed(totalAed)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="playpen-checkout-form"
                disabled={isSubmitting}
                className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting
                  ? 'Placing Your Order...'
                  : `Place Order (Cash on Delivery) · ${formatAed(totalAed)}`}
              </button>

              <p className="text-xs text-center text-[#4A5B57]">
                Safe checkout · 14-day easy returns across the UAE
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
