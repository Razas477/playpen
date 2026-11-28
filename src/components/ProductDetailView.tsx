import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  Layers,
  Mail,
  Maximize2,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Share2,
  ShieldCheck,
  Truck,
  Weight,
  X,
  ZoomIn,
  ArrowRight,
  Star,
} from 'lucide-react';
import { formatAed, getProductUnitPrice } from '../data/catalog';
import { PageRoute, Product } from '../types/store';
import { ProductCard } from './ProductCard';
import { ResilientImage } from './ResilientImage';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
  onBack: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, color: string, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  wishlistIds: string[];
  onNavigate: (route: PageRoute) => void;
}

export function ProductDetailView({
  product,
  relatedProducts,
  onBack,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  isWishlisted,
  onToggleWishlist,
  wishlistIds,
}: ProductDetailViewProps) {
  const gallery =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [{ label: 'Primary View', src: product.image }];

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState(
    product.sizes[0] || '120cm x 120cm'
  );
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0]?.name || 'Classic'
  );
  const [quantity, setQuantity] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const unitPriceAed = getProductUnitPrice(product, selectedConfig);

  const mobileCarouselRef = useRef<HTMLDivElement | null>(null);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const activePhoto = gallery[selectedImageIdx] || gallery[0];

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.set('product', product.id);
    url.hash = '';
    return url.toString();
  }, [product.id]);

  const shareText = `${product.name} — ${formatAed(unitPriceAed)} at PLAYPEN UAE`;
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!shareOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShareOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [shareOpen]);

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    let copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied && typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }
      document.body.removeChild(textarea);
    }

    if (copied) {
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2200);
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare || !shareUrl) return;
    try {
      await navigator.share({
        title: product.name,
        text: shareText,
        url: shareUrl,
      });
      setShareOpen(false);
    } catch {
      // User dismissed native share sheet or sharing was cancelled
    }
  };

  const handleSelectSlide = (idx: number) => {
    setSelectedImageIdx(idx);
    setZoomed(false);
    const el = mobileCarouselRef.current;
    if (el) {
      el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
    }
  };

  const handleCarouselScroll = () => {
    const el = mobileCarouselRef.current;
    if (!el || el.clientWidth === 0) return;
    const nextIdx = Math.round(el.scrollLeft / el.clientWidth);
    if (nextIdx !== selectedImageIdx && nextIdx >= 0 && nextIdx < gallery.length) {
      setSelectedImageIdx(nextIdx);
    }
  };

  const handleAdd = () => {
    onAddToCart(product, selectedConfig, selectedColor, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  const handleBuyNow = () => {
    onBuyNow(product, selectedConfig, selectedColor, quantity);
  };

  return (
    <div className="pt-[72px] lg:pt-28 pb-28 lg:pb-20 bg-[#FAFAF8] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Back Breadcrumb */}
        <div className="flex items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-[#142220]/10 mb-5 sm:mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 min-h-[44px] pr-2 text-xs sm:text-sm font-semibold text-[#3C4B48] hover:text-[#142220] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Playpens
          </button>

          <span className="text-xs font-semibold text-[#4A5B57] truncate">
            {product.categoryLabel}
          </span>
        </div>

        {/* Main Architectural Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-14 items-start">
          {/* MOBILE / TABLET SWIPEABLE GALLERY (< lg) */}
          <div className="lg:hidden space-y-3">
            <div className="relative">
              <div
                ref={mobileCarouselRef}
                onScroll={handleCarouselScroll}
                aria-label="Playpen image gallery carousel"
                className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-[20px] sm:rounded-[28px] bg-[#E6EAE4] border border-[#142220]/10 shadow-[0_18px_40px_rgba(20,34,32,0.08)]"
              >
                {gallery.map((img, idx) => (
                  <div
                    key={`${img.label}-${idx}`}
                    className="w-full shrink-0 snap-center aspect-[4/3] relative"
                  >
                    <ResilientImage
                      src={img.src}
                      alt={`${product.name} — ${img.label}`}
                      fallbackTitle={product.name}
                      style={{
                        objectPosition: img.objectPosition || '50% 50%',
                        transform:
                          zoomed && idx === selectedImageIdx
                            ? `scale(${(img.zoomScale || 1) * 1.35})`
                            : img.zoomScale
                            ? `scale(${img.zoomScale})`
                            : undefined,
                      }}
                      className="w-full h-full object-cover transition-transform duration-500"
                    />
                    <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-[#142220]/80 text-[#FAFAF8] text-xs font-medium">
                      {img.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                aria-label={zoomed ? 'Reset zoom' : 'Zoom in'}
                className="absolute bottom-3 right-3 min-h-[36px] px-3 py-1.5 rounded-full bg-[#FAFAF8]/95 backdrop-blur-sm text-[#142220] text-xs font-semibold inline-flex items-center gap-1 shadow-md"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                {zoomed ? 'Reset' : 'Zoom'}
              </button>
            </div>

            {/* Dot Pagination Indicators */}
            {gallery.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-0.5">
                {gallery.map((img, idx) => (
                  <button
                    key={`dot-${img.label}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSlide(idx)}
                    aria-label={`View image ${idx + 1}: ${img.label}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === selectedImageIdx
                        ? 'w-6 bg-[#142220]'
                        : 'w-2 bg-[#142220]/25'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Mobile Horizontal Thumbnails */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {gallery.map((img, idx) => (
                <button
                  key={`mthumb-${img.label}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSlide(idx)}
                  className={`relative w-20 shrink-0 aspect-[4/3] rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    idx === selectedImageIdx
                      ? 'border-[#2B5B51] ring-2 ring-[#2B5B51]/25'
                      : 'border-[#142220]/12 opacity-75'
                  }`}
                >
                  <ResilientImage
                    src={img.src}
                    alt={img.label}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: img.objectPosition || '50% 50%' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* DESKTOP MULTI-ANGLE GALLERY (lg:+) */}
          <div className="hidden lg:block lg:col-span-7 space-y-4">
            <div
              onClick={() => setZoomed((z) => !z)}
              className="relative aspect-[4/3] rounded-[28px] overflow-hidden bg-[#E6EAE4] border border-[#142220]/10 shadow-[0_24px_60px_rgba(20,34,32,0.1)] cursor-zoom-in group"
            >
              <ResilientImage
                src={activePhoto.src}
                alt={`${product.name} — ${activePhoto.label}`}
                fallbackTitle={product.name}
                style={{
                  objectPosition: activePhoto.objectPosition || '50% 50%',
                  transform: zoomed
                    ? `scale(${(activePhoto.zoomScale || 1) * 1.38})`
                    : activePhoto.zoomScale
                    ? `scale(${activePhoto.zoomScale})`
                    : undefined,
                }}
                className="w-full h-full object-cover transition-transform duration-700 ease-out"
              />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomed((z) => !z);
                }}
                aria-label={zoomed ? 'Reset zoom' : 'Zoom in on playpen'}
                className="absolute bottom-4 right-4 px-3.5 py-2 rounded-full bg-[#FAFAF8]/95 backdrop-blur-sm text-[#142220] text-xs font-semibold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                {zoomed ? 'Reset Zoom' : 'Zoom In'}
              </button>
            </div>

            {/* Thumbnail Switcher */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {gallery.map((img, idx) => (
                <button
                  key={`${img.label}-${idx}`}
                  onClick={() => handleSelectSlide(idx)}
                  className={`relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                    idx === selectedImageIdx
                      ? 'border-[#2B5B51] ring-2 ring-[#2B5B51]/25'
                      : 'border-[#142220]/10 opacity-75 hover:opacity-100'
                  }`}
                >
                  <ResilientImage
                    src={img.src}
                    alt={img.label}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: img.objectPosition || '50% 50%' }}
                  />
                  <span className="absolute inset-x-0 bottom-0 px-2 py-1 bg-[#142220]/65 text-[#FAFAF8] text-[10px] tracking-wide truncate">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Specifications & Purchase Panel */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#4A5B57]">
                  {product.categoryLabel} · {product.subCategory || 'PLAYPEN Collection'}
                </p>
                <span
                  className={`text-xs font-semibold ${
                    product.inStock ? 'text-[#2B5B51]' : 'text-[#873029]'
                  }`}
                >
                  {product.inStock ? 'In Stock · Ships Across UAE' : 'Out of Stock'}
                </span>
              </div>

              <h1 className="font-serif font-bold text-2xl sm:text-4xl text-[#142220] leading-tight mt-2">
                {product.name}
              </h1>
              <p className="text-sm sm:text-[15px] font-medium text-[#4A5B57] mt-1">
                {product.subtitle}
              </p>

              <div className="mt-3.5 sm:mt-4 flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                {product.originalPriceAed && product.originalPriceAed > unitPriceAed && (
                  <span className="text-base sm:text-lg text-[#647370] line-through tabular-nums">
                    {formatAed(product.originalPriceAed)}
                  </span>
                )}
                <span className="font-serif font-bold text-2xl sm:text-3xl text-[#142220] tabular-nums">
                  {formatAed(unitPriceAed)}
                </span>
                <span className="text-xs font-medium text-[#4A5B57]">
                  Includes VAT · Cash on Delivery available
                </span>
              </div>

              {product.rating && (
                <div className="mt-2.5 inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#2B5B51]">
                  <div className="flex items-center gap-0.5 text-[#C69E73]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-[#142220]">
                    {product.rating.toFixed(2)} out of 5
                  </span>
                  <span className="text-[#4A5B57]">
                    ({product.reviewCount ?? 5} customer reviews)
                  </span>
                </div>
              )}
            </div>

            <p className="text-[15px] text-[#1F3532] leading-relaxed">
              {product.description}
            </p>

            {/* Key Features Bullet List */}
            {product.benefits && product.benefits.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#F1F3EF] border border-[#142220]/10">
                <h2 className="text-sm font-bold text-[#142220] mb-2.5">Key Features</h2>
                <ul className="space-y-2 text-sm text-[#1F3532]">
                  {product.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5 leading-snug">
                      <Check className="w-4 h-4 text-[#2B5B51] shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Color / Wood Finish Selector */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-[#142220]">Color / Finish</span>
                <span className="font-semibold text-[#2B5B51]">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => {
                  const active = c.name === selectedColor;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-full border text-xs sm:text-[13px] transition-all cursor-pointer ${
                        active
                          ? 'border-[#2B5B51] bg-[#E5EFEA] text-[#142220] font-semibold'
                          : 'border-[#142220]/18 text-[#3C4B48] font-medium hover:border-[#2B5B51]/50'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-[#142220]/20 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playpen Size Selector */}
            {product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <span className="block text-xs sm:text-sm font-bold text-[#142220]">
                  Choose Size
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.sizes.map((cfg) => {
                    const active = cfg === selectedConfig;
                    const soldOut = product.unavailableSizes?.includes(cfg);
                    const sizePrice = product.sizePricesAed?.[cfg];
                    return (
                      <button
                        key={cfg}
                        disabled={soldOut}
                        onClick={() => setSelectedConfig(cfg)}
                        className={`min-h-[44px] px-4 py-3 rounded-xl border text-left text-xs sm:text-[13px] transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          soldOut
                            ? 'opacity-45 line-through cursor-not-allowed border-[#142220]/10'
                            : active
                            ? 'border-[#142220] bg-[#142220] text-[#FAFAF8] font-semibold'
                            : 'border-[#142220]/18 text-[#142220] font-medium hover:border-[#142220]'
                        }`}
                      >
                        <span>{cfg}</span>
                        {typeof sizePrice === 'number' && (
                          <span className="tabular-nums opacity-90">
                            {formatAed(sizePrice)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart + Buy Now */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
                <div className="inline-flex items-center border border-[#142220]/20 rounded-full bg-white h-12 px-1.5 shrink-0">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#142220] hover:bg-[#E6EAE4] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#142220] hover:bg-[#E6EAE4] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={!product.inStock}
                  className="flex-1 min-w-[170px] h-12 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md px-4"
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      Added to Cart
                    </>
                  ) : (
                    <>Add to Cart · {formatAed(unitPriceAed * quantity)}</>
                  )}
                </button>

                <button
                  onClick={() => onToggleWishlist(product.id)}
                  aria-label="Save playpen"
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isWishlisted
                      ? 'bg-[#142220] text-[#FAFAF8] border-[#142220]'
                      : 'border-[#142220]/20 text-[#142220] hover:bg-[#E6EAE4]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                  className="flex-1 h-12 rounded-full border border-[#142220] text-[#142220] text-sm font-semibold hover:bg-[#E6EAE4] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Buy Now
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div ref={shareMenuRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShareOpen((prev) => !prev)}
                    aria-expanded={shareOpen}
                    aria-haspopup="dialog"
                    aria-label="Share this product"
                    className={`h-12 px-5 rounded-full border text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer ${
                      shareOpen
                        ? 'border-[#142220] bg-[#142220] text-[#FAFAF8]'
                        : 'border-[#142220]/20 bg-white text-[#142220] hover:bg-[#E6EAE4]'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>

                  {shareOpen && (
                    <div
                      role="dialog"
                      aria-label="Share product options"
                      className="absolute right-0 bottom-14 z-40 w-[min(320px,calc(100vw-2rem))] rounded-2xl bg-[#FAFAF8] border border-[#142220]/15 shadow-[0_20px_50px_rgba(20,34,32,0.16)] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#142220]">
                          Share Product
                        </p>
                        <button
                          type="button"
                          onClick={() => setShareOpen(false)}
                          aria-label="Close share options"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[#4A5B57] hover:bg-[#E6EAE4] hover:text-[#142220] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl bg-[#F1F3EF] border border-[#142220]/10 p-1.5 pl-3">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          onFocus={(e) => e.currentTarget.select()}
                          aria-label="Direct product link"
                          className="flex-1 min-w-0 bg-transparent text-xs text-[#3C4B48] focus:outline-none truncate"
                        />
                        <button
                          type="button"
                          onClick={handleCopyShareLink}
                          className={`shrink-0 min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            linkCopied
                              ? 'bg-[#2B5B51] text-white'
                              : 'bg-[#142220] text-[#FAFAF8] hover:bg-[#2B5B51]'
                          }`}
                        >
                          {linkCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShareOpen(false)}
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F1F3EF] hover:bg-[#E6EAE4] text-[#142220] inline-flex items-center gap-2 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-[#2B5B51] shrink-0" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShareOpen(false)}
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F1F3EF] hover:bg-[#E6EAE4] text-[#142220] inline-flex items-center gap-2 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#2B5B51] shrink-0" />
                          <span>Facebook</span>
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShareOpen(false)}
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F1F3EF] hover:bg-[#E6EAE4] text-[#142220] inline-flex items-center gap-2 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#2B5B51] shrink-0" />
                          <span>X / Twitter</span>
                        </a>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
                          onClick={() => setShareOpen(false)}
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F1F3EF] hover:bg-[#E6EAE4] text-[#142220] inline-flex items-center gap-2 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#2B5B51] shrink-0" />
                          <span>Email</span>
                        </a>
                      </div>

                      {canNativeShare && (
                        <button
                          type="button"
                          onClick={handleNativeShare}
                          className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#142220]/15 text-xs font-semibold text-[#142220] hover:bg-[#E6EAE4] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>More Share Options</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-[#E6EAE4]/70 border border-[#142220]/10">
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#142220] flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-[#2B5B51]" />
                  Size &amp; Dimensions
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-[#3C4B48]">
                  {product.dimensions}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#142220] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#2B5B51]" />
                  Material
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-[#3C4B48]">
                  {product.material}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#142220] flex items-center gap-1.5">
                  <Weight className="w-3.5 h-3.5 text-[#2B5B51]" />
                  Weight Limit
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-[#3C4B48]">
                  {product.weightCapacity}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#142220] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#2B5B51]" />
                  Age Range
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-[#3C4B48]">
                  {product.ageSuitability}
                </p>
              </div>
            </div>

            {/* Safety, Folding, Delivery & What's Included */}
            <div className="space-y-4 pt-2 border-t border-[#142220]/10">
              <div>
                <h2 className="text-sm font-bold text-[#142220] flex items-center gap-2 mb-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#2B5B51]" />
                  Safety Details
                </h2>
                <ul className="space-y-2 text-sm text-[#3C4B48]">
                  {product.safetySpecs.map((spec) => (
                    <li key={spec} className="flex items-start gap-2 leading-snug">
                      <Check className="w-4 h-4 text-[#2B5B51] shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-[#142220]/8">
                <h2 className="text-sm font-bold text-[#142220] mb-1.5">
                  Folding &amp; Storage
                </h2>
                <p className="text-sm text-[#3C4B48] leading-relaxed">
                  {product.foldingAndStorage}
                </p>
              </div>

              <div className="pt-3 border-t border-[#142220]/8">
                <h2 className="text-sm font-bold text-[#142220] flex items-center gap-2 mb-1.5">
                  <Truck className="w-4 h-4 text-[#2B5B51]" />
                  UAE Delivery &amp; Setup
                </h2>
                <p className="text-sm text-[#3C4B48] leading-relaxed">
                  {product.deliveryInfo}
                </p>
              </div>

              {product.careNote && (
                <div className="pt-3 border-t border-[#142220]/8">
                  <h2 className="text-sm font-bold text-[#142220] mb-1.5">
                    Care &amp; Cleaning
                  </h2>
                  <p className="text-sm text-[#3C4B48] leading-relaxed">
                    {product.careNote}
                  </p>
                </div>
              )}

              {product.bundleIncludes && product.bundleIncludes.length > 0 && (
                <div className="pt-3 border-t border-[#142220]/8">
                  <h2 className="text-sm font-bold text-[#142220] mb-2">
                    What’s in the Box
                  </h2>
                  <ul className="space-y-1.5 text-sm text-[#3C4B48]">
                    {product.bundleIncludes.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[#2B5B51] font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Playpens */}
        {relatedProducts.length > 0 && (
          <section className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-[#142220]/10">
            <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
                  You May Also Like
                </p>
                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#142220] mt-1">
                  More Playpens
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  onSelect={onSelectProduct}
                  onQuickAdd={(p, sz, col) => onAddToCart(p, sz, col, 1)}
                  isWishlisted={wishlistIds.includes(rel.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* MOBILE / TABLET COMPACT STICKY BOTTOM PURCHASE BAR (< lg) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FAFAF8]/96 backdrop-blur-md border-t border-[#142220]/12 px-4 py-2.5 pb-safe shadow-[0_-8px_24px_rgba(20,34,32,0.08)]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif font-bold text-lg sm:text-xl text-[#142220] tabular-nums leading-tight">
              {formatAed(unitPriceAed * quantity)}
            </p>
            <p className="text-xs text-[#4A5B57] font-medium truncate">
              {selectedConfig.split('(')[0].trim()} · Qty {quantity}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock}
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] disabled:opacity-50 transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                Added
              </>
            ) : product.inStock ? (
              'Add to Cart'
            ) : (
              'Out of Stock'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
