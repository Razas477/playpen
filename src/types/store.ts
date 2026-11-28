export type PageRoute =
  | 'home'
  | 'collections'
  | 'shop'
  | 'mesh'
  | 'large'
  | 'foldable'
  | 'balls'
  | 'about'
  | 'journal'
  | 'contact'
  | 'checkout'
  | 'order-confirmation'
  | 'account'
  | 'admin';

export type ProductCategory = 'mesh' | 'large' | 'foldable' | 'balls';

export type DimensionsGroup = 'Compact' | 'Standard' | 'Large' | 'Extra Large';

export type MaterialGroup =
  | 'Breathable Mesh & Cationic'
  | 'HDPE Activity Fence'
  | 'Waterproof XPE Foam'
  | 'BPA-Free PE Plastic';

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface ProductGalleryImage {
  label: string;
  src: string;
  objectPosition?: string;
  zoomScale?: number;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  categoryLabel: string;
  subCategory?: string;
  priceAed: number;
  originalPriceAed?: number;
  priceRangeMaxAed?: number;
  sizePricesAed?: Record<string, number>;
  rating?: number;
  reviewCount?: number;
  image: string;
  aspect?: '3:4' | '4:3';
  dimensions: string;
  dimensionsGroup: DimensionsGroup;
  material: string;
  materialGroup: MaterialGroup;
  weightCapacity: string;
  ageSuitability: string;
  safetySpecs: string[];
  foldingAndStorage: string;
  deliveryInfo: string;
  careNote: string;
  originNote: string;
  sizes: string[];
  unavailableSizes?: string[];
  gallery?: ProductGalleryImage[];
  colors: ProductColorOption[];
  description: string;
  benefits?: string[];
  bundleIncludes?: string[];
  featuredTag?: string;
  inStock: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  active?: boolean;
}

export interface HeroChapter {
  id: string;
  indexLabel: string;
  kicker: string;
  headline: string;
  description: string;
  ctaLabel: string;
  targetRoute: PageRoute;
  bgColor: string;
  surfaceColor: string;
  image: string;
  featuredProductId: string;
}

export interface PlaypenCollectionChapter {
  id: ProductCategory;
  chapterNumber: string;
  collectionTitle: string;
  tagline: string;
  productName: string;
  priceAed: number;
  description: string;
  dimensions: string;
  materialBadge: string;
  ageSuitability: string;
  safetyStandard: string;
  bgColor: string;
  surfaceColor: string;
  isDarkSurface: boolean;
  image: string;
  secondaryImage: string;
  featuredProductId: string;
}

export interface CategoryDirectoryItem {
  route: PageRoute;
  label: string;
  shortDesc: string;
  ageOrNote: string;
  group: 'playpen' | 'collection' | 'architectural';
  image: string;
}

export interface CartItem {
  id: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Order Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'Cash on Delivery';

export type PaymentStatus =
  | 'Pending on Delivery'
  | 'Paid on Delivery'
  | 'Refunded'
  | 'Cancelled';

export type AccountTab =
  | 'profile'
  | 'orders'
  | 'tracking'
  | 'addresses'
  | 'wishlist'
  | 'settings';

export type AdminSidebarTab =
  | 'overview'
  | 'all-orders'
  | 'new-orders'
  | 'processing-orders'
  | 'shipped-orders'
  | 'delivered-orders'
  | 'cancelled-orders'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'customers'
  | 'sales-reports'
  | 'settings';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  preferredEmirate?: string;
  marketingOptIn: boolean;
  smsUpdates: boolean;
  wishlistIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  emirate: string;
  area: string;
  streetAddress: string;
  isDefault: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderSummaryItem {
  productId: string;
  productName: string;
  productImage: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  unitPriceAed: number;
  lineTotalAed: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  idempotencyKey: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  emirate: string;
  area: string;
  deliveryAddress: string;
  subtotalAed: number;
  deliveryFeeAed: number;
  totalAed: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  giftWrap: boolean;
  giftNote?: string;
  estimatedDelivery: string;
  courierName?: string;
  trackingNumber?: string;
  cancellationReason?: string;
  itemCount: number;
  itemsSummary: OrderSummaryItem[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  unitPriceAed: number;
  lineTotalAed: number;
  createdAt?: unknown;
}

export interface OrderTrackingEvent {
  id: string;
  orderId: string;
  userId: string;
  status: OrderStatus;
  note: string;
  location?: string;
  courierName?: string;
  trackingNumber?: string;
  createdAt?: unknown;
}

export interface InventoryRecord {
  id: string;
  productId: string;
  sizeCode: string;
  colorName: string;
  sku: string;
  stockQty: number;
  reservedQty: number;
  updatedAt?: unknown;
}

export interface StoreSettings {
  id: string;
  freeShippingThresholdAed: number;
  standardDeliveryFeeAed: number;
  defaultCourierName: string;
  supportPhone?: string;
  atelierLocation?: string;
  updatedAt?: unknown;
}
