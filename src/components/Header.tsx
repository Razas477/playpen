import { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Package,
  MapPin,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { formatAed } from '../data/catalog';
import { PageRoute, Product } from '../types/store';

interface HeaderProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  user: User | null;
  isAdmin: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Product[];
  onSelectProduct: (product: Product) => void;
}

export function Header({
  currentRoute,
  onNavigate,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenSearch,
  user,
  isAdmin,
  onOpenAuth,
  onLogout,
  isSearchOpen,
  onCloseSearch,
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectProduct,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { label: string; route: PageRoute }[] = [
    { label: 'Home', route: 'home' },
    { label: 'Collections', route: 'collections' },
    { label: 'Shop Now', route: 'shop' },
    { label: 'About', route: 'about' },
    { label: 'Contact Us', route: 'contact' },
  ];

  const mobileMenuLinks: Array<{
    label: string;
    route: PageRoute;
    sublabel?: string;
  }> = [
    { label: 'Home', route: 'home' },
    { label: 'Shop Now', route: 'shop', sublabel: 'All Playpens, Mats & Balls' },
    { label: 'Mesh Playpens', route: 'mesh', sublabel: 'Breathable 360° Mesh Sides' },
    { label: 'Gate & Activity Playpens', route: 'large', sublabel: 'Sturdy HDPE Panels & Hoop' },
    { label: 'Foldable Play Mats', route: 'foldable', sublabel: 'Waterproof XPE Foam Mats' },
    { label: 'Ocean Ball Sets', route: 'balls', sublabel: 'Soft 5.5cm BPA-Free Balls' },
    { label: 'About Us', route: 'about' },
    { label: 'Contact Us', route: 'contact', sublabel: 'Dubai & Abu Dhabi Support' },
    { label: 'My Account', route: 'account', sublabel: user ? user.email || 'Account & Orders' : 'Orders & Tracking' },
  ];

  const isCollectionRoute = (
    [
      'collections',
      'mesh',
      'large',
      'foldable',
      'balls',
    ] as PageRoute[]
  ).includes(currentRoute);

  const go = (route: PageRoute) => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    onNavigate(route);
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
          scrolled || currentRoute !== 'home'
            ? 'bg-[#FAFAF8]/92 backdrop-blur-md border-b border-[#142220]/10 shadow-[0_6px_30px_rgba(20,34,32,0.05)]'
            : 'bg-[#FAFAF8]/75 lg:bg-gradient-to-b lg:from-[#FAFAF8]/90 lg:via-[#FAFAF8]/60 lg:to-transparent backdrop-blur-sm lg:backdrop-blur-none border-b border-[#142220]/5 lg:border-b-0'
        }`}
      >
        {/* Mobile Compact Sticky Header (< lg) */}
        <div className="flex lg:hidden items-center justify-between px-4 h-14">
          <button
            type="button"
            onClick={() => go('home')}
            className="text-left py-1.5 pr-2 cursor-pointer focus:outline-none"
            aria-label="PLAYPEN Home"
          >
            <span className="font-serif text-[21px] font-bold tracking-[0.16em] uppercase text-[#142220] leading-none block">
              PLAYPEN
            </span>
          </button>

          <div className="flex items-center gap-0.5 -mr-1.5">
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search playpens"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#142220] active:bg-[#142220]/10 transition-colors cursor-pointer"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Open shopping bag (${cartCount} items)`}
              className="min-w-[44px] min-h-[44px] px-2 flex items-center justify-center gap-1 rounded-full text-[#142220] active:bg-[#142220]/10 transition-colors cursor-pointer relative"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              <span className="text-[11px] font-semibold tracking-tight tabular-nums">
                ({cartCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#142220] active:bg-[#142220]/10 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop 3-Zone Editorial Header (lg+) — Preserved Intact */}
        <div className="hidden lg:flex max-w-[1440px] mx-auto px-8 lg:px-12 h-20 items-center justify-between gap-4">
          {/* Left Navigation (Desktop) */}
          <nav className="flex items-center gap-7" aria-label="Primary">
            {navItems.map((item) => {
              const isActive =
                currentRoute === item.route ||
                (item.route === 'collections' && isCollectionRoute);
              return (
                <button
                  key={item.route}
                  onClick={() => go(item.route)}
                  className={`text-[13.5px] tracking-[0.03em] transition-colors cursor-pointer py-1 border-b-2 ${
                    isActive
                      ? 'text-[#142220] border-[#2B5B51] font-semibold'
                      : 'text-[#3C4B48] border-transparent font-medium hover:text-[#142220]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Center Brand Wordmark */}
          <button
            onClick={() => go('home')}
            className="text-center group cursor-pointer focus:outline-none"
            aria-label="PLAYPEN Home"
          >
            <span className="font-serif text-[27px] font-bold tracking-[0.18em] uppercase text-[#142220] leading-none block">
              PLAYPEN
            </span>
            <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#4A5B57] block mt-1">
              United Arab Emirates
            </span>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <button
                onClick={() => go('admin')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.12em] font-medium transition-colors cursor-pointer ${
                  currentRoute === 'admin'
                    ? 'bg-[#142220] text-[#FAFAF8]'
                    : 'bg-[#142220]/10 text-[#142220] hover:bg-[#142220] hover:text-[#FAFAF8]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
            )}

            <button
              onClick={onOpenSearch}
              aria-label="Search playpens"
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#142220] hover:bg-[#142220]/5 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => {
                  if (!user) {
                    onOpenAuth();
                  } else {
                    setAccountMenuOpen((prev) => !prev);
                  }
                }}
                aria-label={user ? 'Open account menu' : 'Sign in with Google'}
                className="w-10 h-10 flex items-center justify-center rounded-full text-[#142220] hover:bg-[#142220]/5 transition-colors cursor-pointer relative"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Customer'}
                    className="w-7 h-7 rounded-full object-cover border border-[#142220]/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
                {wishlistCount > 0 && !user && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5C6D69]" />
                )}
              </button>

              {accountMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FAFAF8] border border-[#142220]/12 shadow-[0_20px_50px_rgba(20,34,32,0.14)] p-2 z-50">
                  <div className="px-3 py-2.5 border-b border-[#142220]/10 mb-1">
                    <p className="text-sm font-semibold text-[#142220] truncate">
                      {user.displayName || 'PLAYPEN Customer'}
                    </p>
                    <p className="text-xs text-[#4A5B57] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => go('account')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#142220] hover:bg-[#E6EAE4] transition-colors text-left cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-[#4A5B57]" />
                    My Account
                  </button>
                  <button
                    onClick={() => go('account')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#142220] hover:bg-[#E6EAE4] transition-colors text-left cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-[#4A5B57]" />
                    My Orders &amp; Tracking
                  </button>
                  <button
                    onClick={() => go('account')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#142220] hover:bg-[#E6EAE4] transition-colors text-left cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#4A5B57]" />
                    Saved Addresses
                  </button>
                  <button
                    onClick={() => go('account')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-[#142220] hover:bg-[#E6EAE4] transition-colors text-left cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-[#4A5B57]" />
                      Saved Playpens
                    </span>
                    <span className="text-xs font-semibold text-[#4A5B57]">{wishlistCount}</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => go('admin')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#142220] bg-[#E6EAE4]/70 hover:bg-[#E6EAE4] transition-colors text-left cursor-pointer mt-1"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#142220]" />
                      Admin Dashboard
                    </button>
                  )}
                  <div className="border-t border-[#142220]/10 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#873029] hover:bg-[#873029]/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Bag Trigger */}
            <button
              onClick={onOpenCart}
              aria-label="Open shopping cart"
              className="inline-flex items-center gap-2 pl-2.5 pr-3 h-10 rounded-full text-[#142220] hover:bg-[#142220]/5 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-semibold tabular-nums">
                ({cartCount})
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-50 lg:hidden bg-[#FAFAF8] flex flex-col"
        >
          {/* Overlay Sticky Top Bar */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-[#142220]/10 shrink-0">
            <div>
              <span className="font-serif text-[21px] font-bold tracking-[0.16em] uppercase text-[#142220] leading-none block">
                PLAYPEN
              </span>
              <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#4A5B57] block mt-0.5">
                United Arab Emirates
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="min-w-[44px] min-h-[44px] -mr-1.5 rounded-full flex items-center justify-center text-[#142220] hover:bg-[#142220]/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Full-Screen Link List */}
          <nav
            aria-label="Mobile Primary"
            className="flex-1 overflow-y-auto px-5 pt-2 pb-6 divide-y divide-[#142220]/10"
          >
            {mobileMenuLinks.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => {
                    if (item.route === 'account' && !user) {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    } else {
                      go(item.route);
                    }
                  }}
                  className="w-full min-h-[52px] py-3 flex items-center justify-between gap-4 text-left cursor-pointer group"
                >
                  <div className="min-w-0">
                    <span
                      className={`font-serif text-[20px] font-semibold leading-tight block transition-colors ${
                        isActive ? 'text-[#2B5B51] underline underline-offset-4' : 'text-[#142220]'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="text-xs text-[#4A5B57] block mt-0.5 truncate">
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[#4A5B57] shrink-0">
                    →
                  </span>
                </button>
              );
            })}

            {/* Additional Collection Editions */}
            <div className="py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4A5B57] mb-3">
                More Collections
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['mesh', 'Mesh Playpens'],
                    ['large', 'Gate & Activity Playpens'],
                    ['foldable', 'Foldable Play Mats'],
                    ['balls', 'Ocean Ball Sets'],
                    ['collections', 'Lookbook'],
                  ] as Array<[PageRoute, string]>
                ).map(([route, label]) => (
                  <button
                    key={route}
                    type="button"
                    onClick={() => go(route)}
                    className="min-h-[40px] px-4 py-2 rounded-full bg-[#E6EAE4] text-xs font-semibold text-[#142220] active:bg-[#D7DDD5] cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Sticky Bottom Member / Admin Bar */}
          <div className="px-5 py-4 pb-safe border-t border-[#142220]/10 bg-[#F1F3EF] space-y-2.5 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => go('admin')}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full border border-[#142220]/25 bg-[#FAFAF8] text-[#142220] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => go('account')}
                  className="flex-1 min-h-[48px] py-3 px-4 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold cursor-pointer"
                >
                  My Orders &amp; Tracking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="min-h-[48px] px-4 rounded-full border border-[#142220]/20 text-xs font-semibold text-[#873029] cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full min-h-[48px] py-3 px-4 rounded-full bg-[#142220] text-[#FAFAF8] text-sm font-semibold cursor-pointer"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-[#142220]/45 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 sm:pt-24">
          <div className="bg-[#FAFAF8] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#142220]/10 overflow-hidden mt-1 sm:mt-0">
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#142220]/10">
              <Search className="w-4 h-4 text-[#4A5B57] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search playpens, play mats, or ocean balls..."
                className="flex-1 bg-transparent text-base sm:text-sm text-[#142220] placeholder:text-[#4A5B57] focus:outline-none min-w-0"
              />
              <button
                type="button"
                onClick={onCloseSearch}
                aria-label="Close search"
                className="min-w-[44px] min-h-[44px] -mr-2 rounded-full flex items-center justify-center text-[#3C4B48] hover:bg-[#E6EAE4] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[68vh] sm:max-h-[60vh] overflow-y-auto p-3 sm:p-4 divide-y divide-[#142220]/8">
              {searchResults.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#4A5B57]">
                  No products match “{searchQuery}”. Try searching “Mesh”, “Mat”, “Gate”, or “Balls”.
                </p>
              ) : (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProduct(p);
                      onCloseSearch();
                    }}
                    className="w-full min-h-[68px] flex items-center gap-3.5 sm:gap-4 py-3 px-2 hover:bg-[#E6EAE4]/60 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-16 h-12 rounded-lg object-cover bg-[#E6EAE4] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base font-semibold text-[#142220] truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-[#4A5B57] truncate">
                        {p.categoryLabel} · {p.dimensions}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#142220] tabular-nums whitespace-nowrap">
                      {p.priceRangeMaxAed
                        ? `${formatAed(p.priceAed)} – ${formatAed(p.priceRangeMaxAed)}`
                        : formatAed(p.priceAed)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
