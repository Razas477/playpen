import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FolderTree,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  deleteCategoryAdmin,
  deleteProductAdmin,
  formatOrderTimestamp,
  saveCategoryAdmin,
  saveStoreSettingsAdmin,
  seedFullCatalogToFirestore,
  updateInventoryStockAdmin,
} from '../lib/storeDb';
import {
  AdminSidebarTab,
  CategoryDirectoryItem,
  InventoryRecord,
  OrderItemRecord,
  OrderRecord,
  OrderTrackingEvent,
  PageRoute,
  Product,
  StoreSettings,
  UserProfile,
} from '../types/store';
import { AdminCharts } from './AdminCharts';
import { AdminOrderDrawer } from './AdminOrderDrawer';
import { AdminProductModal } from './AdminProductModal';
import { ResilientImage } from './ResilientImage';

interface AdminDashboardProps {
  user: User | null;
  isAdminVerified: boolean;
  adminChecking: boolean;
  orders: OrderRecord[];
  orderItems: OrderItemRecord[];
  trackingEvents: OrderTrackingEvent[];
  customers: UserProfile[];
  products: Product[];
  categories: CategoryDirectoryItem[];
  inventory: InventoryRecord[];
  storeSettings: StoreSettings;
  onRequireSignIn: () => void;
  onSignOut: () => void;
  onReturnStorefront: (route?: PageRoute) => void;
}

const ORDER_STATUS_STYLE: Record<string, string> = {
  'Order Placed': 'bg-[#E6EAE4] text-[#3C4B48]',
  'Order Confirmed': 'bg-[#E6EAE4] text-[#142220]',
  Processing: 'bg-[#E4E8E2] text-[#3C4B48]',
  Packed: 'bg-[#D7DDD5] text-[#142220]',
  Shipped: 'bg-[#E4EEF2] text-[#22485A]',
  'Out for Delivery': 'bg-[#DAE8EE] text-[#1B3948]',
  Delivered: 'bg-[#E5EFEA] text-[#1E4639]',
  Cancelled: 'bg-[#F7E8E6] text-[#993A32]',
};

