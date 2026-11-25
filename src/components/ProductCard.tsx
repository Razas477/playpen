import { useState } from 'react';
import { Heart, Eye, ShoppingBag, Maximize2 } from 'lucide-react';
import { Product } from '../types/store';
import { ResilientImage } from './ResilientImage';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onQuickAdd: (product: Product, size: string, color: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export function ProductCard({
  product,
  onSelect,
  onQuickView,
  onQuickAdd,
  isWishlisted,
  onToggleWishlist,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);

  const secondaryImage =
    product.gallery && product.gallery.length > 1
      ? product.gallery[1].src
      : product.image;

  const defaultSize = product.sizes[0] || 'Standard Frame';
  const defaultColor = product.colors[0]?.name || 'Warm Beech';

  return (
    <article
      className="group flex flex-col bg-[#FAFAF8] rounded-2xl overflow-hidden border border-[#142220]/10 hover:border-[#2B5B51]/35 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(20,34,32,0.09)] transition-all duration-500"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image Frame */}
      <div className="relative aspect-[4/3] bg-[#E6EAE4] overflow-hidden">
        <button
          onClick={() => onSelect(product)}
          className="block w-full h-full cursor-pointer text-left"
          aria-label={`View ${product.name}`}
        >
          <ResilientImage
            src={product.image}
            alt={product.name}
            fallbackTitle={product.categoryLabel}
            className={`w-full h-full object-cover transition-all duration-700 ${
              hovered && secondaryImage !== product.image
                ? 'opacity-0 scale-105'
                : 'opacity-100 group-hover:scale-105'
            }`}
          />
          {secondaryImage !== product.image && (
            <ResilientImage
              src={secondaryImage}
              alt={`${product.name} alternate angle`}
              fallbackTitle={product.categoryLabel}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                hovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}
        </button>

        {/* Top Left Tag */}
        <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 flex flex-wrap items-center gap-1.5 pointer-events-none max-w-[calc(100%-3.5rem)]">
          {product.featuredTag && (
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-[#FAFAF8]/95 backdrop-blur-sm text-[11px] font-semibold text-[#142220] shadow-sm truncate">
              {product.featuredTag}
            </span>
          )}
          {!product.inStock && (
            <span className="px-2.5 py-1 rounded-full bg-[#873029] text-[#FAFAF8] text-[10px] sm:text-[11px] font-semibold">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button (44px touch target on mobile) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? 'Remove from saved playpens' : 'Save playpen'}
          className={`absolute top-2 right-2 sm:top-3.5 sm:right-3.5 w-10 h-10 lg:w-9 lg:h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-[#142220] text-[#FAFAF8]'
              : 'bg-[#FAFAF8]/90 text-[#142220] hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Bottom Hover Quick Actions (Desktop Only) */}
        <div className="hidden lg:flex absolute inset-x-3.5 bottom-3.5 items-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product, defaultSize, defaultColor);
            }}
            disabled={!product.inStock}
            className="flex-1 py-2.5 px-3 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#2B5B51] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              aria-label={`Quick view ${product.name}`}
              className="w-10 h-10 rounded-full bg-[#FAFAF8]/95 text-[#142220] flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow-lg"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center justify-between gap-1.5 text-[11px] font-medium text-[#4A5B57]">
            <span className="truncate">{product.categoryLabel}</span>
            <span className="shrink-0 hidden sm:inline">{product.ageSuitability}</span>
          </div>

          <button
            onClick={() => onSelect(product)}
            className="mt-1 sm:mt-1.5 text-left block w-full cursor-pointer group/title"
          >
            <h3 className="font-serif font-semibold text-base min-[375px]:text-lg sm:text-xl text-[#142220] leading-snug group-hover/title:underline line-clamp-2">
              {product.name}
            </h3>
            <p className="text-xs sm:text-[13px] text-[#4A5B57] mt-1 line-clamp-2 sm:line-clamp-1 leading-snug">
              {product.subtitle}
            </p>
          </button>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {/* Dimensions & Colors Row */}
          <div className="flex items-center justify-between gap-2 pt-2.5 sm:pt-3 border-t border-[#142220]/8 text-xs text-[#3C4B48]">
            <span className="inline-flex items-center gap-1 truncate min-w-0 font-medium">
              <Maximize2 className="w-3.5 h-3.5 text-[#4A5B57] shrink-0" />
              <span className="truncate">{product.dimensions}</span>
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {product.colors.slice(0, 3).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="w-3.5 h-3.5 rounded-full border border-[#142220]/20"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-serif text-base sm:text-xl text-[#142220] font-bold tabular-nums">
              AED {product.priceAed.toLocaleString()}
            </span>
            <button
              onClick={() => onSelect(product)}
              className="hidden lg:inline-flex text-xs font-semibold text-[#142220] hover:text-[#2B5B51] hover:underline cursor-pointer"
            >
              View Details →
            </button>
          </div>

          {/* Mobile & Tablet Touch Quick Actions (Direct Access) */}
          <div className="flex lg:hidden items-center gap-1.5 pt-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(product, defaultSize, defaultColor);
              }}
              disabled={!product.inStock}
              className="flex-1 min-h-[40px] px-2.5 py-2 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold hover:bg-[#2B5B51] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              {product.inStock ? (
                <>
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Add to Cart</span>
                </>
              ) : (
                'Out of Stock'
              )}
            </button>
            {onQuickView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(product);
                }}
                aria-label={`Quick view ${product.name}`}
                className="w-10 h-10 shrink-0 rounded-full border border-[#142220]/20 bg-[#E6EAE4]/70 text-[#142220] flex items-center justify-center hover:bg-[#E6EAE4] transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
