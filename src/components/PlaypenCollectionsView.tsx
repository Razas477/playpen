import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Maximize2, ShieldCheck, Layers } from 'lucide-react';
import { formatAed } from '../data/catalog';
import { PLAYPEN_CHAPTERS } from '../data/playpenCollections';
import { PageRoute, PlaypenCollectionChapter, Product, ProductCategory } from '../types/store';
import { ResilientImage } from './ResilientImage';

interface PlaypenCollectionsViewProps {
  products: Product[];
  initialCollection?: ProductCategory;
  embedded?: boolean;
  onSelectProduct: (product: Product) => void;
  onNavigate: (route: PageRoute) => void;
}

export function PlaypenCollectionsView({
  products,
  initialCollection,
  embedded = false,
  onSelectProduct,
  onNavigate,
}: PlaypenCollectionsViewProps) {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (!initialCollection) return 0;
    const found = PLAYPEN_CHAPTERS.findIndex((c) => c.id === initialCollection);
    return found >= 0 ? found : 0;
  });

  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!initialCollection) return;
    const idx = PLAYPEN_CHAPTERS.findIndex((c) => c.id === initialCollection);
    if (idx >= 0) {
      setActiveIndex(idx);
      const targetEl = sectionRefs.current[idx];
      if (targetEl) {
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    }
  }, [initialCollection]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sectionRefs.current.forEach((el, idx) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
              setActiveIndex(idx);
            }
          });
        },
        { threshold: [0.35, 0.65] }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const currentChapter: PlaypenCollectionChapter =
    PLAYPEN_CHAPTERS[activeIndex] || PLAYPEN_CHAPTERS[0];

  const resolveChapterProduct = (chapter: PlaypenCollectionChapter): Product | undefined => {
    return (
      products.find((p) => p.id === chapter.featuredProductId) ||
      products.find((p) => p.category === chapter.id) ||
      products[0]
    );
  };

  const scrollToChapter = (idx: number) => {
    setActiveIndex(idx);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-[#FAFAF8]">
      {/* Editorial Header + Quick Collection Switcher */}
      <div
        className={`${
          embedded ? 'pt-10 sm:pt-16 lg:pt-20' : 'pt-20 lg:pt-28'
        } pb-6 sm:pb-8 px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto`}
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6 pb-6 sm:pb-8 border-b border-[#142220]/12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#2B5B51]">
              Playpen Lookbook · 4 Collections
            </p>
            <h2 className="font-serif font-bold text-2xl sm:text-4xl lg:text-[42px] mt-1.5 leading-tight text-[#142220]">
              Explore Our Playpen Collections
            </h2>
          </div>

          {/* 4 Collection Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {PLAYPEN_CHAPTERS.map((chap, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={chap.id}
                  onClick={() => scrollToChapter(idx)}
                  className={`whitespace-nowrap px-4 py-2 min-h-[40px] rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    active
                      ? 'bg-[#142220] text-[#FAFAF8]'
                      : 'bg-[#142220]/8 text-[#1F3532] hover:bg-[#142220]/15'
                  }`}
                >
                  {chap.chapterNumber} · {chap.collectionTitle.replace(' Playpens', '')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 8 Full-Screen Scroll-Triggered Playpen Chapters */}
      <div className="divide-y divide-black/5">
        {PLAYPEN_CHAPTERS.map((chapter, idx) => {
          const matchedProduct = resolveChapterProduct(chapter);
          const isReverse = idx % 2 === 1;
          const isDark = chapter.isDarkSurface;

          return (
            <section
              key={chapter.id}
              ref={(el) => {
                sectionRefs.current[idx] = el;
              }}
              style={{ backgroundColor: chapter.bgColor }}
              className="lg:min-h-[84vh] py-10 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-12 flex items-center transition-colors duration-700"
            >
              <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-14 items-center">
                {/* Playpen Photography Frame */}
                <div
                  className={`lg:col-span-7 relative ${
                    isReverse ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <div
                    className="group relative aspect-[4/3] rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] lg:shadow-[0_32px_70px_rgba(0,0,0,0.15)] transition-transform duration-700 lg:hover:scale-[1.01]"
                    style={{ backgroundColor: chapter.surfaceColor }}
                  >
                    <ResilientImage
                      src={chapter.image}
                      alt={chapter.productName}
                      fallbackTitle={chapter.collectionTitle}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out lg:group-hover:scale-[1.04]"
                    />

                    {/* Chapter Badge */}
                    <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-[#FAFAF8]/95 text-[#142220] text-xs font-semibold shadow-sm">
                      {chapter.chapterNumber} · {chapter.collectionTitle}
                    </div>

                    {/* Quick Spec Card (Tablet & Desktop) */}
                    <div className="hidden sm:flex absolute bottom-5 left-5 right-5 items-center justify-between gap-4 px-5 py-3.5 rounded-2xl backdrop-blur-md bg-[#FAFAF8]/95 text-[#142220] border border-[#142220]/10 shadow-lg">
                      <div className="flex items-center gap-5 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <Maximize2 className="w-3.5 h-3.5 text-[#4A5B57]" />
                          {chapter.dimensions}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#3C4B48] font-medium">
                          <Layers className="w-3.5 h-3.5 text-[#4A5B57]" />
                          {chapter.materialBadge}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#2B5B51]">
                        {chapter.ageSuitability}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Column */}
                <div
                  className={`lg:col-span-5 space-y-4 sm:space-y-5 ${
                    isReverse ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <div className="space-y-1.5">
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.06em] ${
                        isDark ? 'text-[#D4B483]' : 'text-[#2B5B51]'
                      }`}
                    >
                      {chapter.collectionTitle} · {chapter.tagline}
                    </p>
                    <h3
                      className={`font-serif font-bold text-2xl sm:text-4xl leading-[1.15] ${
                        isDark ? 'text-[#FAFAF8]' : 'text-[#142220]'
                      }`}
                    >
                      {chapter.productName}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                    <span
                      className={`font-serif font-bold text-2xl sm:text-3xl tabular-nums ${
                        isDark ? 'text-[#F1F3EF]' : 'text-[#142220]'
                      }`}
                    >
                      {matchedProduct?.priceRangeMaxAed
                        ? `${formatAed(matchedProduct.priceAed)} – ${formatAed(matchedProduct.priceRangeMaxAed)}`
                        : formatAed(matchedProduct?.priceAed ?? chapter.priceAed)}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isDark ? 'text-[#C6D2CD]' : 'text-[#4A5B57]'
                      }`}
                    >
                      Cash on Delivery · Free UAE Delivery Over AED 750
                    </span>
                  </div>

                  <p
                    className={`text-[15px] sm:text-base leading-relaxed ${
                      isDark ? 'text-[#E4EAE3]' : 'text-[#3C4B48]'
                    }`}
                  >
                    {chapter.description}
                  </p>

                  {/* Specification Grid */}
                  <div
                    className={`grid grid-cols-1 min-[375px]:grid-cols-2 gap-4 py-4 border-y ${
                      isDark ? 'border-[#FAFAF8]/15' : 'border-[#142220]/12'
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.06em] ${
                          isDark ? 'text-[#B4C2BC]' : 'text-[#4A5B57]'
                        }`}
                      >
                        Size &amp; Age
                      </p>
                      <p
                        className={`text-sm font-semibold mt-1 ${
                          isDark ? 'text-[#FAFAF8]' : 'text-[#142220]'
                        }`}
                      >
                        {chapter.dimensions} · {chapter.ageSuitability}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.06em] ${
                          isDark ? 'text-[#B4C2BC]' : 'text-[#4A5B57]'
                        }`}
                      >
                        Safety Standard
                      </p>
                      <p
                        className={`text-sm font-semibold mt-1 inline-flex items-center gap-1.5 ${
                          isDark ? 'text-[#FAFAF8]' : 'text-[#142220]'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        {chapter.safetyStandard}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                    {matchedProduct && (
                      <button
                        onClick={() => onSelectProduct(matchedProduct)}
                        className={`w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#FAFAF8] text-[#142220] hover:bg-[#E6EAE4]'
                            : 'bg-[#142220] text-[#FAFAF8] hover:bg-[#2B5B51]'
                        }`}
                      >
                        View Product
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate('shop')}
                      className={`w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border text-sm font-semibold transition-colors cursor-pointer ${
                        isDark
                          ? 'border-[#FAFAF8]/30 text-[#FAFAF8] hover:bg-white/10'
                          : 'border-[#142220]/25 text-[#142220] hover:bg-[#142220]/5'
                      }`}
                    >
                      Shop All Playpens
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