export function AdminDashboard({
  user,
  isAdminVerified,
  adminChecking,
  orders,
  orderItems,
  trackingEvents,
  customers,
  products,
  categories,
  inventory,
  storeSettings,
  onRequireSignIn,
  onSignOut,
  onReturnStorefront,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminSidebarTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Order filtering & detail drawer
  const [orderSearch, setOrderSearch] = useState('');
  const [orderEmirateFilter, setOrderEmirateFilter] = useState('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Products state
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);

  // Categories state
  const [catSlug, setCatSlug] = useState('');
  const [catLabel, setCatLabel] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catAge, setCatAge] = useState('');
  const [catGroup, setCatGroup] = useState<'playpen' | 'collection' | 'architectural'>('playpen');
  const [catImage, setCatImage] = useState('/assets/aistudio/image_9c066a0a.png');
  const [catOrder, setCatOrder] = useState('9');
  const [savingCat, setSavingCat] = useState(false);
  const [confirmDeleteCatSlug, setConfirmDeleteCatSlug] = useState<string | null>(null);

  // Inventory state
  const [invSearch, setInvSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [invDrafts, setInvDrafts] = useState<Record<string, number>>({});
  const [savingInvId, setSavingInvId] = useState<string | null>(null);

  // Customers state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerUid, setSelectedCustomerUid] = useState<string | null>(null);

  // Settings state
  const [freeThreshold, setFreeThreshold] = useState(
    String(storeSettings.freeShippingThresholdAed)
  );
  const [stdFee, setStdFee] = useState(String(storeSettings.standardDeliveryFeeAed));
  const [defaultCourier, setDefaultCourier] = useState(storeSettings.defaultCourierName);
  const [supportPhone, setSupportPhone] = useState(storeSettings.supportPhone || '');
  const [atelierLocation, setAtelierLocation] = useState(
    storeSettings.atelierLocation || ''
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);

  const [bannerMessage, setBannerMessage] = useState('');

  useEffect(() => {
    setFreeThreshold(String(storeSettings.freeShippingThresholdAed));
    setStdFee(String(storeSettings.standardDeliveryFeeAed));
    setDefaultCourier(storeSettings.defaultCourierName);
    setSupportPhone(storeSettings.supportPhone || '');
    setAtelierLocation(storeSettings.atelierLocation || '');
  }, [storeSettings]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  // KPI calculations from real Firestore data
  const metrics = useMemo(() => {
    const newOrders = orders.filter(
      (o) => o.orderStatus === 'Order Placed' || o.orderStatus === 'Order Confirmed'
    );
    const processingOrders = orders.filter(
      (o) => o.orderStatus === 'Processing' || o.orderStatus === 'Packed'
    );
    const shippedOrders = orders.filter(
      (o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Out for Delivery'
    );
    const deliveredOrders = orders.filter((o) => o.orderStatus === 'Delivered');
    const cancelledOrders = orders.filter((o) => o.orderStatus === 'Cancelled');
    const nonCancelled = orders.filter((o) => o.orderStatus !== 'Cancelled');
    const totalRevenueAed = nonCancelled.reduce(
      (sum, o) => sum + Number(o.totalAed || 0),
      0
    );
    const collectedRevenueAed = deliveredOrders.reduce(
      (sum, o) => sum + Number(o.totalAed || 0),
      0
    );
    const lowStockCount = inventory.filter((i) => i.stockQty <= 5).length;

    return {
      totalOrders: orders.length,
      newCount: newOrders.length,
      processingCount: processingOrders.length,
      shippedCount: shippedOrders.length,
      deliveredCount: deliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalRevenueAed,
      collectedRevenueAed,
      lowStockCount,
    };
  }, [orders, customers.length, products.length, inventory]);

  // Filtered Orders based on active sidebar bucket + search + emirate
  const filteredOrders = useMemo(() => {
    let base = orders;
    if (activeTab === 'new-orders') {
      base = base.filter(
        (o) => o.orderStatus === 'Order Placed' || o.orderStatus === 'Order Confirmed'
      );
    } else if (activeTab === 'processing-orders') {
      base = base.filter(
        (o) => o.orderStatus === 'Processing' || o.orderStatus === 'Packed'
      );
    } else if (activeTab === 'shipped-orders') {
      base = base.filter(
        (o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Out for Delivery'
      );
    } else if (activeTab === 'delivered-orders') {
      base = base.filter((o) => o.orderStatus === 'Delivered');
    } else if (activeTab === 'cancelled-orders') {
      base = base.filter((o) => o.orderStatus === 'Cancelled');
    }

    if (orderEmirateFilter !== 'All') {
      base = base.filter((o) => o.emirate === orderEmirateFilter);
    }

    const q = orderSearch.trim().toLowerCase();
    if (q) {
      base = base.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          (o.trackingNumber || '').toLowerCase().includes(q)
      );
    }
    return base;
  }, [orders, activeTab, orderEmirateFilter, orderSearch]);

  // Customer summaries combining `users` + `orders`
  const customerRows = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return customers
      .map((c) => {
        const custOrders = orders.filter((o) => o.userId === c.uid);
        const totalSpendAed = custOrders
          .filter((o) => o.orderStatus !== 'Cancelled')
          .reduce((sum, o) => sum + Number(o.totalAed || 0), 0);
        return {
          ...c,
          orderCount: custOrders.length,
          totalSpendAed,
          custOrders,
        };
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.displayName.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          (row.phone || '').toLowerCase().includes(q)
        );
      });
  }, [customers, orders, customerSearch]);

  const selectedCustomer = useMemo(
    () => customerRows.find((c) => c.uid === selectedCustomerUid) || null,
    [customerRows, selectedCustomerUid]
  );

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q)
      );
    });
  }, [products, productSearch, productCategoryFilter]);

  // Filtered Inventory
  const productNameMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products]
  );

  const filteredInventory = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return inventory.filter((row) => {
      if (lowStockOnly && row.stockQty > 5) return false;
      if (!q) return true;
      const pName = (productNameMap.get(row.productId) || '').toLowerCase();
      return (
        row.sku.toLowerCase().includes(q) ||
        pName.includes(q) ||
        row.sizeCode.toLowerCase().includes(q) ||
        row.colorName.toLowerCase().includes(q)
      );
    });
  }, [inventory, invSearch, lowStockOnly, productNameMap]);

  // Sales Reports breakdowns
  const salesAnalytics = useMemo(() => {
    const activeOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
    const emirateMap = new Map<string, { orders: number; revenue: number }>();
    for (const o of activeOrders) {
      const prev = emirateMap.get(o.emirate) || { orders: 0, revenue: 0 };
      prev.orders += 1;
      prev.revenue += Number(o.totalAed || 0);
      emirateMap.set(o.emirate, prev);
    }
    const byEmirate = Array.from(emirateMap.entries())
      .map(([emirate, stats]) => ({ emirate, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);

    const prodCatMap = new Map(products.map((p) => [p.id, p.categoryLabel]));
    const catRevenue = new Map<string, { units: number; revenue: number }>();
    for (const o of activeOrders) {
      for (const item of o.itemsSummary || []) {
        const cat = prodCatMap.get(item.productId) || 'Playpen Collection';
        const prev = catRevenue.get(cat) || { units: 0, revenue: 0 };
        prev.units += Number(item.quantity || 0);
        prev.revenue += Number(item.lineTotalAed || 0);
        catRevenue.set(cat, prev);
      }
    }
    const byCategory = Array.from(catRevenue.entries())
      .map(([categoryLabel, stats]) => ({ categoryLabel, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);

    const aov =
      activeOrders.length > 0
        ? Math.round(metrics.totalRevenueAed / activeOrders.length)
        : 0;

    return { byEmirate, byCategory, aov };
  }, [orders, products, metrics.totalRevenueAed]);

  const handleExportCsv = () => {
    const headers = [
      'OrderNumber',
      'OrderDate',
      'CustomerName',
      'Email',
      'Phone',
      'Emirate',
      'ItemsCount',
      'SubtotalAED',
      'DeliveryFeeAED',
      'TotalAED',
      'PaymentMethod',
      'PaymentStatus',
      'OrderStatus',
      'CourierName',
      'TrackingNumber',
    ];
    const escapeCell = (val: unknown) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = orders.map((o) =>
      [
        o.orderNumber,
        formatOrderTimestamp(o.createdAt),
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.emirate,
        o.itemCount,
        o.subtotalAed,
        o.deliveryFeeAed,
        o.totalAed,
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
        o.courierName || '',
        o.trackingNumber || '',
      ]
        .map(escapeCell)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playpen-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Security Gate: Never expose Admin UI unless backend Firestore verification succeeded
  if (adminChecking) {
    return (
      <section className="min-h-[70vh] bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#142220]/20 border-t-[#142220] animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4A5B57]">
            Checking Admin Access...
          </p>
        </div>
      </section>
    );
  }

  if (!user || !isAdminVerified) {
    return (
      <section className="min-h-[75vh] bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-[#F1F3EF] border border-[#142220]/12 p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#E6EAE4] flex items-center justify-center text-[#142220]">
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4A5B57]">
            Admin Access Only
          </p>
          <h1 className="font-serif text-3xl font-bold text-[#142220]">
            Restricted Admin Area
          </h1>
          <p className="text-sm text-[#3C4B48] leading-relaxed">
            {user
              ? 'This account does not have admin permission. Customer accounts cannot open the PLAYPEN store dashboard.'
              : 'Sign in with an authorized admin Google account to manage orders, products, and settings.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            {!user && (
              <button
                type="button"
                onClick={onRequireSignIn}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer"
              >
                Continue with Google
              </button>
            )}
            <button
              type="button"
              onClick={() => onReturnStorefront('home')}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-full border border-[#142220]/20 text-xs font-semibold text-[#142220] hover:bg-[#E6EAE4] cursor-pointer"
            >
              Back to Store
            </button>
          </div>
        </div>
      </section>
    );
  }

  const sidebarItems: Array<{
    id: AdminSidebarTab;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'all-orders', label: 'All Orders', icon: ShoppingBag, badge: metrics.totalOrders },
    { id: 'new-orders', label: 'New Orders', icon: Clock, badge: metrics.newCount },
    { id: 'processing-orders', label: 'Processing Orders', icon: Package, badge: metrics.processingCount },
    { id: 'shipped-orders', label: 'Shipped Orders', icon: Truck, badge: metrics.shippedCount },
    { id: 'delivered-orders', label: 'Delivered Orders', icon: PackageCheck, badge: metrics.deliveredCount },
    { id: 'cancelled-orders', label: 'Cancelled Orders', icon: XCircle, badge: metrics.cancelledCount },
    { id: 'products', label: 'Products', icon: Boxes, badge: metrics.totalProducts },
    { id: 'categories', label: 'Categories', icon: FolderTree, badge: categories.length },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: metrics.lowStockCount > 0 ? metrics.lowStockCount : undefined },
    { id: 'customers', label: 'Customers', icon: Users, badge: metrics.totalCustomers },
    { id: 'sales-reports', label: 'Sales Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isOrderListTab =
    activeTab === 'all-orders' ||
    activeTab === 'new-orders' ||
    activeTab === 'processing-orders' ||
    activeTab === 'shipped-orders' ||
    activeTab === 'delivered-orders' ||
    activeTab === 'cancelled-orders';

  const currentTabTitle =
    sidebarItems.find((s) => s.id === activeTab)?.label || 'Dashboard Overview';

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-[#142220]/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4A5B57]">
          PLAYPEN · Store Owner
        </p>
        <p className="mt-1 font-serif text-2xl font-bold text-[#142220]">
          PLAYPEN Admin
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#2B5B51] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Admin</span>
        </div>
      </div>

      <nav aria-label="Admin Sidebar" className="flex-1 overflow-y-auto p-3 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileSidebarOpen(false);
              }}
              className={`w-full min-h-[44px] flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#142220] text-[#FAFAF8]'
                  : 'text-[#3C4B48] hover:bg-[#E6EAE4] hover:text-[#142220]'
              }`}
            >
              <span className="inline-flex items-center gap-2.5 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.badge === 'number' && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums ${
                    active
                      ? 'bg-[#FAFAF8]/20 text-[#FAFAF8]'
                      : 'bg-[#D7DDD5] text-[#142220]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#142220]/10 space-y-1.5 pb-safe">
        <button
          type="button"
          onClick={() => onReturnStorefront('home')}
          className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#142220] hover:bg-[#E6EAE4] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#993A32] hover:bg-[#F7E8E6] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#142220] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 bg-[#F1F3EF] border-r border-[#142220]/10 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-[#142220]/40"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#F1F3EF] h-full shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close admin sidebar"
              className="absolute top-3 right-3 w-11 h-11 rounded-full border border-[#142220]/15 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#FAFAF8]/92 backdrop-blur-md border-b border-[#142220]/10 px-4 sm:px-8 h-14 lg:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open admin navigation"
              className="lg:hidden w-11 h-11 rounded-full border border-[#142220]/15 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="font-serif text-lg sm:text-2xl font-bold truncate">
                {currentTabTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E6EAE4] text-xs font-medium text-[#3C4B48]">
              <span className="w-2 h-2 rounded-full bg-[#2B5B51]" />
              <span>{user.email}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              aria-label="Add New Playpen"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer"
            >
              <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto space-y-8">
          {bannerMessage && (
            <div className="rounded-2xl bg-[#E5EFEA] border border-[#2B5B51]/20 px-4 py-3 text-xs text-[#1E4639] flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bannerMessage}</span>
              </span>
              <button
                type="button"
                onClick={() => setBannerMessage('')}
                className="text-[#1E4639] hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
                {[
                  {
                    label: 'Total Revenue',
                    value: `AED ${metrics.totalRevenueAed.toLocaleString()}`,
                    sub: `Collected AED ${metrics.collectedRevenueAed.toLocaleString()}`,
                    onClick: () => setActiveTab('sales-reports'),
                  },
                  {
                    label: 'Total Orders',
                    value: metrics.totalOrders,
                    sub: `${metrics.cancelledCount} cancelled`,
                    onClick: () => setActiveTab('all-orders'),
                  },
                  {
                    label: 'New Orders',
                    value: metrics.newCount,
                    sub: 'Awaiting preparation',
                    onClick: () => setActiveTab('new-orders'),
                  },
                  {
                    label: 'Processing Orders',
                    value: metrics.processingCount,
                    sub: 'Being checked & packed',
                    onClick: () => setActiveTab('processing-orders'),
                  },
                  {
                    label: 'Shipped Orders',
                    value: metrics.shippedCount,
                    sub: 'With UAE courier',
                    onClick: () => setActiveTab('shipped-orders'),
                  },
                  {
                    label: 'Delivered Orders',
                    value: metrics.deliveredCount,
                    sub: 'Completed deliveries',
                    onClick: () => setActiveTab('delivered-orders'),
                  },
                  {
                    label: 'Total Customers',
                    value: metrics.totalCustomers,
                    sub: 'Signed-in accounts',
                    onClick: () => setActiveTab('customers'),
                  },
                  {
                    label: 'Total Products',
                    value: metrics.totalProducts,
                    sub: `${metrics.lowStockCount} low-stock items`,
                    onClick: () => setActiveTab('products'),
                  },
                ].map((kpi) => (
                  <button
                    key={kpi.label}
                    type="button"
                    onClick={kpi.onClick}
                    className="text-left rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 hover:border-[#142220]/30 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#4A5B57]">
                      {kpi.label}
                    </p>
                    <p className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#142220] tabular-nums">
                      {kpi.value}
                    </p>
                    <p className="mt-1 text-xs text-[#4A5B57]">{kpi.sub}</p>
                  </button>
                ))}
              </div>

              <AdminCharts orders={orders} orderItems={orderItems} />

              {/* Recent Live Orders */}
              <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4A5B57]">
                      Recent Activity
                    </p>
                    <h2 className="font-serif text-2xl font-bold">
                      Latest Orders
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('all-orders')}
                    className="min-h-[40px] text-xs font-semibold underline text-[#142220] cursor-pointer"
                  >
                    View All Orders
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[#4A5B57]">
                    No orders yet. New customer orders will appear here automatically.
                  </p>
                ) : (
                  <>
                    {/* Mobile Stacked Cards */}
                    <div className="lg:hidden space-y-3">
                      {orders.slice(0, 6).map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrderId(ord.id)}
                          className="rounded-2xl bg-[#FAFAF8] border border-[#142220]/10 p-4 space-y-3 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold tabular-nums text-[#142220]">
                                  #{ord.orderNumber}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                    ORDER_STATUS_STYLE[ord.orderStatus] ||
                                    'bg-[#E6EAE4] text-[#142220]'
                                  }`}
                                >
                                  {ord.orderStatus}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-semibold text-[#142220] truncate">
                                {ord.customerName}
                              </p>
                              <p className="text-xs text-[#4A5B57] truncate">
                                {ord.emirate} · {ord.itemCount} {ord.itemCount === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                            <span className="text-sm font-bold tabular-nums text-[#142220] shrink-0">
                              AED {ord.totalAed}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(ord.id);
                            }}
                            className="w-full min-h-[44px] px-4 py-2 rounded-full border border-[#142220]/20 text-xs font-semibold text-[#142220] hover:bg-[#142220] hover:text-[#FAFAF8] transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Orders Table (Intact) */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#142220]/10 text-[#4A5B57]">
                            <th className="py-3 pr-4 font-semibold">Order ID</th>
                            <th className="py-3 pr-4 font-semibold">Customer</th>
                            <th className="py-3 pr-4 font-semibold">Emirate</th>
                            <th className="py-3 pr-4 font-semibold">Items</th>
                            <th className="py-3 pr-4 font-semibold">Total</th>
                            <th className="py-3 pr-4 font-semibold">Status</th>
                            <th className="py-3 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#142220]/10">
                          {orders.slice(0, 6).map((ord) => (
                            <tr
                              key={ord.id}
                              onClick={() => setSelectedOrderId(ord.id)}
                              className="hover:bg-[#E6EAE4]/70 cursor-pointer"
                            >
                              <td className="py-3 pr-4 font-semibold tabular-nums">
                                #{ord.orderNumber}
                              </td>
                              <td className="py-3 pr-4">
                                <p className="font-semibold text-[#142220]">
                                  {ord.customerName}
                                </p>
                                <p className="text-xs text-[#4A5B57]">
                                  {ord.customerEmail}
                                </p>
                              </td>
                              <td className="py-3 pr-4">{ord.emirate}</td>
                              <td className="py-3 pr-4 tabular-nums">{ord.itemCount}</td>
                              <td className="py-3 pr-4 font-semibold tabular-nums">
                                AED {ord.totalAed}
                              </td>
                              <td className="py-3 pr-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                                    ORDER_STATUS_STYLE[ord.orderStatus] ||
                                    'bg-[#E6EAE4] text-[#142220]'
                                  }`}
                                >
                                  {ord.orderStatus}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrderId(ord.id);
                                  }}
                                  className="px-3 py-1.5 rounded-full border border-[#142220]/20 text-[11px] font-medium hover:bg-[#142220] hover:text-[#FAFAF8] transition-colors cursor-pointer"
                                >
                                  Manage
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2–7. ORDERS MANAGEMENT TABLES */}
          {isOrderListTab && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#5C6D69] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID, customer name, email, phone, tracking..."
                    className="w-full min-h-[44px] pl-11 pr-4 py-2.5 rounded-full bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/12 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <select
                    value={orderEmirateFilter}
                    onChange={(e) => setOrderEmirateFilter(e.target.value)}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-full bg-[#F1F3EF] text-base sm:text-xs font-medium border border-[#142220]/12 focus:outline-none"
                  >
                    <option value="All">All UAE Emirates</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 overflow-hidden">
                {filteredOrders.length === 0 ? (
                  <div className="p-14 text-center text-sm text-[#5C6D69]">
                    No orders match this status or filter right now.
                  </div>
                ) : (
                  <>
                    {/* Mobile Orders Stacked Cards */}
                    <div className="lg:hidden divide-y divide-[#142220]/10">
                      {filteredOrders.map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrderId(ord.id)}
                          className="p-4 space-y-3 hover:bg-[#E6EAE4]/70 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold tabular-nums text-[#142220]">
                                  #{ord.orderNumber}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                    ORDER_STATUS_STYLE[ord.orderStatus] ||
                                    'bg-[#E6EAE4] text-[#142220]'
                                  }`}
                                >
                                  {ord.orderStatus}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-[#142220] truncate">
                                {ord.customerName}
                              </p>
                              <p className="text-[11px] text-[#5C6D69] truncate">
                                {ord.customerEmail} · {ord.customerPhone}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block text-sm font-semibold tabular-nums text-[#142220]">
                                AED {ord.totalAed}
                              </span>
                              <span className="text-[11px] text-[#5C6D69]">
                                {formatOrderTimestamp(ord.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 rounded-xl bg-[#FAFAF8] p-2.5 border border-[#142220]/8">
                            {ord.itemsSummary?.[0]?.productImage && (
                              <ResilientImage
                                src={ord.itemsSummary[0].productImage}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-[#142220] truncate">
                                {ord.itemsSummary?.map((s) => s.productName).join(', ')}
                              </p>
                              <p className="text-[11px] text-[#5C6D69] truncate">
                                Qty {ord.itemCount} · {ord.emirate} · {ord.paymentMethod} ({ord.paymentStatus})
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(ord.id);
                            }}
                            className="w-full min-h-[44px] px-4 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-medium hover:bg-[#1F3532] cursor-pointer"
                          >
                            Manage Order
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Orders Table (Intact) */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#E6EAE4]/70 border-b border-[#142220]/10 text-[#5C6D69]">
                          <tr>
                            <th className="py-3.5 px-4 font-medium">Order ID</th>
                            <th className="py-3.5 px-4 font-medium">Customer Name</th>
                            <th className="py-3.5 px-4 font-medium">Email</th>
                            <th className="py-3.5 px-4 font-medium">Phone</th>
                            <th className="py-3.5 px-4 font-medium">Order Date</th>
                            <th className="py-3.5 px-4 font-medium">Products</th>
                            <th className="py-3.5 px-4 font-medium">Qty</th>
                            <th className="py-3.5 px-4 font-medium">Total Amount</th>
                            <th className="py-3.5 px-4 font-medium">Payment Method</th>
                            <th className="py-3.5 px-4 font-medium">Payment Status</th>
                            <th className="py-3.5 px-4 font-medium">Order Status</th>
                            <th className="py-3.5 px-4 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#142220]/10">
                          {filteredOrders.map((ord) => (
                            <tr
                              key={ord.id}
                              onClick={() => setSelectedOrderId(ord.id)}
                              className="hover:bg-[#E6EAE4]/80 transition-colors cursor-pointer"
                            >
                              <td className="py-3.5 px-4 font-semibold tabular-nums text-[#142220]">
                                #{ord.orderNumber}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-[#142220]">
                                {ord.customerName}
                              </td>
                              <td className="py-3.5 px-4 text-[#3C4B48]">
                                {ord.customerEmail}
                              </td>
                              <td className="py-3.5 px-4 text-[#3C4B48] tabular-nums">
                                {ord.customerPhone}
                              </td>
                              <td className="py-3.5 px-4 text-[#5C6D69]">
                                {formatOrderTimestamp(ord.createdAt)}
                              </td>
                              <td className="py-3.5 px-4 max-w-[220px]">
                                <div className="flex items-center gap-2">
                                  {ord.itemsSummary?.[0]?.productImage && (
                                    <ResilientImage
                                      src={ord.itemsSummary[0].productImage}
                                      alt=""
                                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                                    />
                                  )}
                                  <span className="truncate text-[#142220]">
                                    {ord.itemsSummary
                                      ?.map((s) => s.productName)
                                      .join(', ')}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 tabular-nums">
                                {ord.itemCount}
                              </td>
                              <td className="py-3.5 px-4 font-semibold tabular-nums text-[#142220]">
                                AED {ord.totalAed}
                              </td>
                              <td className="py-3.5 px-4 text-[#3C4B48]">
                                {ord.paymentMethod}
                              </td>
                              <td className="py-3.5 px-4 text-[#3C4B48]">
                                {ord.paymentStatus}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                                    ORDER_STATUS_STYLE[ord.orderStatus] ||
                                    'bg-[#E6EAE4] text-[#142220]'
                                  }`}
                                >
                                  {ord.orderStatus}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrderId(ord.id);
                                  }}
                                  className="px-3.5 py-1.5 rounded-full bg-[#142220] text-[#FAFAF8] text-[11px] font-medium hover:bg-[#1F3532] cursor-pointer"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 8. PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
                  <div className="relative flex-1 min-w-0 sm:min-w-[220px] max-w-md">
                    <Search className="w-4 h-4 text-[#5C6D69] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search playpen name, material, collection..."
                      className="w-full min-h-[44px] pl-11 pr-4 py-2.5 rounded-full bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/12 focus:outline-none"
                    />
                  </div>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-full bg-[#F1F3EF] text-base sm:text-xs font-medium border border-[#142220]/12 focus:outline-none"
                  >
                    <option value="all">All Playpen Collections</option>
                    <option value="wooden">Wooden Playpens</option>
                    <option value="foldable">Foldable Playpens</option>
                    <option value="mesh">Mesh Playpens</option>
                    <option value="large">Large Playpens</option>
                    <option value="modular">Modular Playpens</option>
                    <option value="travel">Travel Playpens</option>
                    <option value="premium">Premium Playpens</option>
                    <option value="signature">Signature Collection</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductModalOpen(true);
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-medium hover:bg-[#1F3532] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Playpen</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((p) => {
                  const invRows = inventory.filter((i) => i.productId === p.id);
                  const totalStock = invRows.reduce((s, r) => s + r.stockQty, 0);
                  return (
                    <div
                      key={p.id}
                      className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-4 flex flex-col justify-between gap-4"
                    >
                      <div className="flex gap-4">
                        <ResilientImage
                          src={p.image}
                          alt={p.name}
                          className="w-24 h-28 rounded-2xl object-cover bg-[#E6EAE4] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {p.isFeatured && (
                              <span className="px-2 py-0.5 rounded-full bg-[#142220] text-[#FAFAF8] text-[11px]">
                                Featured
                              </span>
                            )}
                            {p.isNewArrival && (
                              <span className="px-2 py-0.5 rounded-full bg-[#D7DDD5] text-[#142220] text-[11px]">
                                New Arrival
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif text-lg font-bold leading-snug text-[#142220]">
                            {p.name}
                          </h3>
                          <p className="text-xs text-[#4A5B57] truncate">
                            {p.categoryLabel}
                          </p>
                          <p className="mt-1.5 text-sm font-bold text-[#142220] tabular-nums">
                            AED {p.priceAed}
                          </p>
                          <p className="mt-1 text-xs text-[#4A5B57]">
                            {p.sizes.length} sizes · {p.colors.length} colors ·{' '}
                            {invRows.length > 0 ? `${totalStock} in stock` : 'Synced'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#142220]/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setProductModalOpen(true);
                          }}
                          className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAFAF8] border border-[#142220]/15 text-xs font-semibold hover:bg-[#E6EAE4] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {confirmDeleteProductId === p.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteProductAdmin(p.id);
                                setConfirmDeleteProductId(null);
                                setBannerMessage(`Deleted "${p.name}" from store catalog.`);
                              }}
                              className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#993A32] text-white text-xs font-semibold cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProductId(null)}
                              className="min-h-[40px] px-2 text-xs text-[#4A5B57] hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProductId(p.id)}
                            className="min-h-[44px] inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold text-[#993A32] hover:bg-[#F7E8E6] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.route}
                    className="rounded-2xl bg-[#F1F3EF] border border-[#142220]/10 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <ResilientImage
                        src={cat.image}
                        alt={cat.label}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-bold truncate">
                            {cat.label}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-[#E6EAE4] text-[11px] uppercase tracking-wider text-[#4A5B57]">
                            {cat.group}
                          </span>
                        </div>
                        <p className="text-xs text-[#3C4B48] truncate">
                          {cat.shortDesc}
                        </p>
                        <p className="text-xs text-[#4A5B57]">
                          Slug: {cat.route} · {cat.ageOrNote}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setCatSlug(cat.route);
                          setCatLabel(cat.label);
                          setCatDesc(cat.shortDesc);
                          setCatAge(cat.ageOrNote);
                          setCatGroup(cat.group);
                          setCatImage(cat.image);
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-[#142220]/15 text-xs hover:bg-[#E6EAE4] cursor-pointer"
                      >
                        Edit
                      </button>
                      {confirmDeleteCatSlug === cat.route ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteCategoryAdmin(cat.route);
                            setConfirmDeleteCatSlug(null);
                            setBannerMessage(`Category "${cat.label}" removed.`);
                          }}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#993A32] text-white text-xs cursor-pointer"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCatSlug(cat.route)}
                          className="w-10 h-10 rounded-full text-[#993A32] hover:bg-[#F7E8E6] flex items-center justify-center cursor-pointer"
                          aria-label={`Delete ${cat.label}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-5">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingCat(true);
                    try {
                      await saveCategoryAdmin({
                        slug: catSlug,
                        label: catLabel,
                        shortDesc: catDesc,
                        ageOrNote: catAge,
                        group: catGroup,
                        image: catImage,
                        displayOrder: Number(catOrder || 10),
                      });
                      setBannerMessage(`Saved category "${catLabel}".`);
                      setCatSlug('');
                      setCatLabel('');
                      setCatDesc('');
                      setCatAge('');
                    } finally {
                      setSavingCat(false);
                    }
                  }}
                  className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-6 space-y-4 lg:sticky lg:top-24"
                >
                  <h2 className="font-serif text-2xl font-bold">
                    Add or Update Category
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                        Category Slug *
                      </label>
                      <input
                        required
                        type="text"
                        value={catSlug}
                        onChange={(e) => setCatSlug(e.target.value)}
                        placeholder="nursery-gifts"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                        Display Name *
                      </label>
                      <input
                        required
                        type="text"
                        value={catLabel}
                        onChange={(e) => setCatLabel(e.target.value)}
                        placeholder="Nursery Gifts"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="Playpens and baby gifts for home"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-[#5C6D69] mb-1">
                        Age / Note
                      </label>
                      <input
                        type="text"
                        value={catAge}
                        onChange={(e) => setCatAge(e.target.value)}
                        placeholder="0–36M"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#5C6D69] mb-1">
                        Group
                      </label>
                      <select
                        value={catGroup}
                        onChange={(e) =>
                          setCatGroup(
                            e.target.value as 'playpen' | 'collection' | 'architectural'
                          )
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                      >
                        <option value="playpen">Playpen</option>
                        <option value="collection">Collection</option>
                        <option value="architectural">Architectural</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#5C6D69] mb-1">
                        Order
                      </label>
                      <input
                        type="number"
                        value={catOrder}
                        onChange={(e) => setCatOrder(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#5C6D69] mb-1">
                      Category Image URL
                    </label>
                    <input
                      type="text"
                      value={catImage}
                      onChange={(e) => setCatImage(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-xs border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingCat}
                    className="w-full min-h-[48px] py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-medium hover:bg-[#1F3532] cursor-pointer disabled:opacity-50"
                  >
                    {savingCat ? 'Saving Category...' : 'Save Category'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 10. INVENTORY MANAGEMENT */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#5C6D69] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    placeholder="Filter by SKU, product name, size, color..."
                    className="w-full min-h-[44px] pl-11 pr-4 py-2.5 rounded-full bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/12 focus:outline-none"
                  />
                </div>
                <label className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-full bg-[#F1F3EF] text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                    className="accent-[#142220] w-4 h-4"
                  />
                  <span>Low Stock Only (≤ 5 units)</span>
                </label>
              </div>

              <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 overflow-hidden">
                {filteredInventory.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <p className="text-sm text-[#5C6D69]">
                      No inventory records match this filter.
                    </p>
                    {inventory.length === 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          setSyncingCatalog(true);
                          await seedFullCatalogToFirestore();
                          setSyncingCatalog(false);
                          setBannerMessage('Full catalog & inventory SKUs seeded into Firestore.');
                        }}
                        className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-medium cursor-pointer"
                      >
                        {syncingCatalog ? 'Syncing...' : 'Seed Catalog Inventory SKUs'}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Mobile Inventory Cards */}
                    <div className="lg:hidden divide-y divide-[#142220]/10">
                      {filteredInventory.slice(0, 80).map((row) => {
                        const draftQty = invDrafts[row.id] ?? row.stockQty;
                        const isLow = draftQty <= 5;
                        return (
                          <div key={row.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-[#E6EAE4] font-mono text-[10px] text-[#3C4B48]">
                                  {row.sku}
                                </span>
                                <p className="mt-1 text-sm font-medium text-[#142220]">
                                  {productNameMap.get(row.productId) || row.productId}
                                </p>
                                <p className="text-xs text-[#5C6D69]">
                                  {row.sizeCode} · {row.colorName}
                                </p>
                              </div>
                              <span className="text-[11px] text-[#5C6D69] shrink-0 tabular-nums">
                                Reserved: {row.reservedQty}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={10000}
                                value={draftQty}
                                onChange={(e) =>
                                  setInvDrafts((prev) => ({
                                    ...prev,
                                    [row.id]: Number(e.target.value),
                                  }))
                                }
                                aria-label={`Stock quantity for ${row.sku}`}
                                className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-base tabular-nums border focus:outline-none ${
                                  isLow
                                    ? 'bg-[#F7E8E6] border-[#993A32]/30 text-[#993A32] font-semibold'
                                    : 'bg-[#FAFAF8] border-[#142220]/15 text-[#142220]'
                                }`}
                              />
                              <button
                                type="button"
                                disabled={savingInvId === row.id}
                                onClick={async () => {
                                  setSavingInvId(row.id);
                                  const nextQty = draftQty + 10;
                                  setInvDrafts((prev) => ({ ...prev, [row.id]: nextQty }));
                                  await updateInventoryStockAdmin(
                                    row.id,
                                    nextQty,
                                    row.reservedQty
                                  );
                                  setSavingInvId(null);
                                }}
                                className="min-h-[44px] px-4 py-2 rounded-full border border-[#142220]/20 text-xs font-medium hover:bg-[#E6EAE4] cursor-pointer"
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                disabled={savingInvId === row.id}
                                onClick={async () => {
                                  setSavingInvId(row.id);
                                  await updateInventoryStockAdmin(
                                    row.id,
                                    draftQty,
                                    row.reservedQty
                                  );
                                  setSavingInvId(null);
                                  setBannerMessage(`Updated stock for ${row.sku}.`);
                                }}
                                className="min-h-[44px] px-5 py-2 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-medium hover:bg-[#1F3532] cursor-pointer"
                              >
                                {savingInvId === row.id ? '...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Inventory Table (Intact) */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#E6EAE4]/70 border-b border-[#142220]/10 text-[#4A5B57]">
                          <tr>
                            <th className="py-3 px-4 font-semibold">SKU</th>
                            <th className="py-3 px-4 font-semibold">Product</th>
                            <th className="py-3 px-4 font-semibold">Size</th>
                            <th className="py-3 px-4 font-semibold">Color</th>
                            <th className="py-3 px-4 font-semibold">Reserved</th>
                            <th className="py-3 px-4 font-semibold">Available Stock</th>
                            <th className="py-3 px-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#142220]/10">
                          {filteredInventory.slice(0, 80).map((row) => {
                            const draftQty =
                              invDrafts[row.id] ?? row.stockQty;
                            const isLow = draftQty <= 5;
                            return (
                              <tr key={row.id} className="hover:bg-[#E6EAE4]/50">
                                <td className="py-3 px-4 font-mono text-[11px] text-[#3C4B48]">
                                  {row.sku}
                                </td>
                                <td className="py-3 px-4 font-medium text-[#142220]">
                                  {productNameMap.get(row.productId) || row.productId}
                                </td>
                                <td className="py-3 px-4">{row.sizeCode}</td>
                                <td className="py-3 px-4">{row.colorName}</td>
                                <td className="py-3 px-4 tabular-nums text-[#5C6D69]">
                                  {row.reservedQty}
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="number"
                                    min={0}
                                    max={10000}
                                    value={draftQty}
                                    onChange={(e) =>
                                      setInvDrafts((prev) => ({
                                        ...prev,
                                        [row.id]: Number(e.target.value),
                                      }))
                                    }
                                    className={`w-20 px-2.5 py-1.5 rounded-lg text-xs tabular-nums border focus:outline-none ${
                                      isLow
                                        ? 'bg-[#F7E8E6] border-[#993A32]/30 text-[#993A32] font-semibold'
                                        : 'bg-[#FAFAF8] border-[#142220]/15 text-[#142220]'
                                    }`}
                                  />
                                </td>
                                <td className="py-3 px-4 text-right space-x-2">
                                  <button
                                    type="button"
                                    disabled={savingInvId === row.id}
                                    onClick={async () => {
                                      setSavingInvId(row.id);
                                      const nextQty = draftQty + 10;
                                      setInvDrafts((prev) => ({ ...prev, [row.id]: nextQty }));
                                      await updateInventoryStockAdmin(
                                        row.id,
                                        nextQty,
                                        row.reservedQty
                                      );
                                      setSavingInvId(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-full border border-[#142220]/20 text-[11px] hover:bg-[#E6EAE4] cursor-pointer"
                                  >
                                    +10
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingInvId === row.id}
                                    onClick={async () => {
                                      setSavingInvId(row.id);
                                      await updateInventoryStockAdmin(
                                        row.id,
                                        draftQty,
                                        row.reservedQty
                                      );
                                      setSavingInvId(null);
                                      setBannerMessage(`Updated stock for ${row.sku}.`);
                                    }}
                                    className="px-3 py-1.5 rounded-full bg-[#142220] text-[#FAFAF8] text-[11px] font-medium hover:bg-[#1F3532] cursor-pointer"
                                  >
                                    {savingInvId === row.id ? '...' : 'Save'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 11. CUSTOMERS MANAGEMENT */}
          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div
                className={`lg:col-span-7 space-y-4 ${
                  selectedCustomer ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className="relative">
                  <Search className="w-4 h-4 text-[#5C6D69] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search registered customers by name, email, or phone..."
                    className="w-full min-h-[44px] pl-11 pr-4 py-2.5 rounded-full bg-[#F1F3EF] text-base sm:text-xs border border-[#142220]/12 focus:outline-none"
                  />
                </div>

                <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 overflow-hidden">
                  {customerRows.length === 0 ? (
                    <div className="p-12 text-center text-sm text-[#5C6D69]">
                      No registered customers found.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#142220]/10">
                      {customerRows.map((cust) => (
                        <button
                          key={cust.uid}
                          type="button"
                          onClick={() => setSelectedCustomerUid(cust.uid)}
                          className={`w-full min-h-[64px] p-4 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer ${
                            selectedCustomerUid === cust.uid
                              ? 'bg-[#E6EAE4]'
                              : 'hover:bg-[#E6EAE4]/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {cust.photoURL ? (
                              <img
                                src={cust.photoURL}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#D7DDD5] flex items-center justify-center font-serif text-lg shrink-0">
                                {cust.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#142220] truncate">
                                {cust.displayName}
                              </p>
                              <p className="text-xs text-[#5C6D69] truncate">
                                {cust.email} · {cust.phone || 'No phone saved'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 tabular-nums">
                            <p className="text-xs font-semibold text-[#142220]">
                              AED {cust.totalSpendAed.toLocaleString()}
                            </p>
                            <p className="text-[11px] text-[#5C6D69]">
                              {cust.orderCount} {cust.orderCount === 1 ? 'order' : 'orders'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                {selectedCustomer ? (
                  <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-5 sm:p-6 space-y-5 lg:sticky lg:top-24">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerUid(null)}
                      className="lg:hidden inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full border border-[#142220]/20 text-xs font-medium text-[#142220] hover:bg-[#E6EAE4] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to All Customers</span>
                    </button>

                    <div className="flex items-center gap-3.5">
                      {selectedCustomer.photoURL ? (
                        <img
                          src={selectedCustomer.photoURL}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#D7DDD5] flex items-center justify-center font-serif text-xl shrink-0">
                          {selectedCustomer.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-serif text-2xl font-bold truncate">
                          {selectedCustomer.displayName}
                        </h3>
                        <p className="text-xs text-[#4A5B57] truncate">
                          {selectedCustomer.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-2xl bg-[#FAFAF8] p-3">
                        <p className="text-[#4A5B57] font-medium">Total Orders</p>
                        <p className="mt-1 font-serif text-xl font-bold tabular-nums">
                          {selectedCustomer.orderCount}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#FAFAF8] p-3">
                        <p className="text-[#4A5B57] font-medium">Total Spent</p>
                        <p className="mt-1 font-serif text-xl font-bold tabular-nums">
                          AED {selectedCustomer.totalSpendAed.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-[#3C4B48]">
                      <p>
                        <strong>Phone:</strong> {selectedCustomer.phone || 'Not provided yet'}
                      </p>
                      <p>
                        <strong>Preferred Emirate:</strong>{' '}
                        {selectedCustomer.preferredEmirate || 'Dubai'}
                      </p>
                      <p>
                        <strong>Member Since:</strong>{' '}
                        {formatOrderTimestamp(selectedCustomer.createdAt)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4A5B57]">
                        Order History
                      </p>
                      {selectedCustomer.custOrders.length === 0 ? (
                        <p className="text-xs text-[#4A5B57]">No orders placed yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedCustomer.custOrders.map((ord) => (
                            <button
                              key={ord.id}
                              type="button"
                              onClick={() => setSelectedOrderId(ord.id)}
                              className="w-full min-h-[48px] p-3 rounded-2xl bg-[#FAFAF8] hover:bg-[#E6EAE4] flex items-center justify-between text-xs text-left cursor-pointer"
                            >
                              <div>
                                <p className="font-semibold text-[#142220]">
                                  #{ord.orderNumber} · {ord.orderStatus}
                                </p>
                                <p className="text-xs text-[#4A5B57]">
                                  {formatOrderTimestamp(ord.createdAt)}
                                </p>
                              </div>
                              <span className="font-semibold tabular-nums">
                                AED {ord.totalAed}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:block rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-10 text-center text-xs text-[#4A5B57]">
                    Select a customer on the left to view their details and order history.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 12. SALES REPORTS */}
          {activeTab === 'sales-reports' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4A5B57]">
                    Sales Summary
                  </p>
                  <h2 className="font-serif text-2xl font-bold">
                    UAE Sales &amp; Cash on Delivery Summary
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Orders CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-1 min-[375px]:grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                <div className="rounded-3xl bg-[#F1F3EF] p-5">
                  <p className="text-xs font-medium text-[#4A5B57]">Total Order Value</p>
                  <p className="mt-1 font-serif text-2xl font-bold tabular-nums">
                    AED {metrics.totalRevenueAed.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-3xl bg-[#F1F3EF] p-5">
                  <p className="text-xs font-medium text-[#4A5B57]">Collected (Delivered)</p>
                  <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-[#1E4639]">
                    AED {metrics.collectedRevenueAed.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-3xl bg-[#F1F3EF] p-5">
                  <p className="text-xs font-medium text-[#4A5B57]">Pending Cash Collection</p>
                  <p className="mt-1 font-serif text-2xl font-bold tabular-nums">
                    AED{' '}
                    {Math.max(
                      0,
                      metrics.totalRevenueAed - metrics.collectedRevenueAed
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-3xl bg-[#F1F3EF] p-5">
                  <p className="text-xs font-medium text-[#4A5B57]">Average Order Value</p>
                  <p className="mt-1 font-serif text-2xl font-bold tabular-nums">
                    AED {salesAnalytics.aov.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 space-y-4">
                  <h3 className="font-serif text-xl font-bold">
                    Sales by Emirate
                  </h3>
                  {salesAnalytics.byEmirate.length === 0 ? (
                    <p className="text-xs text-[#4A5B57]">No active orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {salesAnalytics.byEmirate.map((row) => (
                        <div key={row.emirate} className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium text-[#142220]">
                              {row.emirate} ({row.orders} orders)
                            </span>
                            <span className="font-semibold tabular-nums">
                              AED {row.revenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#D7DDD5] overflow-hidden">
                            <div
                              style={{
                                width: `${Math.max(
                                  6,
                                  Math.round(
                                    (row.revenue /
                                      Math.max(1, metrics.totalRevenueAed)) *
                                      100
                                  )
                                )}%`,
                              }}
                              className="h-full bg-[#142220] rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 space-y-4">
                  <h3 className="font-serif text-xl font-bold">
                    Sales by Category
                  </h3>
                  {salesAnalytics.byCategory.length === 0 ? (
                    <p className="text-xs text-[#4A5B57]">No category sales yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {salesAnalytics.byCategory.map((row) => (
                        <div key={row.categoryLabel} className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium text-[#142220]">
                              {row.categoryLabel} ({row.units} units)
                            </span>
                            <span className="font-semibold tabular-nums">
                              AED {row.revenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#D7DDD5] overflow-hidden">
                            <div
                              style={{
                                width: `${Math.max(
                                  6,
                                  Math.round(
                                    (row.revenue /
                                      Math.max(1, metrics.totalRevenueAed)) *
                                      100
                                  )
                                )}%`,
                              }}
                              className="h-full bg-[#B88D52] rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 13. SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl space-y-6">
              <div className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E4639]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Admin Access Active</span>
                </div>
                <p className="text-sm text-[#3C4B48] leading-relaxed">
                  Signed in as <strong>{user.email}</strong>. Admin permissions are checked on the server, so regular customer accounts cannot open store controls.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingSettings(true);
                  try {
                    await saveStoreSettingsAdmin({
                      freeShippingThresholdAed: Number(freeThreshold),
                      standardDeliveryFeeAed: Number(stdFee),
                      defaultCourierName: defaultCourier,
                      supportPhone,
                      atelierLocation,
                    });
                    setBannerMessage('Store delivery and contact settings saved.');
                  } finally {
                    setSavingSettings(false);
                  }
                }}
                className="rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 p-6 space-y-4"
              >
                <h2 className="font-serif text-2xl font-bold">
                  UAE Delivery &amp; Store Settings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Free Delivery Minimum (AED)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={freeThreshold}
                      onChange={(e) => setFreeThreshold(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Standard UAE Delivery Fee (AED)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={stdFee}
                      onChange={(e) => setStdFee(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Default Courier
                    </label>
                    <input
                      type="text"
                      value={defaultCourier}
                      onChange={(e) => setDefaultCourier(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                      Customer Support Phone
                    </label>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A5B57] mb-1">
                    Showroom / Warehouse Address
                  </label>
                  <input
                    type="text"
                    value={atelierLocation}
                    onChange={(e) => setAtelierLocation(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] text-base sm:text-sm border border-[#142220]/10 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#1F3532] cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button
                    type="button"
                    disabled={syncingCatalog}
                    onClick={async () => {
                      setSyncingCatalog(true);
                      await seedFullCatalogToFirestore();
                      setSyncingCatalog(false);
                      setBannerMessage('Synced all categories, products, sizes, colors & inventory.');
                    }}
                    className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#142220]/20 text-xs font-semibold hover:bg-[#E6EAE4] cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingCatalog ? 'animate-spin' : ''}`} />
                    <span>{syncingCatalog ? 'Syncing Catalog...' : 'Re-Sync Default Catalog'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail & Fulfillment Drawer */}
      <AdminOrderDrawer
        order={selectedOrder}
        orderItems={orderItems}
        trackingEvents={trackingEvents}
        onClose={() => setSelectedOrderId(null)}
      />

      {/* Add / Edit Product Modal */}
      <AdminProductModal
        isOpen={productModalOpen}
        editingProduct={editingProduct}
        categories={categories}
        onClose={() => setProductModalOpen(false)}
        onSaved={(msg) => setBannerMessage(msg)}
      />
    </div>
  );
}
