import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { AccountPage } from './components/AccountPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AtelierToast, ToastBagNotice } from './components/AtelierToast';
import { AuthModal } from './components/AuthModal';
import { BrandPages } from './components/BrandPages';
import { CartDrawer } from './components/CartDrawer';
import { CategoryViews } from './components/CategoryViews';
import { CheckoutPage } from './components/CheckoutPage';
import { FloatingCategoryPanel } from './components/FloatingCategoryPanel';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroEditorial } from './components/HeroEditorial';
import { HomeSections } from './components/HomeSections';
import { OrderConfirmationPage } from './components/OrderConfirmationPage';
import { ProductDetailView } from './components/ProductDetailView';
import { QuickViewModal } from './components/QuickViewModal';
import { Testimonials } from './components/Testimonials';
import { WhatsAppHelpButton } from './components/WhatsAppHelpButton';
import { CATEGORY_DIRECTORY, PRODUCTS } from './data/catalog';
import { auth } from './lib/firebase';
import {
  createIdempotencyKey,
  DEFAULT_STORE_SETTINGS,
  ensureUserProfile,
  signOutAccount,
  subscribeToAddresses,
  subscribeToAllInventoryAdmin,
  subscribeToAllOrderItemsAdmin,
  subscribeToAllOrdersAdmin,
  subscribeToAllTrackingAdmin,
  subscribeToAllUsersAdmin,
  subscribeToCatalogCategories,
  subscribeToCatalogProducts,
  subscribeToCustomerOrderItems,
  subscribeToCustomerOrders,
  subscribeToCustomerTracking,
  subscribeToStoreSettings,
  subscribeToUserProfile,
  syncCatalogIfAdmin,
  syncWishlistToDb,
  verifyAdminAccessOnServer,
} from './lib/storeDb';
import {
  AccountTab,
  CartItem,
  CategoryDirectoryItem,
  CustomerAddress,
  InventoryRecord,
  OrderItemRecord,
  OrderRecord,
  OrderTrackingEvent,
  PageRoute,
  Product,
  StoreSettings,
  UserProfile,
} from './types/store';

const CART_STORAGE_KEY = 'playpen_cart_v1';

function loadInitialCart(): CartItem[] {
  const starterProduct = PRODUCTS[0];
  const starterSize = starterProduct.sizes[0] || '120 × 120 × 1 cm';
  const starterColor = starterProduct.colors[0]?.name || 'Reversible Road & Bear Print';
  const defaultBag: CartItem[] = [
    {
      id: `${starterProduct.id}-${starterSize}-${starterColor}`,
      product: starterProduct,
      size: starterSize,
      color: starterColor,
      quantity: 1,
    },
  ];
  if (typeof window === 'undefined') return defaultBag;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return defaultBag;
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return defaultBag;
    const valid: CartItem[] = [];
    for (const entry of parsed) {
      const product = PRODUCTS.find((p) => p.id === entry?.product?.id);
      if (product && typeof entry.quantity === 'number' && entry.quantity > 0) {
        valid.push({
          id: String(entry.id || `${product.id}-${entry.size}-${entry.color}`),
          product,
          size: String(entry.size || product.sizes[0] || '120cm x 120cm'),
          color: String(entry.color || product.colors[0]?.name || 'Classic'),
          quantity: Math.min(20, Math.max(1, Math.floor(entry.quantity))),
        });
      }
    }
    return valid.length > 0 ? valid : defaultBag;
  } catch {
    return defaultBag;
  }
}

function getInitialRoute(): PageRoute {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'admin' || window.location.hash === '#admin') {
      return 'admin';
    }
  }
  return 'home';
}

