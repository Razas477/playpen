import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import {
  CATEGORY_DIRECTORY,
  getProductUnitPrice,
  PRODUCTS,
  roundCurrency,
} from '../data/catalog';
import {
  CartItem,
  CategoryDirectoryItem,
  CustomerAddress,
  DimensionsGroup,
  InventoryRecord,
  MaterialGroup,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  OrderSummaryItem,
  OrderTrackingEvent,
  PageRoute,
  PaymentStatus,
  Product,
  ProductCategory,
  ProductColorOption,
  StoreSettings,
  UserProfile,
} from '../types/store';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';

export const ADMIN_EMAIL = 'alio1234599ol@gmail.com';

export const VALID_PLAYPEN_CATEGORIES = new Set<ProductCategory>([
  'mesh',
  'large',
  'foldable',
  'balls',
]);

export const ORDER_TIMELINE_STEPS: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
];

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `id_${Date.now()}`;
}

export function clampStr(raw: string | undefined | null, maxLen: number): string {
  if (!raw) return '';
  return raw.trim().slice(0, maxLen);
}

export function sanitizeImageUrl(raw: string | undefined | null): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/src/') ||
    trimmed.startsWith('/assets/') ||
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)
  ) {
    return trimmed.slice(0, 300000);
  }
  return '';
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'default',
  freeShippingThresholdAed: 750,
  standardDeliveryFeeAed: 45,
  defaultCourierName: 'PLAYPEN White-Glove UAE',
  supportPhone: '+971 4 555 0192',
  atelierLocation: 'Dubai Design District (d3), Building 7',
};

export function formatOrderTimestamp(ts: unknown): string {
  if (!ts) return 'Just now';
  let date: Date | null = null;
  if (ts instanceof Timestamp) {
    date = ts.toDate();
  } else if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    date = (ts as { toDate: () => Date }).toDate();
  } else if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === 'string' || typeof ts === 'number') {
    const parsed = new Date(ts);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }
  if (!date) return 'Just now';
  return date.toLocaleString('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getEstimatedDeliveryWindow(emirate: string): string {
  if (emirate === 'Dubai') return 'Same-Day / Tomorrow · White-Glove UAE';
  if (emirate === 'Abu Dhabi' || emirate === 'Sharjah') {
    return 'Next Business Day · White-Glove UAE';
  }
  return '1–2 Business Days · Emirates Dedicated Van';
}

