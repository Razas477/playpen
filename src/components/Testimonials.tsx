import { useState } from 'react';
import { ArrowRight, CheckCircle2, Quote, Star } from 'lucide-react';
import { CUSTOMER_TESTIMONIALS } from '../data/testimonials';
import { Product } from '../types/store';

interface TestimonialsProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export function Testimonials({ products, onSelectProduct }: TestimonialsProps) {
  const [filter, setFilter] = useState<'all' | 'playpens' | 'mats-balls'>('all');
  const [showAll, setShowAll] = useState(false);

  const filtered = CUSTOMER_TESTIMONIALS.filter((item) =>
    filter === 'all' ? true : item.category === filter
  );

  const visibleReviews =
    filter === 'all' && !showAll ? filtered.slice(0, 3) : filtered;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="py-14 sm:py-20 lg:py-24 px-4 sm:px-8 lg:px-12 bg-[#F1F3EF] border-t border-[#142220]/10"
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Header & Rating Summary */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6 pb-6 sm:pb-8 border-b border-[#142220]/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
              <span>Parent Reviews</span>
              <span className="text-[#142220]/30">·</span>
              <span className="inline-flex items-center gap-1 text-[#142220]">
                <Star className="w-3.5 h-3.5 fill-[#C69E73] text-[#C69E73]" />
                <span>5.0 Average Rating</span>
              </span>
            </div>
            <h2
              id="testimonials-heading"
              className="font-serif font-bold text-2xl sm:text-4xl lg:text-[42px] text-[#142220]"
            >
              Trusted by Parents Across the UAE
            </h2>
            <p className="text-sm sm:text-base text-[#3C4B48] max-w-2xl">
              Real feedback from families using PLAYPEN playpens, folding mats, and ocean balls
              every day at home.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {(
              [
                ['all', 'All Reviews'],
                ['playpens', 'Playpens'],
                ['mats-balls', 'Mats & Balls'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFilter(key);
                  setShowAll(false);
                }}
                className={`whitespace-nowrap px-5 min-h-[44px] py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
                  filter === key
                    ? 'bg-[#142220] text-[#FAFAF8]'
                    : 'bg-[#FAFAF8] text-[#1F3532] border border-[#142220]/12 hover:bg-[#E6EAE4]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-8 sm:pt-10">
          {visibleReviews.map((review) => {
            const matchedProduct = products.find((p) => p.id === review.productId);
            return (
              <article
                key={review.id}
                className="rounded-3xl bg-[#FAFAF8] border border-[#142220]/10 p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-[0_12px_30px_rgba(20,34,32,0.04)] hover:border-[#2B5B51]/35 transition-colors"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="flex items-center gap-0.5 text-[#C69E73]"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: review.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2B5B51]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Quote
                      aria-hidden="true"
                      className="w-5 h-5 text-[#2B5B51]/45 shrink-0 mt-1"
                    />
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-[#142220] leading-snug">
                      {review.title}
                    </h3>
                  </div>

                  <p className="text-sm sm:text-[15px] text-[#3C4B48] leading-relaxed">
                    “{review.quote}”
                  </p>
                </div>

                <div className="pt-4 border-t border-[#142220]/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="w-10 h-10 rounded-full bg-[#E5EFEA] text-[#142220] font-serif font-bold text-base flex items-center justify-center shrink-0"
                    >
                      {review.customerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#142220] truncate">
                        {review.customerName}
                      </p>
                      <p className="text-xs font-medium text-[#4A5B57] truncate">
                        {review.location}, UAE · {review.dateLabel}
                      </p>
                    </div>
                  </div>

                  {matchedProduct && (
                    <button
                      type="button"
                      onClick={() => onSelectProduct(matchedProduct)}
                      className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F1F3EF] hover:bg-[#E6EAE4] text-left text-xs font-semibold text-[#142220] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <span className="truncate">{review.productLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#2B5B51] shrink-0" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Toggle All Reviews */}
        {filter === 'all' && filtered.length > 3 && (
          <div className="mt-8 sm:mt-10 text-center">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-[#142220]/25 bg-[#FAFAF8] text-[#142220] text-sm font-semibold hover:bg-[#E6EAE4] transition-colors cursor-pointer"
            >
              <span>
                {showAll
                  ? 'Show Fewer Reviews'
                  : `View All ${filtered.length} Customer Reviews`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
