import { useState } from 'react';
import { ArrowRight, ShieldCheck, Layers, Truck } from 'lucide-react';
import { PageRoute, Product } from '../types/store';
import { CATEGORY_DIRECTORY } from '../data/catalog';
import { PlaypenCollectionsView } from './PlaypenCollectionsView';
import { ProductCard } from './ProductCard';
import { ResilientImage } from './ResilientImage';

interface HomeSectionsProps {
  products: Product[];
  onNavigate: (route: PageRoute) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onQuickAdd: (product: Product, size: string, color: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
}

export function HomeSections({
  products,
  onNavigate,
  onSelectProduct,
  onQuickView,
  onQuickAdd,
  wishlistIds,
  onToggleWishlist,
}: HomeSectionsProps) {
  const [curationTab, setCurationTab] = useState<'featured' | 'bestsellers' | 'new'>(
    'featured'
  );

  const curatedList = products
    .filter((p) => {
      if (curationTab === 'featured') return p.isFeatured;
      if (curationTab === 'bestsellers') return p.isBestSeller;
      return p.isNewArrival;
    })
    .slice(0, 3);

  const displayCurated = curatedList.length > 0 ? curatedList : products.slice(0, 3);

  return (
    <div className="bg-[#FAFAF8]">
      {/* 1. Animated 4-Chapter Scroll Editorial Lookbook */}
      <PlaypenCollectionsView
        products={products}
        embedded
        onSelectProduct={onSelectProduct}
        onNavigate={onNavigate}
      />

      {/* 2. Featured / Best Sellers / New Arrivals Showcase */}
      <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-8 lg:px-12 bg-[#FAFAF8]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6 pb-6 sm:pb-8 border-b border-[#142220]/10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
                Parent Favorites
              </p>
              <h2 className="font-serif font-bold text-2xl sm:text-4xl lg:text-[42px] text-[#142220] mt-1.5">
                Popular Playpens
              </h2>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {(
                [
                  ['featured', 'Featured'],
                  ['bestsellers', 'Best Sellers'],
                  ['new', 'New Arrivals'],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setCurationTab(tab)}
                  className={`whitespace-nowrap px-5 min-h-[44px] py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
                    curationTab === tab
                      ? 'bg-[#142220] text-[#FAFAF8]'
                      : 'bg-[#E6EAE4] text-[#1F3532] hover:bg-[#D7DDD5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-7 pt-8 sm:pt-10">
            {displayCurated.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
                onQuickView={onQuickView}
                onQuickAdd={onQuickAdd}
                isWishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>

          <div className="mt-8 sm:mt-10 text-center">
            <button
              onClick={() => onNavigate('shop')}
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-colors cursor-pointer"
            >
              Shop Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Four Specialized Playpen Collections Grid */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 lg:px-12 bg-[#F1F3EF] border-y border-[#142220]/8">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
                For Every Home &amp; Age
              </p>
              <h2 className="font-serif font-bold text-2xl sm:text-4xl text-[#142220] mt-1">
                Shop by Playpen Type
              </h2>
            </div>
            <button
              onClick={() => onNavigate('collections')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#142220] hover:text-[#2B5B51] hover:underline cursor-pointer self-start sm:self-auto min-h-[40px]"
            >
              View All Collections
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {CATEGORY_DIRECTORY.map((cat) => (
              <button
                key={cat.route}
                onClick={() => onNavigate(cat.route)}
                className="group text-left bg-[#FAFAF8] rounded-2xl overflow-hidden border border-[#142220]/10 hover:border-[#2B5B51]/35 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(20,34,32,0.08)] transition-all duration-500 cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#DCE2DA]">
                  <ResilientImage
                    src={cat.image}
                    alt={cat.label}
                    fallbackTitle={cat.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#4A5B57] truncate">
                      {cat.ageOrNote}
                    </p>
                    <h3 className="font-serif font-semibold text-base sm:text-xl text-[#142220] mt-1 group-hover:underline leading-snug">
                      {cat.label}
                    </h3>
                    <p className="hidden sm:block text-sm text-[#3C4B48] mt-1.5 leading-relaxed">
                      {cat.shortDesc}
                    </p>
                  </div>
                  <span className="text-xs sm:text-[13px] font-semibold text-[#142220] inline-flex items-center gap-1">
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Engineering Trust & UAE Support */}
      <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-8 lg:px-12 bg-[#FAFAF8]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E5EFEA] text-[#2B5B51] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#142220]">
              Tested &amp; Certified Safe
            </h3>
            <p className="text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
              Every playpen meets strict international safety rules (EN 12227 &amp; ASTM F406) with
              child-safe locks, non-slip bases, and non-toxic finishes.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E5EFEA] text-[#2B5B51] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#142220]">
              Safe, Easy-Clean Materials
            </h3>
            <p className="text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
              We use breathable cationic fabric, food-grade HDPE panels, waterproof XPE foam, and
              BPA-free plastic that wipe clean in seconds and look great at home.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-[#F1F3EF] border border-[#142220]/10 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E5EFEA] text-[#2B5B51] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#142220]">
              Fast UAE Delivery
            </h3>
            <p className="text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
              Free scheduled UAE delivery on orders over AED 750. Pay online or with Cash on
              Delivery, with optional home assembly.
            </p>
          </div>
        </div>

        {/* Private Showroom Banner */}
        <div className="max-w-[1440px] mx-auto mt-10 sm:mt-14 rounded-3xl sm:rounded-[28px] bg-[#142220] text-[#FAFAF8] p-6 sm:p-12 border border-[#2B5B51]/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(43,91,81,0.35)_0%,transparent_70%)]"
          />
          <div className="space-y-2 max-w-2xl relative">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#D4B483]">
              Dubai Design District Showroom
            </p>
            <h2 className="font-serif font-bold text-2xl sm:text-4xl leading-tight">
              Need Help Choosing the Right Size?
            </h2>
            <p className="text-sm sm:text-base text-[#DCE2DA] leading-relaxed">
              Share your room size with our UAE team. We will help you pick the best playpen shape
              or custom layout for your nursery or living room.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto relative">
            <button
              onClick={() => onNavigate('contact')}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-full bg-[#FAFAF8] text-[#142220] text-sm font-semibold hover:bg-[#E6EAE4] transition-colors cursor-pointer text-center"
            >
              Contact Us
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-full border border-[#FAFAF8]/35 text-[#FAFAF8] text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer text-center"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
