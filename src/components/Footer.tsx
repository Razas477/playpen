import { ShieldCheck } from 'lucide-react';
import { PageRoute } from '../types/store';

interface FooterProps {
  onNavigate: (route: PageRoute) => void;
  onOpenAuth: () => void;
  isSignedIn: boolean;
  isAdmin: boolean;
}

export function Footer({
  onNavigate,
  onOpenAuth,
  isSignedIn,
  isAdmin,
}: FooterProps) {
  return (
    <footer className="bg-[#142220] text-[#FAFAF8] border-t border-[#FAFAF8]/10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-12 sm:pt-16 pb-10 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-9 sm:gap-10 pb-12 sm:pb-14 border-b border-[#FAFAF8]/12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h2 className="font-serif font-bold text-3xl tracking-[0.18em] uppercase text-[#FAFAF8]">
                PLAYPEN
              </h2>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#C6D2CD] mt-1.5">
                Safe Baby Playpens · UAE
              </p>
            </div>
            <p className="text-sm text-[#DCE2DA] leading-relaxed max-w-sm">
              Safe, stylish baby playpens made from solid wood, soft fabric, and breathable mesh for
              modern UAE homes.
            </p>
            <div className="pt-2 text-xs text-[#B4C2BC] space-y-1">
              <p>Showroom: Dubai Design District (d3), Building 7</p>
              <p>Fast UAE Delivery · Cash on Delivery Available</p>
            </div>
          </div>

          {/* 8 Playpen Collections */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C6D2CD]">
              Collections
            </h3>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-y-1 sm:gap-y-1.5 gap-x-6 text-sm text-[#DCE2DA]">
              {(
                [
                  ['wooden', 'Wooden Playpens'],
                  ['foldable', 'Foldable Playpens'],
                  ['mesh', 'Mesh Playpens'],
                  ['large', 'Large Playpens'],
                  ['modular', 'Modular Playpens'],
                  ['travel', 'Travel Playpens'],
                  ['premium', 'Premium Playpens'],
                  ['signature', 'Signature Collection'],
                ] as Array<[PageRoute, string]>
              ).map(([route, label]) => (
                <button
                  key={route}
                  onClick={() => onNavigate(route)}
                  className="text-left py-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand & Info */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C6D2CD]">
              Company
            </h3>
            <ul className="space-y-1 text-sm text-[#DCE2DA]">
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="py-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  Shop Now
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('collections')}
                  className="py-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  Collections
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="py-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('journal')}
                  className="py-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  Parent Guides
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="py-1.5 hover:text-white transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Account */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C6D2CD]">
              Customer Care
            </h3>
            <ul className="space-y-1 text-sm text-[#DCE2DA]">
              <li>
                <button
                  onClick={() => (isSignedIn ? onNavigate('account') : onOpenAuth())}
                  className="py-1.5 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {isSignedIn ? 'My Account' : 'Sign In'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => (isSignedIn ? onNavigate('account') : onOpenAuth())}
                  className="py-1.5 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Track Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => (isSignedIn ? onNavigate('account') : onOpenAuth())}
                  className="py-1.5 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Saved Addresses
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="py-1.5 inline-flex items-center gap-1.5 text-[#D4B483] hover:text-white transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin Dashboard
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B4C2BC]">
          <p>© {new Date().getFullYear()} PLAYPEN UAE. All rights reserved.</p>
          <p>Certified Safe (EN 12227 &amp; ASTM F406) · Prices in AED</p>
        </div>
      </div>
    </footer>
  );
}
