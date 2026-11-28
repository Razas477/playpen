import { MessageCircle } from 'lucide-react';

export const DEFAULT_WHATSAPP_PHONE = '+92 3346275976';

export function buildWhatsAppHelpUrl(
  phone?: string,
  productName?: string,
  customMessage?: string,
): string {
  const normalizedPhone =
    !phone || phone.trim() === '+971 4 555 0192' ? DEFAULT_WHATSAPP_PHONE : phone;
  const digits = normalizedPhone.replace(/\D/g, '') || '923346275976';
  const text =
    customMessage?.trim() ||
    (productName
      ? `Hello PLAYPEN UAE team, I need help with "${productName}".`
      : 'Hello PLAYPEN UAE team, I need help with a playpen or my order.');

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

interface WhatsAppHelpButtonProps {
  phone?: string;
  productName?: string;
  hasMobileBottomBar?: boolean;
}

export function WhatsAppHelpButton({
  phone,
  productName,
  hasMobileBottomBar = false,
}: WhatsAppHelpButtonProps) {
  const href = buildWhatsAppHelpUrl(phone, productName);
  const displayPhone = phone?.trim() || DEFAULT_WHATSAPP_PHONE;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with PLAYPEN UAE support on WhatsApp (${displayPhone})`}
      title={`WhatsApp Help · ${displayPhone}`}
      className={`fixed right-4 sm:right-6 z-30 inline-flex items-center gap-2.5 rounded-full bg-[#142220] text-[#FAFAF8] border border-[#FAFAF8]/15 shadow-[0_12px_30px_rgba(20,34,32,0.22)] hover:bg-[#2B5B51] active:scale-[0.98] transition-all px-3.5 py-2.5 sm:px-4 sm:py-3 ${
        hasMobileBottomBar ? 'bottom-20 lg:bottom-6' : 'bottom-5 sm:bottom-6'
      }`}
    >
      <span className="w-7 h-7 rounded-full bg-[#25D366] text-[#142220] flex items-center justify-center shrink-0">
        <MessageCircle className="w-4 h-4 fill-current" />
      </span>
      <span className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap">
        <span className="sm:hidden">Help</span>
        <span className="hidden sm:inline">WhatsApp Help</span>
      </span>
    </a>
  );
}