export function computeDeliveryFee(
  subtotalAed: number,
  settings?: StoreSettings
): number {
  const threshold = settings?.freeShippingThresholdAed ?? 750;
  const standardFee = settings?.standardDeliveryFeeAed ?? 45;
  if (subtotalAed <= 0 || subtotalAed >= threshold) return 0;
  return standardFee;
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return sanitizeId(`pp_${crypto.randomUUID()}`);
  }
  return sanitizeId(`pp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
}

// ---------------------------------------------------------------------------
// Google Authentication
// ---------------------------------------------------------------------------
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

/**
 * Verifies administrator authorization directly against Google Firestore backend rules
 * (`admins/verify` requires `isAdmin()` on the server, never relying on client email checks alone).
 */
export async function verifyAdminAccessOnServer(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'admins', 'verify'));
    return true;
  } catch {
    return false;
  }
}

export async function ensureUserProfile(
  user: User,
  fallbackWishlist: string[] = []
): Promise<void> {
  const uid = sanitizeId(user.uid);
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  try {
    const snap = await getDoc(ref);
    const cleanName = clampStr(
      user.displayName || user.email?.split('@')[0] || 'PLAYPEN Client',
      120
    );
    const cleanEmail = clampStr(user.email || '', 200);
    const cleanPhoto = clampStr(user.photoURL || '', 600);

    if (!snap.exists()) {
      const boundedWishlist = fallbackWishlist
        .filter((id) => typeof id === 'string' && id.length > 0)
        .slice(0, 60);

      await setDoc(ref, {
        uid,
        displayName: cleanName,
        email: cleanEmail,
        photoURL: cleanPhoto,
        phone: '',
        preferredEmirate: 'Dubai',
        marketingOptIn: true,
        smsUpdates: true,
        wishlistIds: boundedWishlist,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = snap.data() as Partial<UserProfile>;
      const validIds = new Set(PRODUCTS.map((p) => p.id));
      const mergedWishlist = Array.from(
        new Set([...(existingData.wishlistIds || []), ...fallbackWishlist])
      )
        .filter((id) => validIds.has(id) || id.startsWith('pp-'))
        .slice(0, 60);

      await updateDoc(ref, {
        displayName: cleanName || existingData.displayName || 'PLAYPEN Client',
        email: cleanEmail || existingData.email || '',
        photoURL: cleanPhoto || existingData.photoURL || '',
        wishlistIds: mergedWishlist,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}`;
  return onSnapshot(
    doc(db, 'users', cleanUid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as UserProfile);
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export async function updateUserSettings(
  uid: string,
  updates: {
    displayName: string;
    phone: string;
    preferredEmirate: string;
    marketingOptIn: boolean;
    smsUpdates: boolean;
  }
): Promise<void> {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}`;
  try {
    await updateDoc(doc(db, 'users', cleanUid), {
      displayName: clampStr(updates.displayName, 120) || 'PLAYPEN Client',
      phone: clampStr(updates.phone, 32),
      preferredEmirate: clampStr(updates.preferredEmirate, 60) || 'Dubai',
      marketingOptIn: Boolean(updates.marketingOptIn),
      smsUpdates: Boolean(updates.smsUpdates),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncWishlistToDb(uid: string, wishlistIds: string[]): Promise<void> {
  const cleanUid = sanitizeId(uid);
  const path = `users/${cleanUid}`;
  const bounded = Array.from(new Set(wishlistIds.filter(Boolean))).slice(0, 60);
  try {
    await updateDoc(doc(db, 'users', cleanUid), {
      wishlistIds: bounded,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Catalog Collections Sync (Categories, Products, ProductSizes, ProductColors, Inventory)
// Automatically removes any legacy pre-rebrand non-playpen records when admin logs in.
// ---------------------------------------------------------------------------
export async function syncCatalogIfAdmin(user: User): Promise<boolean> {
  const verifiedAdmin = await verifyAdminAccessOnServer(user);
  if (!verifiedAdmin) {
    return false;
  }
  try {
    const [catSnap, prodSnap] = await Promise.all([
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'products')),
    ]);

    const validCatIds = new Set(CATEGORY_DIRECTORY.map((c) => sanitizeId(c.route)));
    const validProdIds = new Set(PRODUCTS.map((p) => sanitizeId(p.id)));

    const hasLegacyCategory = catSnap.docs.some((d) => !validCatIds.has(d.id));
    const hasLegacyProduct = prodSnap.docs.some(
      (d) => !validProdIds.has(d.id) && !d.id.startsWith('pp-')
    );
    const hasPdfSeed = prodSnap.docs.some(
      (d) => d.id === 'versatile-foldable-baby-play-mat-120x120'
    );
    const missingAnyPdfProduct = PRODUCTS.some(
      (p) => !prodSnap.docs.some((d) => d.id === sanitizeId(p.id))
    );

    if (
      catSnap.empty ||
      prodSnap.empty ||
      hasLegacyCategory ||
      hasLegacyProduct ||
      !hasPdfSeed ||
      missingAnyPdfProduct
    ) {
      await seedFullCatalogToFirestore();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Catalog seed check skipped:', error);
    return false;
  }
}

export async function seedFullCatalogToFirestore(): Promise<void> {
  // Purge legacy non-PDF catalog entries cleanly first
  const deleteOps: Array<{ col: string; id: string }> = [];
  const [catSnap, prodSnap, sizeSnap, colorSnap, invSnap] = await Promise.all([
    getDocs(collection(db, 'categories')),
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'productSizes')),
    getDocs(collection(db, 'productColors')),
    getDocs(collection(db, 'inventory')),
  ]);

  const validCatIds = new Set(CATEGORY_DIRECTORY.map((c) => sanitizeId(c.route)));
  const validProdIds = new Set(PRODUCTS.map((p) => sanitizeId(p.id)));

  catSnap.docs.forEach((d) => {
    if (!validCatIds.has(d.id)) deleteOps.push({ col: 'categories', id: d.id });
  });
  prodSnap.docs.forEach((d) => {
    if (!validProdIds.has(d.id) && !d.id.startsWith('pp-')) {
      deleteOps.push({ col: 'products', id: d.id });
    }
  });
  sizeSnap.docs.forEach((d) => {
    const pid = String(d.data().productId || '');
    if (!validProdIds.has(pid) && !pid.startsWith('pp-')) {
      deleteOps.push({ col: 'productSizes', id: d.id });
    }
  });
  colorSnap.docs.forEach((d) => {
    const pid = String(d.data().productId || '');
    if (!validProdIds.has(pid) && !pid.startsWith('pp-')) {
      deleteOps.push({ col: 'productColors', id: d.id });
    }
  });
  invSnap.docs.forEach((d) => {
    const pid = String(d.data().productId || '');
    if (!validProdIds.has(pid) && !pid.startsWith('pp-')) {
      deleteOps.push({ col: 'inventory', id: d.id });
    }
  });

  for (let i = 0; i < deleteOps.length; i += 350) {
    const chunk = deleteOps.slice(i, i + 350);
    const batch = writeBatch(db);
    for (const op of chunk) {
      batch.delete(doc(db, op.col, op.id));
    }
    try {
      await batch.commit();
    } catch (error) {
      console.warn('Legacy catalog cleanup chunk notice:', error);
    }
  }

  const ops: Array<{ col: string; id: string; data: Record<string, unknown> }> = [];

  CATEGORY_DIRECTORY.forEach((cat, idx) => {
    const id = sanitizeId(cat.route);
    ops.push({
      col: 'categories',
      id,
      data: {
        id,
        slug: clampStr(cat.route, 64),
        label: clampStr(cat.label, 80),
        shortDesc: clampStr(cat.shortDesc, 240),
        ageOrNote: clampStr(cat.ageOrNote, 80),
        group: cat.group,
        image: clampStr(cat.image, 300000),
        displayOrder: idx + 1,
        updatedAt: serverTimestamp(),
      },
    });
  });

  for (const p of PRODUCTS) {
    const pid = sanitizeId(p.id);
    ops.push({
      col: 'products',
      id: pid,
      data: {
        id: pid,
        name: clampStr(p.name, 160),
        subtitle: clampStr(p.subtitle, 160),
        categoryId: clampStr(p.category, 64),
        categoryLabel: clampStr(p.categoryLabel, 80),
        subCategory: clampStr(p.subCategory || '', 80),
        priceAed: Number(p.priceAed),
        image: clampStr(p.image, 300000),
        dimensions: clampStr(p.dimensions, 120),
        dimensionsGroup: clampStr(p.dimensionsGroup, 40),
        material: clampStr(p.material, 200),
        materialGroup: clampStr(p.materialGroup, 60),
        weightCapacity: clampStr(p.weightCapacity, 60),
        ageSuitability: clampStr(p.ageSuitability, 80),
        safetySpecs: (p.safetySpecs || []).slice(0, 12),
        foldingAndStorage: clampStr(p.foldingAndStorage, 400),
        deliveryInfo: clampStr(p.deliveryInfo, 240),
        careNote: clampStr(p.careNote, 240),
        originNote: clampStr(p.originNote, 240),
        description: clampStr(p.description, 1000),
        featuredTag: clampStr(p.featuredTag || '', 80),
        sizes: p.sizes.slice(0, 20),
        unavailableSizes: (p.unavailableSizes || []).slice(0, 20),
        colors: p.colors.slice(0, 15).map((c) => ({
          name: clampStr(c.name, 80),
          hex: clampStr(c.hex, 16),
        })),
        gallery: (p.gallery || []).slice(0, 8),
        benefits: (p.benefits || []).slice(0, 12),
        bundleIncludes: (p.bundleIncludes || []).slice(0, 12),
        inStock: p.inStock !== false,
        isFeatured: Boolean(p.isFeatured),
        isNewArrival: Boolean(p.isNewArrival),
        isBestSeller: Boolean(p.isBestSeller),
        active: true,
        updatedAt: serverTimestamp(),
      },
    });

    const unavailableSet = new Set(p.unavailableSizes || []);
    p.sizes.forEach((sz, sIdx) => {
      const sizeId = sanitizeId(`${pid}__${sz}`);
      ops.push({
        col: 'productSizes',
        id: sizeId,
        data: {
          id: sizeId,
          productId: pid,
          code: clampStr(sz, 64),
          label: clampStr(sz, 80),
          footprintCm: clampStr(p.dimensions, 60),
          panelHeightCm: '65–74 cm',
          available: !unavailableSet.has(sz),
          sortOrder: sIdx + 1,
          updatedAt: serverTimestamp(),
        },
      });
    });

    p.colors.forEach((c, cIdx) => {
      const colorId = sanitizeId(`${pid}__${c.name}`);
      ops.push({
        col: 'productColors',
        id: colorId,
        data: {
          id: colorId,
          productId: pid,
          name: clampStr(c.name, 80),
          hex: clampStr(c.hex, 16),
          sortOrder: cIdx + 1,
          updatedAt: serverTimestamp(),
        },
      });
    });

    p.sizes.forEach((sz) => {
      const isOut = unavailableSet.has(sz);
      p.colors.forEach((c) => {
        const invId = sanitizeId(`${pid}__${sz}__${c.name}`);
        ops.push({
          col: 'inventory',
          id: invId,
          data: {
            id: invId,
            productId: pid,
            sizeCode: clampStr(sz, 64),
            colorName: clampStr(c.name, 80),
            sku: clampStr(`PP-${pid}-${sz}-${c.name}`.toUpperCase(), 128),
            stockQty: isOut ? 0 : 16,
            reservedQty: 0,
            updatedAt: serverTimestamp(),
          },
        });
      });
    });
  }

  for (let i = 0; i < ops.length; i += 350) {
    const chunk = ops.slice(i, i + 350);
    const batch = writeBatch(db);
    for (const op of chunk) {
      batch.set(doc(db, op.col, op.id), op.data);
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'catalog_seed');
    }
  }
}

// ---------------------------------------------------------------------------
// Customer Saved Addresses
// ---------------------------------------------------------------------------
export function subscribeToAddresses(
  uid: string,
  onData: (addresses: CustomerAddress[]) => void
): Unsubscribe {
  const cleanUid = sanitizeId(uid);
  const q = query(collection(db, 'customerAddresses'), where('userId', '==', cleanUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as CustomerAddress);
      list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'customerAddresses')
  );
}

export async function saveCustomerAddress(
  uid: string,
  input: {
    id?: string;
    label: string;
    recipientName: string;
    phone: string;
    emirate: string;
    area: string;
    streetAddress: string;
    isDefault: boolean;
  },
  existingAddresses: CustomerAddress[] = []
): Promise<string> {
  const cleanUid = sanitizeId(uid);
  const addressId = sanitizeId(
    input.id || `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
  const path = `customerAddresses/${addressId}`;

  try {
    const batch = writeBatch(db);
    if (input.isDefault) {
      for (const addr of existingAddresses) {
        if (addr.id !== addressId && addr.isDefault) {
          batch.update(doc(db, 'customerAddresses', addr.id), {
            isDefault: false,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    const ref = doc(db, 'customerAddresses', addressId);
    if (input.id) {
      batch.update(ref, {
        label: clampStr(input.label, 60) || 'Residence',
        recipientName: clampStr(input.recipientName, 120),
        phone: clampStr(input.phone, 32),
        emirate: clampStr(input.emirate, 60),
        area: clampStr(input.area, 100),
        streetAddress: clampStr(input.streetAddress, 300),
        isDefault: Boolean(input.isDefault),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(ref, {
        id: addressId,
        userId: cleanUid,
        label: clampStr(input.label, 60) || 'Residence',
        recipientName: clampStr(input.recipientName, 120),
        phone: clampStr(input.phone, 32),
        emirate: clampStr(input.emirate, 60),
        area: clampStr(input.area, 100),
        streetAddress: clampStr(input.streetAddress, 300),
        isDefault: Boolean(input.isDefault),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return addressId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeCustomerAddress(addressId: string): Promise<void> {
  const cleanId = sanitizeId(addressId);
  const path = `customerAddresses/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'customerAddresses', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Idempotent Order Creation + Order Items + Initial Tracking + Inventory Sync
// ---------------------------------------------------------------------------
export interface PlaceOrderPayload {
  user: User;
  idempotencyKey: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  emirate: string;
  area: string;
  streetAddress: string;
  items: CartItem[];
  giftWrap: boolean;
  giftNote: string;
  saveAddressToProfile?: boolean;
  existingAddresses?: CustomerAddress[];
  storeSettings?: StoreSettings;
}

export async function placeOrderInFirestore(
  payload: PlaceOrderPayload
): Promise<OrderRecord> {
  const cleanUid = sanitizeId(payload.user.uid);
  const cleanKey = sanitizeId(payload.idempotencyKey);
  const orderId = sanitizeId(`ord_${cleanKey}`);
  const orderRef = doc(db, 'orders', orderId);

  try {
    const existingSnap = await getDoc(orderRef);
    if (existingSnap.exists()) {
      return existingSnap.data() as OrderRecord;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
  }

  const subtotalAed = roundCurrency(
    payload.items.reduce((sum, item) => {
      const unit = getProductUnitPrice(item.product, item.size);
      const qty = Math.max(1, Math.min(50, Number(item.quantity)));
      return sum + roundCurrency(unit * qty);
    }, 0)
  );
  const deliveryFeeAed = roundCurrency(
    computeDeliveryFee(subtotalAed, payload.storeSettings)
  );
  const totalAed = roundCurrency(subtotalAed + deliveryFeeAed);
  const itemCount = payload.items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedDelivery = getEstimatedDeliveryWindow(payload.emirate);
  const defaultCourier =
    clampStr(payload.storeSettings?.defaultCourierName, 80) ||
    'PLAYPEN White-Glove UAE';
  const orderNumber = `PP-${cleanKey.slice(-6).toUpperCase()}`;
  const trackingNumber = `UAE-PP-${Date.now().toString().slice(-6)}`;
  const fullDeliveryAddress = clampStr(
    `${payload.streetAddress}, ${payload.area}, ${payload.emirate}, UAE`,
    360
  );

  const itemsSummary: OrderSummaryItem[] = payload.items.slice(0, 25).map((item) => {
    const unitPriceAed = getProductUnitPrice(item.product, item.size);
    const qty = Math.max(1, Math.min(50, item.quantity));
    return {
      productId: sanitizeId(item.product.id),
      productName: clampStr(item.product.name, 160),
      productImage: sanitizeImageUrl(item.product.image),
      selectedSize: clampStr(item.size || '120cm x 120cm', 64),
      selectedColor: clampStr(item.color || 'Classic', 80),
      quantity: qty,
      unitPriceAed,
      lineTotalAed: roundCurrency(unitPriceAed * qty),
    };
  });

  const invUpdates: Array<{ id: string; stockQty: number; reservedQty: number }> = [];
  for (const item of payload.items) {
    const invId = sanitizeId(`${item.product.id}__${item.size}__${item.color}`);
    try {
      const invSnap = await getDoc(doc(db, 'inventory', invId));
      if (invSnap.exists()) {
        const inv = invSnap.data() as { stockQty?: number; reservedQty?: number };
        const currentStock = Number(inv.stockQty ?? 0);
        const currentReserved = Number(inv.reservedQty ?? 0);
        invUpdates.push({
          id: invId,
          stockQty: Math.max(0, currentStock - item.quantity),
          reservedQty: currentReserved + item.quantity,
        });
      }
    } catch {
      // Non-blocking read check
    }
  }

  const orderData = {
    id: orderId,
    orderNumber: clampStr(orderNumber, 32),
    idempotencyKey: cleanKey,
    userId: cleanUid,
    customerName: clampStr(payload.customerName, 120),
    customerEmail: clampStr(payload.customerEmail || payload.user.email || '', 200),
    customerPhone: clampStr(payload.customerPhone, 32),
    emirate: clampStr(payload.emirate, 60),
    area: clampStr(payload.area, 100),
    deliveryAddress: fullDeliveryAddress,
    subtotalAed,
    deliveryFeeAed,
    totalAed,
    paymentMethod: 'Cash on Delivery' as const,
    paymentStatus: 'Pending on Delivery' as const,
    orderStatus: 'Order Confirmed' as const,
    giftWrap: Boolean(payload.giftWrap),
    giftNote: clampStr(payload.giftNote, 280),
    estimatedDelivery: clampStr(estimatedDelivery, 120),
    courierName: defaultCourier,
    trackingNumber: clampStr(trackingNumber, 80),
    itemCount,
    itemsSummary,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const batch = writeBatch(db);
    batch.set(orderRef, orderData);

    payload.items.forEach((item, idx) => {
      const itemId = sanitizeId(`${orderId}_item_${idx + 1}`);
      const unitPriceAed = getProductUnitPrice(item.product, item.size);
      const qty = Math.max(1, Math.min(50, item.quantity));
      batch.set(doc(db, 'orderItems', itemId), {
        id: itemId,
        orderId,
        userId: cleanUid,
        productId: sanitizeId(item.product.id),
        productName: clampStr(item.product.name, 160),
        productImage: sanitizeImageUrl(item.product.image),
        selectedSize: clampStr(item.size || '120cm x 120cm', 64),
        selectedColor: clampStr(item.color || 'Classic', 80),
        quantity: qty,
        unitPriceAed,
        lineTotalAed: roundCurrency(unitPriceAed * qty),
        createdAt: serverTimestamp(),
      });
    });

    const ev1Id = sanitizeId(`${orderId}_ev_1_placed`);
    batch.set(doc(db, 'orderTrackingHistory', ev1Id), {
      id: ev1Id,
      orderId,
      userId: cleanUid,
      status: 'Order Placed',
      note: 'Playpen order received by PLAYPEN UAE Showroom & Logistics Hub.',
      location: 'Dubai Design District (d3)',
      courierName: defaultCourier,
      trackingNumber,
      createdAt: serverTimestamp(),
    });

    const ev2Id = sanitizeId(`${orderId}_ev_2_confirmed`);
    batch.set(doc(db, 'orderTrackingHistory', ev2Id), {
      id: ev2Id,
      orderId,
      userId: cleanUid,
      status: 'Order Confirmed',
      note: 'Cash on Delivery confirmed and queued for white-glove safety inspection.',
      location: 'Al Quoz Showroom Depot, Dubai',
      courierName: defaultCourier,
      trackingNumber,
      createdAt: serverTimestamp(),
    });

    for (const upd of invUpdates) {
      batch.update(doc(db, 'inventory', upd.id), {
        stockQty: upd.stockQty,
        reservedQty: upd.reservedQty,
        updatedAt: serverTimestamp(),
      });
    }

    if (payload.saveAddressToProfile) {
      const addrId = sanitizeId(`addr_${cleanKey.slice(-10)}`);
      const hasDefault = (payload.existingAddresses || []).some((a) => a.isDefault);
      batch.set(doc(db, 'customerAddresses', addrId), {
        id: addrId,
        userId: cleanUid,
        label: clampStr(payload.area, 60) || 'UAE Residence',
        recipientName: clampStr(payload.customerName, 120),
        phone: clampStr(payload.customerPhone, 32),
        emirate: clampStr(payload.emirate, 60),
        area: clampStr(payload.area, 100),
        streetAddress: clampStr(payload.streetAddress, 300),
        isDefault: !hasDefault,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    return {
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
  }
}

// ---------------------------------------------------------------------------
// Orders, Order Items & Tracking Subscriptions
// ---------------------------------------------------------------------------
function toMillis(ts: unknown): number {
  if (!ts) return 0;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toMillis' in ts &&
    typeof (ts as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

export function subscribeToCustomerOrders(
  uid: string,
  onData: (orders: OrderRecord[]) => void
): Unsubscribe {
  const cleanUid = sanitizeId(uid);
  const q = query(collection(db, 'orders'), where('userId', '==', cleanUid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as OrderRecord);
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
  );
}

export function subscribeToCustomerOrderItems(
  uid: string,
  onData: (items: OrderItemRecord[]) => void
): Unsubscribe {
  const cleanUid = sanitizeId(uid);
  const q = query(collection(db, 'orderItems'), where('userId', '==', cleanUid));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as OrderItemRecord));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orderItems')
  );
}

export function subscribeToCustomerTracking(
  uid: string,
  onData: (events: OrderTrackingEvent[]) => void
): Unsubscribe {
  const cleanUid = sanitizeId(uid);
  const q = query(
    collection(db, 'orderTrackingHistory'),
    where('userId', '==', cleanUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as OrderTrackingEvent);
      list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orderTrackingHistory')
  );
}

export async function cancelCustomerOrder(order: OrderRecord): Promise<void> {
  if (order.orderStatus !== 'Order Placed' && order.orderStatus !== 'Order Confirmed') {
    return;
  }
  const path = `orders/${order.id}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', order.id), {
      orderStatus: 'Cancelled',
      paymentStatus: 'Cancelled',
      updatedAt: serverTimestamp(),
    });
    const evId = sanitizeId(`${order.id}_ev_cancelled_${Date.now()}`);
    batch.set(doc(db, 'orderTrackingHistory', evId), {
      id: evId,
      orderId: order.id,
      userId: order.userId,
      status: 'Cancelled',
      note: 'Order cancelled by customer prior to white-glove dispatch.',
      location: 'PLAYPEN Client Portal',
      trackingNumber: order.trackingNumber || '',
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function advanceOrderStatusAdmin(
  order: OrderRecord,
  nextStatus: OrderStatus,
  note: string,
  location: string
): Promise<void> {
  return updateOrderAdmin(order, {
    orderStatus: nextStatus,
    paymentStatus:
      nextStatus === 'Delivered'
        ? 'Paid on Delivery'
        : nextStatus === 'Cancelled'
        ? 'Cancelled'
        : order.paymentStatus,
    courierName: order.courierName || 'PLAYPEN White-Glove UAE',
    trackingNumber: order.trackingNumber || `UAE-PP-${Date.now().toString().slice(-6)}`,
    estimatedDelivery:
      nextStatus === 'Delivered' ? 'Delivered & Placed in Room' : order.estimatedDelivery,
    note,
    location,
  });
}

// ---------------------------------------------------------------------------
// Public Storefront Live Subscriptions (Products, Categories, Settings)
// ---------------------------------------------------------------------------
function mapDocToProduct(raw: Record<string, unknown>): Product | null {
  const id = String(raw.id || '');
  const categoryId = String(raw.categoryId || '') as ProductCategory;
  const staticMatch = PRODUCTS.find((p) => p.id === id);
  const isCustomAdmin = id.startsWith('pp-');

  if (!staticMatch && (!isCustomAdmin || !VALID_PLAYPEN_CATEGORIES.has(categoryId))) {
    return null;
  }

  return {
    id,
    name: String(raw.name || staticMatch?.name || 'PLAYPEN Product'),
    subtitle: String(raw.subtitle || staticMatch?.subtitle || ''),
    category: VALID_PLAYPEN_CATEGORIES.has(categoryId)
      ? categoryId
      : staticMatch?.category || 'mesh',
    categoryLabel: String(
      raw.categoryLabel || staticMatch?.categoryLabel || 'Mesh Playpens'
    ),
    subCategory: raw.subCategory ? String(raw.subCategory) : staticMatch?.subCategory,
    priceAed: Number(raw.priceAed ?? staticMatch?.priceAed ?? 0),
    originalPriceAed: staticMatch?.originalPriceAed,
    priceRangeMaxAed: staticMatch?.priceRangeMaxAed,
    sizePricesAed: staticMatch?.sizePricesAed,
    rating: staticMatch?.rating,
    reviewCount: staticMatch?.reviewCount,
    image: String(raw.image || staticMatch?.image || ''),
    aspect: staticMatch?.aspect || '4:3',
    dimensions: String(
      raw.dimensions || staticMatch?.dimensions || '120 × 120 × 65 cm'
    ),
    dimensionsGroup: (raw.dimensionsGroup ||
      staticMatch?.dimensionsGroup ||
      'Standard') as DimensionsGroup,
    material: String(
      raw.material || staticMatch?.material || 'Cationic Fabric & Breathable Mesh'
    ),
    materialGroup: (raw.materialGroup ||
      staticMatch?.materialGroup ||
      'Breathable Mesh & Cationic') as MaterialGroup,
    weightCapacity: String(
      raw.weightCapacity || staticMatch?.weightCapacity || 'Up to 35 kg'
    ),
    ageSuitability: String(
      raw.ageSuitability || staticMatch?.ageSuitability || '0 – 48 Months'
    ),
    safetySpecs:
      Array.isArray(raw.safetySpecs) && raw.safetySpecs.length > 0
        ? raw.safetySpecs.map(String)
        : staticMatch?.safetySpecs || [
            '360-degree breathable mesh walls with clear visibility',
            'Smooth anti-pinch corners and non-toxic materials',
          ],
    foldingAndStorage: String(
      raw.foldingAndStorage ||
        staticMatch?.foldingAndStorage ||
        'Quick tool-free disassembly for compact home storage.'
    ),
    deliveryInfo: String(
      raw.deliveryInfo ||
        staticMatch?.deliveryInfo ||
        'Fast UAE delivery across all 7 Emirates with Cash on Delivery.'
    ),
    careNote: String(
      raw.careNote ||
        staticMatch?.careNote ||
        'Wipe fabric and mesh panels cleanly with a damp cloth.'
    ),
    originNote: String(
      raw.originNote ||
        staticMatch?.originNote ||
        'Designed for everyday safety in UAE family homes.'
    ),
    sizes:
      Array.isArray(raw.sizes) && raw.sizes.length > 0
        ? raw.sizes.map(String)
        : staticMatch?.sizes || ['120cm x 120cm'],
    unavailableSizes: Array.isArray(raw.unavailableSizes)
      ? raw.unavailableSizes.map(String)
      : staticMatch?.unavailableSizes || [],
    gallery:
      Array.isArray(raw.gallery) && raw.gallery.length > 0
        ? (raw.gallery as Product['gallery'])
        : staticMatch?.gallery,
    colors:
      Array.isArray(raw.colors) && raw.colors.length > 0
        ? (raw.colors as ProductColorOption[])
        : staticMatch?.colors || [{ name: 'Soft Dove Grey', hex: '#B3B7BC' }],
    description: String(raw.description || staticMatch?.description || ''),
    benefits: Array.isArray(raw.benefits)
      ? raw.benefits.map(String)
      : staticMatch?.benefits,
    bundleIncludes: Array.isArray(raw.bundleIncludes)
      ? raw.bundleIncludes.map(String)
      : staticMatch?.bundleIncludes,
    featuredTag: raw.featuredTag
      ? String(raw.featuredTag)
      : staticMatch?.featuredTag,
    inStock: raw.inStock !== false,
    isFeatured: Boolean(
      raw.isFeatured ?? Boolean(raw.featuredTag || staticMatch?.isFeatured)
    ),
    isNewArrival: Boolean(raw.isNewArrival ?? staticMatch?.isNewArrival ?? false),
    isBestSeller: Boolean(raw.isBestSeller ?? staticMatch?.isBestSeller ?? false),
    active: raw.active !== false,
  };
}

export function subscribeToCatalogProducts(
  onData: (products: Product[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'products'),
    (snap) => {
      if (snap.empty) {
        onData(PRODUCTS);
        return;
      }
      const list = snap.docs
        .map((d) => mapDocToProduct(d.data() as Record<string, unknown>))
        .filter((p): p is Product => p !== null && p.active !== false);

      onData(list.length > 0 ? list : PRODUCTS);
    },
    (error) => {
      console.warn('Products live stream notice:', error);
    }
  );
}

export function subscribeToCatalogCategories(
  onData: (categories: CategoryDirectoryItem[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'categories'),
    (snap) => {
      if (snap.empty) {
        onData(CATEGORY_DIRECTORY);
        return;
      }
      const rows = snap.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          const slug = String(data.slug || data.id) as ProductCategory;
          if (!VALID_PLAYPEN_CATEGORIES.has(slug)) return null;
          return {
            route: slug as PageRoute,
            label: String(data.label || ''),
            shortDesc: String(data.shortDesc || ''),
            ageOrNote: String(data.ageOrNote || ''),
            group: (['playpen', 'collection', 'architectural'].includes(
              String(data.group)
            )
              ? data.group
              : 'playpen') as 'playpen' | 'collection' | 'architectural',
            image: String(data.image || ''),
            displayOrder: Number(data.displayOrder || 99),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (rows.length === 0) {
        onData(CATEGORY_DIRECTORY);
        return;
      }

      rows.sort((a, b) => a.displayOrder - b.displayOrder);
      onData(rows.map(({ displayOrder: _order, ...cat }) => cat));
    },
    (error) => {
      console.warn('Categories live stream notice:', error);
    }
  );
}

export function subscribeToStoreSettings(
  onData: (settings: StoreSettings) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'storeSettings', 'default'),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_STORE_SETTINGS);
        return;
      }
      const data = snap.data() as StoreSettings;
      const normalizedCourier = data.defaultCourierName?.includes('Maison Nour')
        ? DEFAULT_STORE_SETTINGS.defaultCourierName
        : data.defaultCourierName || DEFAULT_STORE_SETTINGS.defaultCourierName;
      onData({
        ...data,
        defaultCourierName: normalizedCourier,
      });
    },
    () => {
      onData(DEFAULT_STORE_SETTINGS);
    }
  );
}

// ---------------------------------------------------------------------------
// Private Admin Dashboard Real-Time Subscriptions & Mutations
// ---------------------------------------------------------------------------
export function subscribeToAllOrdersAdmin(
  onData: (orders: OrderRecord[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'orders'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as OrderRecord);
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
  );
}

export function subscribeToAllOrderItemsAdmin(
  onData: (items: OrderItemRecord[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'orderItems'),
    (snap) => {
      onData(snap.docs.map((d) => d.data() as OrderItemRecord));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orderItems')
  );
}

export function subscribeToAllTrackingAdmin(
  onData: (events: OrderTrackingEvent[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'orderTrackingHistory'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as OrderTrackingEvent);
      list.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orderTrackingHistory')
  );
}

export function subscribeToAllUsersAdmin(
  onData: (users: UserProfile[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as UserProfile);
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'users')
  );
}

export function subscribeToAllInventoryAdmin(
  onData: (inventory: InventoryRecord[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'inventory'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as InventoryRecord);
      list.sort((a, b) => a.sku.localeCompare(b.sku));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'inventory')
  );
}

export async function updateOrderAdmin(
  order: OrderRecord,
  updates: {
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    courierName?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    deliveryAddress?: string;
    emirate?: string;
    area?: string;
    cancellationReason?: string;
    note: string;
    location?: string;
  }
): Promise<void> {
  const path = `orders/${order.id}`;
  const cleanCourier = clampStr(
    updates.courierName ?? order.courierName ?? 'PLAYPEN White-Glove UAE',
    80
  );
  const cleanTracking = clampStr(
    updates.trackingNumber ?? order.trackingNumber ?? '',
    80
  );
  const cleanEstimated = clampStr(
    updates.estimatedDelivery ?? order.estimatedDelivery,
    120
  );
  const cleanAddress = clampStr(
    updates.deliveryAddress ?? order.deliveryAddress,
    360
  );
  const cleanEmirate = clampStr(updates.emirate ?? order.emirate, 60);
  const cleanArea = clampStr(updates.area ?? order.area, 100);
  const cleanReason = clampStr(
    updates.cancellationReason ?? order.cancellationReason ?? '',
    280
  );

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'orders', order.id), {
      orderStatus: updates.orderStatus,
      paymentStatus: updates.paymentStatus,
      courierName: cleanCourier,
      trackingNumber: cleanTracking,
      estimatedDelivery: cleanEstimated,
      deliveryAddress: cleanAddress,
      emirate: cleanEmirate,
      area: cleanArea,
      cancellationReason: cleanReason,
      updatedAt: serverTimestamp(),
    });

    const evId = sanitizeId(
      `${order.id}_ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    );
    batch.set(doc(db, 'orderTrackingHistory', evId), {
      id: evId,
      orderId: order.id,
      userId: order.userId,
      status: updates.orderStatus,
      note: clampStr(updates.note, 280) || `Status updated to ${updates.orderStatus}.`,
      location: clampStr(updates.location || 'Dubai Design District (d3)', 120),
      courierName: cleanCourier,
      trackingNumber: cleanTracking,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveProductAdmin(
  input: {
    id?: string;
    name: string;
    subtitle: string;
    category: ProductCategory;
    categoryLabel: string;
    priceAed: number;
    image: string;
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
    description: string;
    featuredTag?: string;
    sizes: string[];
    unavailableSizes?: string[];
    colors: ProductColorOption[];
    inStock: boolean;
    isFeatured: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
    active: boolean;
  },
  initialStockQty = 16
): Promise<string> {
  const pid = sanitizeId(
    input.id ||
      `pp-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}-${Date.now().toString().slice(-4)}`
  );
  const path = `products/${pid}`;
  const cleanImage = sanitizeImageUrl(input.image);
  if (!cleanImage) {
    throw new Error(
      'Please provide a valid HTTPS image URL, /assets/ path, or upload a PNG/JPEG/WebP image.'
    );
  }

  const cleanSizes = (
    input.sizes.length > 0 ? input.sizes : ['120cm x 120cm']
  ).slice(0, 20);
  const cleanUnavailable = (input.unavailableSizes || []).slice(0, 20);
  const unavailableSet = new Set(cleanUnavailable);
  const cleanColors: ProductColorOption[] = (
    input.colors.length > 0 ? input.colors : [{ name: 'Soft Dove Grey', hex: '#B3B7BC' }]
  )
    .slice(0, 15)
    .map((c) => ({
      name: clampStr(c.name, 80) || 'Soft Dove Grey',
      hex: clampStr(c.hex, 16) || '#B3B7BC',
    }));

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'products', pid), {
      id: pid,
      name: clampStr(input.name, 160),
      subtitle: clampStr(input.subtitle, 160),
      categoryId: clampStr(input.category, 64),
      categoryLabel: clampStr(input.categoryLabel, 80),
      subCategory: '',
      priceAed: roundCurrency(Math.max(1, Math.min(100000, Number(input.priceAed)))),
      image: cleanImage,
      dimensions: clampStr(input.dimensions, 120) || '120 × 120 × 65 cm',
      dimensionsGroup: clampStr(input.dimensionsGroup, 40) || 'Standard',
      material: clampStr(input.material, 200),
      materialGroup: clampStr(input.materialGroup, 60) || 'Breathable Mesh & Cationic',
      weightCapacity: clampStr(input.weightCapacity, 60) || 'Up to 35 kg',
      ageSuitability: clampStr(input.ageSuitability, 80) || '0 – 48 Months',
      safetySpecs: (input.safetySpecs || []).slice(0, 12),
      foldingAndStorage: clampStr(input.foldingAndStorage, 400),
      deliveryInfo: clampStr(input.deliveryInfo, 240),
      careNote: clampStr(input.careNote, 240),
      originNote: clampStr(input.originNote, 240),
      description: clampStr(input.description, 1000),
      featuredTag: clampStr(
        input.featuredTag || (input.isFeatured ? 'Featured Edition' : ''),
        80
      ),
      sizes: cleanSizes,
      unavailableSizes: cleanUnavailable,
      colors: cleanColors,
      inStock: Boolean(input.inStock),
      isFeatured: Boolean(input.isFeatured),
      isNewArrival: Boolean(input.isNewArrival),
      isBestSeller: Boolean(input.isBestSeller),
      active: Boolean(input.active),
      updatedAt: serverTimestamp(),
    });

    cleanSizes.forEach((sz, idx) => {
      const sizeId = sanitizeId(`${pid}__${sz}`);
      batch.set(doc(db, 'productSizes', sizeId), {
        id: sizeId,
        productId: pid,
        code: clampStr(sz, 64),
        label: clampStr(sz, 80),
        footprintCm: clampStr(input.dimensions, 60),
        panelHeightCm: '68 cm',
        available: input.inStock && !unavailableSet.has(sz),
        sortOrder: idx + 1,
        updatedAt: serverTimestamp(),
      });
    });

    cleanColors.forEach((c, idx) => {
      const colorId = sanitizeId(`${pid}__${c.name}`);
      batch.set(doc(db, 'productColors', colorId), {
        id: colorId,
        productId: pid,
        name: c.name,
        hex: c.hex,
        sortOrder: idx + 1,
        updatedAt: serverTimestamp(),
      });
    });

    for (const sz of cleanSizes) {
      for (const c of cleanColors) {
        const invId = sanitizeId(`${pid}__${sz}__${c.name}`);
        batch.set(doc(db, 'inventory', invId), {
          id: invId,
          productId: pid,
          sizeCode: clampStr(sz, 64),
          colorName: c.name,
          sku: clampStr(`PP-${pid}-${sz}-${c.name}`.toUpperCase(), 128),
          stockQty:
            !input.inStock || unavailableSet.has(sz)
              ? 0
              : Math.max(0, Math.floor(initialStockQty)),
          reservedQty: 0,
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
    return pid;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductAdmin(productId: string): Promise<void> {
  const pid = sanitizeId(productId);
  const path = `products/${pid}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'products', pid));

    const [sizesSnap, colorsSnap, invSnap] = await Promise.all([
      getDocs(query(collection(db, 'productSizes'), where('productId', '==', pid))),
      getDocs(query(collection(db, 'productColors'), where('productId', '==', pid))),
      getDocs(query(collection(db, 'inventory'), where('productId', '==', pid))),
    ]);

    sizesSnap.docs.forEach((d) => batch.delete(d.ref));
    colorsSnap.docs.forEach((d) => batch.delete(d.ref));
    invSnap.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCategoryAdmin(input: {
  slug: string;
  label: string;
  shortDesc: string;
  ageOrNote: string;
  group: 'playpen' | 'collection' | 'architectural';
  image: string;
  displayOrder: number;
}): Promise<string> {
  const id = sanitizeId(
    input.slug || input.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  );
  const path = `categories/${id}`;
  const cleanImage = sanitizeImageUrl(input.image);
  try {
    await setDoc(doc(db, 'categories', id), {
      id,
      slug: clampStr(input.slug || id, 64),
      label: clampStr(input.label, 80),
      shortDesc: clampStr(input.shortDesc, 240),
      ageOrNote: clampStr(input.ageOrNote, 80),
      group: input.group,
      image: cleanImage || '',
      displayOrder: Number(input.displayOrder || 1),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryAdmin(categoryId: string): Promise<void> {
  const cleanId = sanitizeId(categoryId);
  try {
    await deleteDoc(doc(db, 'categories', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${cleanId}`);
  }
}

export async function updateInventoryStockAdmin(
  inventoryId: string,
  stockQty: number,
  reservedQty: number
): Promise<void> {
  const cleanId = sanitizeId(inventoryId);
  const path = `inventory/${cleanId}`;
  try {
    await updateDoc(doc(db, 'inventory', cleanId), {
      stockQty: Math.max(0, Math.min(100000, Math.floor(stockQty))),
      reservedQty: Math.max(0, Math.min(100000, Math.floor(reservedQty))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveStoreSettingsAdmin(
  settings: Omit<StoreSettings, 'id' | 'updatedAt'>
): Promise<void> {
  const path = 'storeSettings/default';
  try {
    await setDoc(doc(db, 'storeSettings', 'default'), {
      id: 'default',
      freeShippingThresholdAed: Math.max(
        0,
        Math.min(10000, Number(settings.freeShippingThresholdAed))
      ),
      standardDeliveryFeeAed: Math.max(
        0,
        Math.min(1000, Number(settings.standardDeliveryFeeAed))
      ),
      defaultCourierName:
        clampStr(settings.defaultCourierName, 80) || 'PLAYPEN White-Glove UAE',
      supportPhone: clampStr(settings.supportPhone, 32),
      atelierLocation: clampStr(settings.atelierLocation, 160),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
