import { useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  DimensionsGroup,
  MaterialGroup,
  PageRoute,
  Product,
  ProductCategory,
} from '../types/store';
import { CATEGORY_DIRECTORY } from '../data/catalog';
import { ProductCard } from './ProductCard';
import { PlaypenCollectionsView } from './PlaypenCollectionsView';

interface CategoryViewsProps {
  route: PageRoute;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onQuickAdd: (product: Product, size: string, color: string) => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onNavigate: (route: PageRoute) => void;
}

const COLLECTION_ROUTES: ProductCategory[] = [
  'wooden',
  'foldable',
  'mesh',
  'large',
  'modular',
  'travel',
  'premium',
  'signature',
];

export function CategoryViews({
  route,
  products,
  onSelectProduct,
  onQuickView,
  onQuickAdd,
  wishlistIds,
  onToggleWishlist,
  onNavigate,
}: CategoryViewsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedDimensions, setSelectedDimensions] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [curationTab, setCurationTab] = useState<'all' | 'featured' | 'new' | 'bestseller'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [localSearch, setLocalSearch] = useState('');
  const [showFilters, setShowFilters] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  const uniqueColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      p.colors.forEach((c) => {
        if (!map.has(c.name)) map.set(c.name, c.hex);
      });
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const materialOptions: MaterialGroup[] = [
    'Solid Beechwood',
    'Breathable Mesh',
    'Architectural HDPE',
    'Anodized Aluminum & Linen',
  ];

  const dimensionOptions: DimensionsGroup[] = [
    'Compact',
    'Standard',
    'Large',
    'Extra Large',
  ];

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (selectedPriceRange === 'under-1500') {
      list = list.filter((p) => p.priceAed < 1500);
    } else if (selectedPriceRange === '1500-2600') {
      list = list.filter((p) => p.priceAed >= 1500 && p.priceAed <= 2600);
    } else if (selectedPriceRange === 'over-2600') {
      list = list.filter((p) => p.priceAed > 2600);
    }

    if (selectedColor !== 'all') {
      list = list.filter((p) => p.colors.some((c) => c.name === selectedColor));
    }

    if (selectedMaterial !== 'all') {
      list = list.filter((p) => p.materialGroup === selectedMaterial);
    }

    if (selectedDimensions !== 'all') {
      list = list.filter((p) => p.dimensionsGroup === selectedDimensions);
    }

    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }

    if (curationTab === 'featured') {
      list = list.filter((p) => p.isFeatured);
    } else if (curationTab === 'new') {
      list = list.filter((p) => p.isNewArrival);
    } else if (curationTab === 'bestseller') {
      list = list.filter((p) => p.isBestSeller);
    }

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.dimensions.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.priceAed - b.priceAed);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.priceAed - a.priceAed);
    }

    return list;
  }, [
    products,
    selectedCategory,
    selectedPriceRange,
    selectedColor,
    selectedMaterial,
    selectedDimensions,
    inStockOnly,
    curationTab,
    localSearch,
    sortBy,
  ]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSelectedColor('all');
    setSelectedMaterial('all');
    setSelectedDimensions('all');
    setInStockOnly(false);
    setCurationTab('all');
    setLocalSearch('');
    setSortBy('featured');
  };

  // Dedicated Animated Lookbook Route or Any of the 8 Playpen Collection Routes
  if (route === 'collections' || COLLECTION_ROUTES.includes(route as ProductCategory)) {
    const activeCollection =
      route === 'collections' ? undefined : (route as ProductCategory);
    const matchingCollectionProducts = activeCollection
      ? products.filter((p) => p.category === activeCollection)
      : products;

    return (
      <div>
        <PlaypenCollectionsView
          products={products}
          initialCollection={activeCollection}
          onSelectProduct={onSelectProduct}
          onNavigate={onNavigate}
        />

        {activeCollection && matchingCollectionProducts.length > 0 && (
          <section className="py-16 px-5 sm:px-8 lg:px-12 bg-[#FAFAF8]">
            <div className="max-w-[1440px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
                    In This Collection
                  </p>
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#142220] mt-1">
                    {CATEGORY_DIRECTORY.find((c) => c.route === activeCollection)?.label ||
                      'Playpen Collection'}
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate('shop')}
                  className="text-sm font-semibold text-[#142220] hover:text-[#2B5B51] hover:underline cursor-pointer"
                >
                  View All Playpens →
                </button>
              </div>
              <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {matchingCollectionProducts.map((p) => (
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
            </div>
          </section>
        )}
      </div>
    );
  }

  // Dedicated SHOP PLAYPENS Page
  return (
    <div className="pt-20 lg:pt-28 pb-16 sm:pb-20 min-h-screen bg-[#FAFAF8]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Page Header */}
        <div className="pb-6 sm:pb-8 border-b border-[#142220]/10 flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2B5B51]">
              PLAYPEN Store · UAE (AED)
            </p>
            <h1 className="font-serif font-bold text-3xl sm:text-[42px] text-[#142220] mt-1.5">
              Shop Baby Playpens
            </h1>
            <p className="text-[15px] text-[#3C4B48] mt-2 max-w-2xl leading-relaxed">
              Browse all wooden, foldable, mesh, large, modular, and travel playpens. Filter by size,
              material, or price to find the right fit for your home.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[180px] sm:w-64">
              <Search className="w-4 h-4 text-[#4A5B57] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search playpens..."
                className="w-full pl-10 pr-4 min-h-[44px] py-2.5 rounded-full bg-white border border-[#142220]/15 text-base sm:text-sm text-[#142220] focus:outline-none focus:border-[#142220]"
              />
            </div>

            <button
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-2 px-4 min-h-[44px] py-2.5 rounded-full border border-[#142220]/20 text-xs sm:text-sm font-semibold text-[#142220] hover:bg-[#E6EAE4] cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          </div>
        </div>

        {/* Curation Quick Tabs + Sort */}
        <div className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-b border-[#142220]/8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
            {(
              [
                ['all', 'All Playpens'],
                ['featured', 'Featured'],
                ['bestseller', 'Best Sellers'],
                ['new', 'New Arrivals'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCurationTab(key)}
                className={`whitespace-nowrap px-4 min-h-[40px] py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
                  curationTab === key
                    ? 'bg-[#142220] text-[#FAFAF8]'
                    : 'bg-[#E6EAE4]/70 text-[#1F3532] hover:bg-[#E6EAE4]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs sm:text-sm text-[#3C4B48]">
            <span className="tabular-nums font-medium">{filteredProducts.length} playpens shown</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
              }
              aria-label="Sort playpens"
              className="bg-white border border-[#142220]/15 rounded-full px-3.5 min-h-[44px] py-2 text-base sm:text-xs font-medium text-[#142220] focus:outline-none"
            >
              <option value="featured">Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="my-5 sm:my-6 p-4 sm:p-6 rounded-2xl bg-[#E6EAE4]/55 border border-[#142220]/10 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#142220]">
                <Filter className="w-4 h-4 text-[#2B5B51]" />
                Filter Playpens
              </span>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A5B57] hover:text-[#142220] min-h-[36px] px-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {/* Category (8 Collections) */}
              <div>
                <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#142220]/15 px-3 min-h-[44px] py-2.5 text-base sm:text-xs font-medium text-[#142220]"
                >
                  <option value="all">All Categories</option>
                  {CATEGORY_DIRECTORY.map((c) => (
                    <option key={c.route} value={c.route}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                  Price (AED)
                </label>
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#142220]/15 px-3 min-h-[44px] py-2.5 text-base sm:text-xs font-medium text-[#142220]"
                >
                  <option value="all">Any Price</option>
                  <option value="under-1500">Under AED 1,500</option>
                  <option value="1500-2600">AED 1,500 – AED 2,600</option>
                  <option value="over-2600">Above AED 2,600</option>
                </select>
              </div>

              {/* Material */}
              <div>
                <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                  Material
                </label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#142220]/15 px-3 min-h-[44px] py-2.5 text-base sm:text-xs font-medium text-[#142220]"
                >
                  <option value="all">All Materials</option>
                  {materialOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                  Size
                </label>
                <select
                  value={selectedDimensions}
                  onChange={(e) => setSelectedDimensions(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#142220]/15 px-3 min-h-[44px] py-2.5 text-base sm:text-xs font-medium text-[#142220]"
                >
                  <option value="all">All Sizes</option>
                  {dimensionOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color + Availability */}
              <div>
                <label className="block text-xs font-semibold text-[#142220] mb-1.5">
                  Color / Finish
                </label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#142220]/15 px-3 min-h-[44px] py-2.5 text-base sm:text-xs font-medium text-[#142220]"
                >
                  <option value="all">All Colors</option>
                  {uniqueColors.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2.5 min-h-[40px] text-xs sm:text-sm font-medium text-[#142220] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-[#142220]/30 accent-[#142220]"
                />
                Show in-stock items only
              </label>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 sm:py-20 text-center space-y-4">
            <p className="font-serif font-bold text-2xl text-[#142220]">
              No playpens match these filters
            </p>
            <p className="text-sm text-[#4A5B57]">
              Try clearing a filter to see all available wooden, foldable, mesh, and travel playpens.
            </p>
            <button
              onClick={resetFilters}
              className="min-h-[48px] px-7 py-3 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-7 pt-4">
            {filteredProducts.map((p) => (
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
        )}
      </div>
    </div>
  );
}