function getInitialProduct(): Product | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  if (!productId) return null;
  return PRODUCTS.find((p) => p.id === productId) || null;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });

  const [activeRoute, setActiveRoute] = useState<PageRoute>(getInitialRoute);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShopPanelOpen, setIsShopPanelOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    getInitialProduct
  );
  const pendingUrlProductIdRef = useRef<string | null>(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('product')
      : null
  );
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toastNotice, setToastNotice] = useState<ToastBagNotice | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [wishlist, setWishlist] = useState<string[]>([
    'versatile-foldable-baby-play-mat-120x120',
    'baby-playpen-extra-large-gate-120x120',
  ]);
  const wishlistRef = useRef<string[]>(wishlist);
  wishlistRef.current = wishlist;

  const [cartItems, setCartItems] = useState<CartItem[]>(loadInitialCart);

  // Live Storefront Catalog & Settings (Synced with Firestore)
  const [liveProducts, setLiveProducts] = useState<Product[]>(PRODUCTS);
  const [liveCategories, setLiveCategories] =
    useState<CategoryDirectoryItem[]>(CATEGORY_DIRECTORY);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(
    DEFAULT_STORE_SETTINGS
  );

  // Firebase Auth & Persistent Customer Store State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRecord[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<OrderTrackingEvent[]>([]);

  // Backend-Verified Private Admin RBAC & Real-Time Operations State
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [adminChecking, setAdminChecking] = useState(true);
  const [adminOrders, setAdminOrders] = useState<OrderRecord[]>([]);
  const [adminOrderItems, setAdminOrderItems] = useState<OrderItemRecord[]>([]);
  const [adminTrackingEvents, setAdminTrackingEvents] = useState<OrderTrackingEvent[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminInventory, setAdminInventory] = useState<InventoryRecord[]>([]);

  // Auth Gate, Checkout Idempotency & Account Navigation
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<'checkout' | 'account'>('account');
  const pendingRedirectRef = useRef<'none' | 'checkout' | 'account' | 'admin'>('none');
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState<string>(
    createIdempotencyKey
  );
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<OrderRecord | null>(null);
  const [accountTab, setAccountTab] = useState<AccountTab>('profile');
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!showIntro) return;
    const timer = window.setTimeout(() => setShowIntro(false), 620);
    return () => window.clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeRoute, selectedProduct]);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#admin') {
        setSelectedProduct(null);
        setActiveRoute('admin');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  // Public Firestore Catalog & Settings Subscriptions
  useEffect(() => {
    const unsubProducts = subscribeToCatalogProducts(setLiveProducts);
    const unsubCategories = subscribeToCatalogCategories(setLiveCategories);
    const unsubSettings = subscribeToStoreSettings(setStoreSettings);
    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
    };
  }, []);

  // Keep selected product synced if edited live by admin, or resolve deep-linked Firestore product
  useEffect(() => {
    if (!selectedProduct && pendingUrlProductIdRef.current) {
      const targetId = pendingUrlProductIdRef.current;
      const match = liveProducts.find((p) => p.id === targetId);
      if (match) {
        pendingUrlProductIdRef.current = null;
        setSelectedProduct(match);
      }
      return;
    }
    if (!selectedProduct) return;
    const updated = liveProducts.find((p) => p.id === selectedProduct.id);
    if (updated && updated !== selectedProduct) {
      setSelectedProduct(updated);
    }
  }, [liveProducts, selectedProduct]);

  // Sync ?product=<id> query parameter cleanly for direct sharing
  useEffect(() => {
    if (typeof window === 'undefined' || activeRoute === 'admin') return;
    const url = new URL(window.location.href);
    if (selectedProduct) {
      if (url.searchParams.get('product') !== selectedProduct.id) {
        url.searchParams.set('product', selectedProduct.id);
        window.history.replaceState(null, '', url.toString());
      }
    } else if (url.searchParams.has('product') && !pendingUrlProductIdRef.current) {
      url.searchParams.delete('product');
      window.history.replaceState(null, '', url.toString());
    }
  }, [selectedProduct, activeRoute]);

  // Firebase Auth listener, Server-Verified Admin RBAC & Firestore Subscriptions
  useEffect(() => {
    let activeSessionId = 0;
    let unsubProfile: (() => void) | undefined;
    let unsubAddresses: (() => void) | undefined;
    let unsubOrders: (() => void) | undefined;
    let unsubOrderItems: (() => void) | undefined;
    let unsubTracking: (() => void) | undefined;
    let unsubAdminOrders: (() => void) | undefined;
    let unsubAdminItems: (() => void) | undefined;
    let unsubAdminTracking: (() => void) | undefined;
    let unsubAdminUsers: (() => void) | undefined;
    let unsubAdminInventory: (() => void) | undefined;

    const cleanupSubs = () => {
      unsubProfile?.();
      unsubAddresses?.();
      unsubOrders?.();
      unsubOrderItems?.();
      unsubTracking?.();
      unsubAdminOrders?.();
      unsubAdminItems?.();
      unsubAdminTracking?.();
      unsubAdminUsers?.();
      unsubAdminInventory?.();
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      activeSessionId += 1;
      const mySession = activeSessionId;
      cleanupSubs();
      setCurrentUser(user);

      if (!user) {
        setProfile(null);
        setAddresses([]);
        setOrders([]);
        setOrderItems([]);
        setTrackingEvents([]);
        setIsAdminVerified(false);
        setAdminChecking(false);
        setAdminOrders([]);
        setAdminOrderItems([]);
        setAdminTrackingEvents([]);
        setAdminUsers([]);
        setAdminInventory([]);
        return;
      }

      setAdminChecking(true);

      // Instant redirect if user initiated auth prior to completion
      if (pendingRedirectRef.current === 'checkout') {
        pendingRedirectRef.current = 'none';
        setIsAuthModalOpen(false);
        setSelectedProduct(null);
        setActiveRoute('checkout');
      } else if (pendingRedirectRef.current === 'account') {
        pendingRedirectRef.current = 'none';
        setIsAuthModalOpen(false);
        setSelectedProduct(null);
        setActiveRoute('account');
      } else if (pendingRedirectRef.current === 'admin') {
        pendingRedirectRef.current = 'none';
        setIsAuthModalOpen(false);
        setSelectedProduct(null);
        setActiveRoute('admin');
      }

      try {
        await ensureUserProfile(user, wishlistRef.current);
      } catch (err) {
        console.error('Profile sync failed:', err);
      }
      if (mySession !== activeSessionId) return;

      const verifiedAdmin = await verifyAdminAccessOnServer(user);
      if (mySession !== activeSessionId) return;

      setIsAdminVerified(verifiedAdmin);
      setAdminChecking(false);

      unsubProfile = subscribeToUserProfile(user.uid, (nextProfile) => {
        setProfile(nextProfile);
        if (nextProfile?.wishlistIds) {
          setWishlist(nextProfile.wishlistIds);
        }
      });
      unsubAddresses = subscribeToAddresses(user.uid, setAddresses);
      unsubOrders = subscribeToCustomerOrders(user.uid, setOrders);
      unsubOrderItems = subscribeToCustomerOrderItems(user.uid, setOrderItems);
      unsubTracking = subscribeToCustomerTracking(user.uid, setTrackingEvents);

      if (verifiedAdmin) {
        void syncCatalogIfAdmin(user);
        unsubAdminOrders = subscribeToAllOrdersAdmin(setAdminOrders);
        unsubAdminItems = subscribeToAllOrderItemsAdmin(setAdminOrderItems);
        unsubAdminTracking = subscribeToAllTrackingAdmin(setAdminTrackingEvents);
        unsubAdminUsers = subscribeToAllUsersAdmin(setAdminUsers);
        unsubAdminInventory = subscribeToAllInventoryAdmin(setAdminInventory);
      } else {
        setAdminOrders([]);
        setAdminOrderItems([]);
        setAdminTrackingEvents([]);
        setAdminUsers([]);
        setAdminInventory([]);
      }
    });

    return () => {
      activeSessionId += 1;
      cleanupSubs();
      unsubAuth();
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return liveProducts.slice(0, 6);
    return liveProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.dimensions.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q)
    );
  }, [liveProducts, searchQuery]);

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    const sameCat = liveProducts.filter(
      (p) => p.id !== selectedProduct.id && p.category === selectedProduct.category
    );
    const others = liveProducts.filter(
      (p) => p.id !== selectedProduct.id && p.category !== selectedProduct.category
    );
    return [...sameCat, ...others].slice(0, 3);
  }, [liveProducts, selectedProduct]);

  const triggerBagToast = (
    product: Product,
    size: string,
    color: string,
    quantity: number
  ) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastNotice({ product, size, color, quantity });
    toastTimerRef.current = window.setTimeout(() => {
      setToastNotice(null);
    }, 3400);
  };

  const handleNavigate = (route: PageRoute) => {
    pendingUrlProductIdRef.current = null;
    setSelectedProduct(null);
    setActiveRoute(route);
    setIsShopPanelOpen(false);
    setIsSearchOpen(false);
  };

  const handleSelectProduct = (product: Product) => {
    pendingUrlProductIdRef.current = null;
    setQuickViewProduct(null);
    setIsSearchOpen(false);
    setSelectedProduct(product);
    setIsShopPanelOpen(false);
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      if (currentUser) {
        void syncWishlistToDb(currentUser.uid, next);
      }
      return next;
    });
  };

  const handleAddToCart = (
    product: Product,
    size: string,
    color: string,
    quantity = 1,
    openDrawer = true
  ) => {
    const key = `${product.id}-${size}-${color}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === key);
      if (existing) {
        return prev.map((item) =>
          item.id === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id: key, product, size, color, quantity }];
    });
    if (openDrawer) {
      setToastNotice(null);
      setIsCartOpen(true);
    } else {
      triggerBagToast(product, size, color, quantity);
    }
  };

  const handleQuickAdd = (product: Product, size?: string, color?: string) => {
    const unavailable = new Set(product.unavailableSizes || []);
    const chosenSize =
      size ||
      product.sizes.find((s) => !unavailable.has(s)) ||
      product.sizes[0] ||
      '120cm x 120cm';
    const chosenColor = color || product.colors[0]?.name || 'Classic';
    handleAddToCart(product, chosenSize, chosenColor, 1, false);
  };

  const handleBuyNow = (
    product: Product,
    size: string,
    color: string,
    quantity: number
  ) => {
    handleAddToCart(product, size, color, quantity, false);
    setToastNotice(null);
    handleProceedToCheckout();
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setSelectedProduct(null);
    if (!checkoutIdempotencyKey) {
      setCheckoutIdempotencyKey(createIdempotencyKey());
    }
    if (currentUser) {
      setActiveRoute('checkout');
    } else {
      pendingRedirectRef.current = 'checkout';
      setAuthModalReason('checkout');
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenAccount = (tab: AccountTab = 'profile') => {
    setAccountTab(tab);
    setSelectedProduct(null);
    setIsShopPanelOpen(false);
    if (currentUser) {
      setActiveRoute('account');
    } else {
      pendingRedirectRef.current = 'account';
      setAuthModalReason('account');
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenAuth = () => {
    pendingRedirectRef.current = 'account';
    setAuthModalReason('account');
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    const target = pendingRedirectRef.current;
    pendingRedirectRef.current = 'none';
    if (target === 'checkout') {
      setSelectedProduct(null);
      setActiveRoute('checkout');
    } else if (target === 'account') {
      setSelectedProduct(null);
      setActiveRoute('account');
    } else if (target === 'admin') {
      setSelectedProduct(null);
      setActiveRoute('admin');
    }
  };

  const handleOrderPlaced = (order: OrderRecord) => {
    setCartItems([]);
    setLastConfirmedOrder(order);
    setFocusedOrderId(order.id);
    setCheckoutIdempotencyKey(createIdempotencyKey());
    setActiveRoute('order-confirmation');
  };

  const handleTrackOrder = (orderId: string) => {
    setFocusedOrderId(orderId);
    setAccountTab('tracking');
    setSelectedProduct(null);
    setActiveRoute('account');
  };

  const handleSignOut = async () => {
    await signOutAccount();
    setIsAdminVerified(false);
    if (
      activeRoute === 'checkout' ||
      activeRoute === 'order-confirmation' ||
      activeRoute === 'account' ||
      activeRoute === 'admin'
    ) {
      setActiveRoute('home');
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (activeRoute === 'admin') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-[#142220] selection:bg-[#142220] selection:text-[#FAFAF8]">
        <AdminDashboard
          user={currentUser}
          isAdminVerified={isAdminVerified}
          adminChecking={adminChecking}
          orders={adminOrders}
          orderItems={adminOrderItems}
          trackingEvents={adminTrackingEvents}
          customers={adminUsers}
          products={liveProducts}
          categories={liveCategories}
          inventory={adminInventory}
          storeSettings={storeSettings}
          onRequireSignIn={() => {
            pendingRedirectRef.current = 'admin';
            setAuthModalReason('account');
            setIsAuthModalOpen(true);
          }}
          onSignOut={handleSignOut}
          onReturnStorefront={(route = 'home') => handleNavigate(route)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          reason={authModalReason}
          onClose={() => {
            pendingRedirectRef.current = 'none';
            setIsAuthModalOpen(false);
          }}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#142220] selection:bg-[#142220] selection:text-[#FAFAF8]">
      {/* Brief Brand Entrance Veil */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
            className="fixed inset-0 z-[70] bg-[#FAFAF8] flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-4xl sm:text-5xl font-bold tracking-[0.18em] uppercase text-[#142220]"
            >
              PLAYPEN
            </motion.span>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 w-20 h-px bg-[#142220]/35 origin-center"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Header
        currentRoute={activeRoute}
        onNavigate={handleNavigate}
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        user={currentUser}
        isAdmin={isAdminVerified}
        onOpenAuth={handleOpenAuth}
        onLogout={handleSignOut}
        isSearchOpen={isSearchOpen}
        onCloseSearch={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onSelectProduct={handleSelectProduct}
      />

      {!selectedProduct && (
        <FloatingCategoryPanel
          currentRoute={activeRoute}
          onNavigate={handleNavigate}
          categories={liveCategories}
          isOpen={isShopPanelOpen}
          onToggleOpen={() => setIsShopPanelOpen((prev) => !prev)}
        />
      )}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {selectedProduct ? (
            <motion.div
              key={`product-${selectedProduct.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductDetailView
                key={selectedProduct.id}
                product={selectedProduct}
                relatedProducts={relatedProducts}
                onBack={() => setSelectedProduct(null)}
                onAddToCart={(p, sz, col, qty) =>
                  handleAddToCart(p, sz, col, qty, false)
                }
                onBuyNow={handleBuyNow}
                onSelectProduct={handleSelectProduct}
                isWishlisted={wishlist.includes(selectedProduct.id)}
                onToggleWishlist={handleToggleWishlist}
                wishlistIds={wishlist}
                onNavigate={handleNavigate}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeRoute}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeRoute === 'home' ? (
                <>
                  <HeroEditorial
                    onNavigate={handleNavigate}
                    onSelectProduct={handleSelectProduct}
                    products={liveProducts}
                  />
                  <HomeSections
                    products={liveProducts}
                    onNavigate={handleNavigate}
                    onSelectProduct={handleSelectProduct}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onQuickAdd={handleQuickAdd}
                    wishlistIds={wishlist}
                    onToggleWishlist={handleToggleWishlist}
                  />
                  <Testimonials
                    products={liveProducts}
                    onSelectProduct={handleSelectProduct}
                  />
                </>
              ) : activeRoute === 'checkout' ? (
                <div className="pt-16 sm:pt-20">
                  <CheckoutPage
                    user={currentUser}
                    profile={profile}
                    items={cartItems}
                    addresses={addresses}
                    idempotencyKey={checkoutIdempotencyKey}
                    storeSettings={storeSettings}
                    onRequireSignIn={() => {
                      pendingRedirectRef.current = 'checkout';
                      setAuthModalReason('checkout');
                      setIsAuthModalOpen(true);
                    }}
                    onNavigate={handleNavigate}
                    onOrderPlaced={handleOrderPlaced}
                  />
                </div>
              ) : activeRoute === 'order-confirmation' ? (
                <div className="pt-16 sm:pt-20">
                  <OrderConfirmationPage
                    order={lastConfirmedOrder}
                    onTrackOrder={handleTrackOrder}
                    onNavigate={handleNavigate}
                  />
                </div>
              ) : activeRoute === 'account' ? (
                <div className="pt-16 sm:pt-20">
                  <AccountPage
                    user={currentUser}
                    profile={profile}
                    isAdminVerified={isAdminVerified}
                    liveProducts={liveProducts}
                    orders={orders}
                    orderItems={orderItems}
                    trackingEvents={trackingEvents}
                    addresses={addresses}
                    wishlist={wishlist}
                    activeTab={accountTab}
                    focusedOrderId={focusedOrderId}
                    onTabChange={setAccountTab}
                    onFocusOrder={setFocusedOrderId}
                    onRequireSignIn={handleOpenAuth}
                    onSignOut={handleSignOut}
                    onOpenAdmin={() => handleNavigate('admin')}
                    onToggleWishlist={handleToggleWishlist}
                    onSelectProduct={handleSelectProduct}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onQuickAdd={handleQuickAdd}
                    onNavigate={handleNavigate}
                  />
                </div>
              ) : activeRoute === 'about' ||
                activeRoute === 'contact' ||
                activeRoute === 'journal' ? (
                <BrandPages
                  route={activeRoute}
                  onNavigate={handleNavigate}
                  supportPhone={storeSettings.supportPhone}
                />
              ) : (
                <CategoryViews
                  route={activeRoute}
                  products={liveProducts}
                  onSelectProduct={handleSelectProduct}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  onQuickAdd={handleQuickAdd}
                  wishlistIds={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  onNavigate={handleNavigate}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        isSignedIn={Boolean(currentUser)}
        isAdmin={isAdminVerified}
        supportPhone={storeSettings.supportPhone}
      />

      <QuickViewModal
        product={quickViewProduct}
        isWishlisted={quickViewProduct ? wishlist.includes(quickViewProduct.id) : false}
        onClose={() => setQuickViewProduct(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={(p, sz, col, qty) => {
          handleAddToCart(p, sz, col, qty, false);
          setQuickViewProduct(null);
        }}
        onViewFullProduct={handleSelectProduct}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        user={currentUser}
        storeSettings={storeSettings}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        reason={authModalReason}
        onClose={() => {
          pendingRedirectRef.current = 'none';
          setIsAuthModalOpen(false);
        }}
        onSuccess={handleAuthSuccess}
      />

      <AtelierToast
        notice={isCartOpen || isAuthModalOpen ? null : toastNotice}
        onDismiss={() => setToastNotice(null)}
        onOpenBag={() => {
          setToastNotice(null);
          setIsCartOpen(true);
        }}
        hasStickyBottomBar={Boolean(selectedProduct)}
      />

      <WhatsAppHelpButton
        phone={storeSettings.supportPhone}
        productName={selectedProduct?.name}
        hasMobileBottomBar={Boolean(selectedProduct)}
      />
    </div>
  );
}
