import { ArrowRight, Compass, X } from 'lucide-react';
import { PageRoute, CategoryDirectoryItem } from '../types/store';
import { ResilientImage } from './ResilientImage';

interface FloatingCategoryPanelProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  categories: CategoryDirectoryItem[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function FloatingCategoryPanel({
  currentRoute,
  onNavigate,
  categories,
  isOpen,
  onToggleOpen,
}: FloatingCategoryPanelProps) {
  return (
    <div className="fixed bottom-5 left-5 z-30 hidden lg:block">
      {isOpen && (
        <div className="mb-3 w-80 max-h-[70vh] overflow-y-auto rounded-2xl bg-[#FAFAF8]/96 backdrop-blur-md border border-[#142220]/12 shadow-[0_24px_60px_rgba(20,34,32,0.18)] p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#142220]/10 mb-3">
            <div>
              <p className="text-xs font-semibold text-[#2B5B51]">
                PLAYPEN Categories
              </p>
              <p className="font-serif font-bold text-lg text-[#142220]">Browse Collections</p>
            </div>
            <button
              onClick={onToggleOpen}
              aria-label="Close collection directory"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#3C4B48] hover:bg-[#E6EAE4] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {categories.map((cat) => {
              const active = currentRoute === cat.route;
              return (
                <button
                  key={cat.route}
                  onClick={() => {
                    onNavigate(cat.route);
                    onToggleOpen();
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left cursor-pointer ${
                    active
                      ? 'bg-[#142220] text-[#FAFAF8]'
                      : 'hover:bg-[#E6EAE4] text-[#142220]'
                  }`}
                >
                  <div className="w-11 h-9 rounded-lg overflow-hidden bg-[#DCE2DA] shrink-0">
                    <ResilientImage
                      src={cat.image}
                      alt={cat.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{cat.label}</p>
                    <p
                      className={`text-[11px] truncate ${
                        active ? 'text-[#D5DDD8]' : 'text-[#4A5B57]'
                      }`}
                    >
                      {cat.ageOrNote}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={onToggleOpen}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#142220] text-[#FAFAF8] text-xs font-semibold shadow-[0_14px_34px_rgba(20,34,32,0.28)] hover:bg-[#2B5B51] transition-all cursor-pointer"
      >
        <Compass className="w-4 h-4" />
        Browse Collections
      </button>
    </div>
  );
}
