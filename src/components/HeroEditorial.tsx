import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { PageRoute, Product } from '../types/store';
import { HERO_CHAPTERS } from '../data/catalog';
import { ResilientImage } from './ResilientImage';

interface HeroEditorialProps {
  onNavigate: (route: PageRoute) => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
}

export function HeroEditorial({
  onNavigate,
  onSelectProduct,
  products,
}: HeroEditorialProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_CHAPTERS.length);
    }, 6800);
    return () => window.clearInterval(id);
  }, []);

  const currentChapter = HERO_CHAPTERS[activeSlide];
  const featuredProduct =
    products.find((p) => p.id === currentChapter.featuredProductId) || products[0];

  return (
    <section
      className="relative w-full overflow-hidden transition-colors duration-1000"
      style={{ backgroundColor: currentChapter.bgColor }}
    >
      {/* Subtle Architectural Radial Gallery Depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(43,91,81,0.08)_0%,transparent_70%)]"
      />

      {/* MOBILE-FIRST PORTRAIT HERO (< lg) */}
      <div className="lg:hidden relative pt-[68px] pb-8 px-4 sm:px-6 max-w-xl mx-auto">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.04em] text-[#2B5B51]">
            <ShieldCheck className="w-4 h-4 text-[#2B5B51] shrink-0" />
            <span className="truncate">{currentChapter.kicker}</span>
          </div>

          <h1
            className="font-serif font-bold text-[#142220] leading-[1.12] tracking-[-0.015em] whitespace-pre-line"
            style={{ fontSize: 'clamp(1.75rem, 6.8vw, 2.35rem)', textWrap: 'balance' }}
          >
            {currentChapter.headline}
          </h1>

          <p className="text-[15px] text-[#3C4B48] leading-relaxed">
            {currentChapter.description}
          </p>
        </div>

        {/* Portrait Playpen Showcase — Full Frame Without Cropping */}
        <div className="mt-4 relative">
          <div
            className="relative aspect-[4/5] max-h-[390px] sm:max-h-[450px] w-full rounded-[22px] overflow-hidden shadow-[0_22px_50px_rgba(20,34,32,0.14)] border border-[#142220]/10"
            style={{ backgroundColor: currentChapter.surfaceColor }}
          >
            {HERO_CHAPTERS.map((chap, idx) => (
              <div
                key={`mob-${chap.id}`}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  idx === activeSlide
                    ? 'opacity-100'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                <ResilientImage
                  src={chap.mobileImage || chap.image}
                  alt={chap.headline.replace('\n', ' ')}
                  fallbackTitle={chap.kicker}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}
          </div>

          {/* Mobile Chapter Switcher */}
          <div className="mt-2.5 flex items-center justify-center gap-2">
            {HERO_CHAPTERS.map((chap, idx) => (
              <button
                key={`mob-dot-${chap.id}`}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`View slide ${chap.indexLabel}`}
                className="min-h-[44px] px-2.5 flex items-center gap-1.5 cursor-pointer"
              >
                <span
                  className={`h-[2.5px] rounded-full transition-all duration-300 ${
                    idx === activeSlide
                      ? 'w-8 bg-[#2B5B51]'
                      : 'w-4 bg-[#142220]/20'
                  }`}
                />
                <span
                  className={`text-xs tabular-nums ${
                    idx === activeSlide ? 'text-[#2B5B51] font-bold' : 'text-[#4A5B57] font-medium'
                  }`}
                >
                  {chap.indexLabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Large Touch-Friendly Primary Actions */}
        <div className="mt-2 space-y-2.5">
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="w-full min-h-[48px] px-6 py-3.5 rounded-full bg-[#142220] hover:bg-[#2B5B51] text-[#FAFAF8] text-sm font-semibold active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2.5 shadow-[0_14px_30px_rgba(20,34,32,0.16)] cursor-pointer"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('collections')}
            className="w-full min-h-[44px] px-6 py-3 rounded-full border border-[#142220]/25 text-[#142220] text-sm font-semibold hover:bg-[#142220]/5 transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            Explore Collections
          </button>
        </div>

        {/* Clean Featured Specification Summary Card */}
        {featuredProduct && (
          <div className="mt-4 rounded-2xl bg-[#FAFAF8]/95 backdrop-blur-sm p-4 border border-[#142220]/10 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#4A5B57]">
                  {featuredProduct.categoryLabel}
                </p>
                <h2 className="font-serif text-lg font-semibold text-[#142220] leading-snug mt-0.5 truncate">
                  {featuredProduct.name}
                </h2>
              </div>
              <span className="text-sm font-bold text-[#142220] whitespace-nowrap tabular-nums">
                AED {featuredProduct.priceAed.toLocaleString()}
              </span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-[#142220]/10 flex items-center justify-between gap-3 text-xs text-[#3C4B48]">
              <span className="truncate font-medium">{featuredProduct.dimensions}</span>
              <button
                type="button"
                onClick={() => onSelectProduct(featuredProduct)}
                className="min-h-[36px] inline-flex items-center gap-1 text-[#142220] font-semibold whitespace-nowrap cursor-pointer"
              >
                View Product
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP FULL-SCREEN HERO (lg+) */}
      <div className="hidden lg:flex min-h-screen flex-col justify-center pt-24 pb-12">
        <div className="max-w-[1440px] w-full mx-auto px-8 lg:px-12 py-10">
          <div className="grid grid-cols-12 gap-12 items-center">
            {/* Left Typographic Showcase */}
            <div className="col-span-5 space-y-6 z-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.06em] uppercase text-[#2B5B51]">
                <ShieldCheck className="w-4 h-4 text-[#2B5B51]" />
                <span>{currentChapter.kicker}</span>
              </div>

              <h1
                className="font-serif font-bold text-[42px] xl:text-[52px] leading-[1.12] tracking-[-0.015em] text-[#142220] whitespace-pre-line"
                style={{ textWrap: 'balance' }}
              >
                {currentChapter.headline}
              </h1>

              <p className="text-[17px] text-[#3C4B48] leading-relaxed max-w-lg">
                {currentChapter.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('shop')}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold hover:bg-[#2B5B51] transition-all duration-300 shadow-[0_14px_30px_rgba(20,34,32,0.16)] cursor-pointer"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('collections')}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-[#142220]/25 text-[#142220] text-sm font-semibold hover:border-[#2B5B51] hover:text-[#2B5B51] hover:bg-[#2B5B51]/5 transition-colors cursor-pointer"
                >
                  Explore Collections
                </button>
              </div>

              {/* Chapter Switcher Pills */}
              <div className="pt-6 flex items-center gap-3">
                {HERO_CHAPTERS.map((chap, idx) => (
                  <button
                    key={chap.id}
                    onClick={() => setActiveSlide(idx)}
                    className={`group flex items-center gap-2 py-1.5 transition-all cursor-pointer ${
                      idx === activeSlide
                        ? 'text-[#2B5B51]'
                        : 'text-[#4A5B57] hover:text-[#142220]'
                    }`}
                  >
                    <span
                      className={`h-[2px] transition-all duration-500 ${
                        idx === activeSlide
                          ? 'w-10 bg-[#2B5B51]'
                          : 'w-5 bg-[#142220]/20 group-hover:w-7'
                      }`}
                    />
                    <span className="text-xs font-semibold tabular-nums">
                      {chap.indexLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Full-Scale Architectural Playpen Showcase */}
            <div className="col-span-7 relative">
              <div
                className="relative aspect-[16/11] w-full rounded-[28px] overflow-hidden shadow-[0_32px_70px_rgba(20,34,32,0.14)] border border-[#142220]/8"
                style={{ backgroundColor: currentChapter.surfaceColor }}
              >
                {HERO_CHAPTERS.map((chap, idx) => (
                  <div
                    key={chap.id}
                    className={`absolute inset-0 transition-all duration-1000 ease-out ${
                      idx === activeSlide
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-[1.03] pointer-events-none'
                    }`}
                  >
                    <ResilientImage
                      src={chap.image}
                      alt={chap.headline.replace('\n', ' ')}
                      fallbackTitle={chap.kicker}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}

                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#142220]/45 via-[#142220]/10 to-transparent pointer-events-none" />
              </div>

              {/* Floating Editorial Product Specification Card (Desktop) */}
              {featuredProduct && (
                <div className="absolute bottom-6 right-6 w-[340px] rounded-2xl bg-[#FAFAF8]/95 backdrop-blur-md p-5 border border-[#142220]/10 shadow-[0_18px_45px_rgba(20,34,32,0.16)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#4A5B57]">
                        {featuredProduct.categoryLabel}
                      </p>
                      <h2 className="font-serif text-lg font-semibold text-[#142220] leading-snug mt-0.5 truncate">
                        {featuredProduct.name}
                      </h2>
                    </div>
                    <span className="text-sm font-bold text-[#142220] whitespace-nowrap tabular-nums">
                      AED {featuredProduct.priceAed.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#142220]/10 flex items-center justify-between gap-3 text-xs text-[#3C4B48]">
                    <span className="truncate font-medium">{featuredProduct.dimensions}</span>
                    <button
                      onClick={() => onSelectProduct(featuredProduct)}
                      className="inline-flex items-center gap-1 text-[#142220] font-semibold hover:underline whitespace-nowrap cursor-pointer"
                    >
                      View Product
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
