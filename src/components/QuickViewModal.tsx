import { useState } from 'react';
import { X, Maximize2, ShieldCheck, ArrowRight, Heart } from 'lucide-react';
import { Product } from '../types/store';
import { ResilientImage } from './ResilientImage';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onViewFullProduct: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export function QuickViewModal({
  product,
  onClose,
  onAddToCart,
  onViewFullProduct,
  isWishlisted,
  onToggleWishlist,
}: QuickViewModalProps) {
  const [selectedConfig, setSelectedConfig] = useState(
    product?.sizes[0] || 'Standard Frame'
  );
  const [selectedColor, setSelectedColor] = useState(
    product?.colors[0]?.name || 'Warm Beech'
  );

  if (!product) return null;

  const activeConfig = product.sizes.includes(selectedConfig)
    ? selectedConfig
    : product.sizes[0] || 'Standard Frame';
  const activeColor = product.colors.some((c) => c.name === selectedColor)
    ? selectedColor
    : product.colors[0]?.name || 'Warm Beech';

  return (
    <div className="fixed inset-0 z-50 bg-[#142220]/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAFAF8] w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl sm:rounded-[28px] shadow-2xl border border-[#142220]/12 relative grid grid-cols-1 md:grid-cols-12">
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-11 h-11 rounded-full bg-[#FAFAF8]/92 text-[#142220] flex items-center justify-center hover:bg-white cursor-pointer shadow"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="md:col-span-6 bg-[#E6EAE4] aspect-[4/3] md:aspect-auto">
          <ResilientImage
            src={product.image}
            alt={product.name}
            fallbackTitle={product.categoryLabel}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#2B5B51]">
              {product.categoryLabel}
            </p>
            <h2 className="font-serif font-bold text-2xl text-[#142220] leading-snug pr-8 md:pr-0">
              {product.name}
            </h2>
            <p className="font-serif font-bold text-xl text-[#142220] tabular-nums">
              AED {product.priceAed.toLocaleString()}
            </p>
            <p className="text-sm text-[#3C4B48] leading-relaxed line-clamp-3">
              {product.description}
            </p>

            <div className="pt-2 space-y-2 text-xs sm:text-[13px] font-medium text-[#1F3532]">
              <p className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-[#4A5B57] shrink-0" />
                <span>{product.dimensions}</span>
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4A5B57] shrink-0" />
                <span>{product.ageSuitability} · {product.weightCapacity}</span>
              </p>
            </div>

            {product.colors.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold text-[#142220] mb-1.5">
                  Color / Finish: <span className="font-medium text-[#4A5B57]">{activeColor}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      title={c.name}
                      aria-label={`Select finish ${c.name}`}
                      className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          activeColor === c.name
                            ? 'border-[#142220] scale-110'
                            : 'border-[#142220]/15'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-bold text-[#142220] mb-1.5">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((cfg) => (
                    <button
                      key={cfg}
                      onClick={() => setSelectedConfig(cfg)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-full border text-xs font-semibold cursor-pointer ${
                        activeConfig === cfg
                          ? 'bg-[#142220] text-[#FAFAF8] border-[#142220]'
                          : 'border-[#142220]/20 text-[#142220]'
                      }`}
                    >
                      {cfg}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onAddToCart(product, activeConfig, activeColor, 1);
                  onClose();
                }}
                disabled={!product.inStock}
                className="flex-1 min-h-[48px] py-3 px-5 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] cursor-pointer"
              >
                Add to Cart
              </button>
              <button
                onClick={() => onToggleWishlist(product.id)}
                aria-label="Wishlist toggle"
                className={`w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer shrink-0 ${
                  isWishlisted
                    ? 'bg-[#142220] text-[#FAFAF8] border-[#142220]'
                    : 'border-[#142220]/20 text-[#142220]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                onViewFullProduct(product);
              }}
              className="w-full min-h-[44px] py-2.5 text-sm font-semibold text-[#142220] inline-flex items-center justify-center gap-1.5 hover:underline cursor-pointer"
            >
              View Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
