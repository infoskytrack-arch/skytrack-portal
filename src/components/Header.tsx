import {
  BookOpen,
  FileDown,
  Globe,
  Home,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  TrainFront,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { AGENCY_CONTACT, type LanguageCode } from '../types';

export type NavTab = 'home' | 'track' | 'guide' | 'admin';

interface HeaderProps {
  activeNav: NavTab;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onSelectNav: (tab: NavTab) => void;
}

const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'hi', label: 'हिन्दी' },
];

export function Header({
  activeNav,
  language,
  onLanguageChange,
  onSelectNav,
}: HeaderProps) {
  const t = TRANSLATIONS[language];
  const whatsappDirectUrl = `https://wa.me/${AGENCY_CONTACT.primaryPhoneRaw}?text=${encodeURIComponent(
    'Hello SKY TRACK, I would like to inquire about a Train / Flight / Bus ticket booking.'
  )}`;

  return (
    <div className="no-print w-full bg-white">
      {/* Compact Top Agency Contact & Language Strip (scrolls away naturally on mobile) */}
      <div className="bg-[#182D59] text-white/95 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold tracking-wide text-white truncate">
              {AGENCY_CONTACT.brandName} — {AGENCY_CONTACT.tagline}
            </span>
            <span className="hidden md:inline text-white/35" aria-hidden="true">
              |
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-white/90 whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-[#FB792B] shrink-0" />
              <span>{AGENCY_CONTACT.locationShort}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <a
              href={`tel:+${AGENCY_CONTACT.primaryPhoneRaw}`}
              className="hidden sm:inline-flex items-center gap-1 hover:text-[#FB792B] transition-colors font-mono tabular-nums whitespace-nowrap"
            >
              <Phone className="w-3 h-3 text-[#FB792B] shrink-0" />
              <span>{AGENCY_CONTACT.primaryPhoneDisplay}</span>
            </a>
            <a
              href={`tel:+${AGENCY_CONTACT.secondaryPhoneRaw}`}
              className="hidden lg:inline-flex items-center gap-1 hover:text-[#FB792B] transition-colors font-mono tabular-nums whitespace-nowrap"
            >
              <span>/ {AGENCY_CONTACT.secondaryPhoneDisplay}</span>
            </a>
            <a
              href={`mailto:${AGENCY_CONTACT.email}`}
              className="hidden xl:inline-flex items-center gap-1 hover:text-[#FB792B] transition-colors whitespace-nowrap"
            >
              <Mail className="w-3 h-3 text-[#FB792B] shrink-0" />
              <span>{AGENCY_CONTACT.email}</span>
            </a>

            {/* Multi-Language Switcher (EN / বাংলা / हिन्दी) */}
            <div
              role="group"
              aria-label="Select Language"
              className="inline-flex items-center gap-0.5 bg-white/10 rounded px-1 py-0.5"
            >
              <Globe className="w-3 h-3 text-[#FB792B] shrink-0 mx-0.5" />
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => onLanguageChange(opt.code)}
                  className={`px-1.5 py-0.5 text-[11px] font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    language === opt.code
                      ? 'bg-white text-[#182D59]'
                      : 'text-white/85 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Sticky Top App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[52px] sm:h-15 flex items-center justify-between gap-3 sm:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectNav('home')}
            className="flex items-center gap-2 text-left whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#213D77] rounded-md cursor-pointer"
          >
            <span className="w-8 h-8 rounded-md bg-[#213D77] text-white flex items-center justify-center shrink-0">
              <TrainFront className="w-4 h-4" />
            </span>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#213D77]">
              SKY TRACK
            </span>
          </button>

          {/* Zone 2: Desktop Single-Line Navigation Tabs */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-5 lg:gap-7"
          >
            {(
              [
                { id: 'home', label: t.navHomeSearch },
                { id: 'track', label: t.navTrackPdf },
                { id: 'guide', label: t.navGuidePolicy },
                { id: 'admin', label: t.navAdmin },
              ] as Array<{ id: NavTab; label: string }>
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectNav(item.id)}
                className={`h-15 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  activeNav === item.id
                    ? 'border-[#FB792B] text-[#213D77]'
                    : 'border-transparent text-slate-600 hover:text-[#213D77]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Quick Call & WhatsApp Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:+${AGENCY_CONTACT.primaryPhoneRaw}`}
              aria-label={`Call SKY TRACK at ${AGENCY_CONTACT.primaryPhoneDisplay}`}
              title={`Call ${AGENCY_CONTACT.primaryPhoneDisplay}`}
              className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 text-xs font-bold text-[#213D77] bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-[#FB792B] shrink-0" />
              <span>Call</span>
            </a>

            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with SKY TRACK on WhatsApp"
              className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Compact Notice Ticker (scrolls naturally, never blocks mobile viewport) */}
      <div
        role="region"
        aria-label="Booking Policy Notice"
        className="ticker-container bg-[#213D77] text-white overflow-hidden py-1.5 border-b border-[#182D59]"
      >
        <div className="ticker-track items-center text-[11px] sm:text-xs font-medium tracking-wide">
          <span className="px-8 whitespace-nowrap">NOTICE: {t.tickerNotice}</span>
          <span className="text-[#FB792B]" aria-hidden="true">
            •
          </span>
          <span className="px-8 whitespace-nowrap">{t.tickerCallLine}</span>
          <span className="ticker-duplicate text-[#FB792B]" aria-hidden="true">
            •
          </span>
          <span className="ticker-duplicate px-8 whitespace-nowrap">
            NOTICE: {t.tickerNotice}
          </span>
          <span className="ticker-duplicate text-[#FB792B]" aria-hidden="true">
            •
          </span>
          <span className="ticker-duplicate px-8 whitespace-nowrap">{t.tickerCallLine}</span>
        </div>
      </div>
    </div>
  );
}

interface MobileBottomNavProps {
  activeNav: NavTab;
  language: LanguageCode;
  onSelectNav: (tab: NavTab) => void;
}

export function MobileBottomNav({
  activeNav,
  language,
  onSelectNav,
}: MobileBottomNavProps) {
  const t = TRANSLATIONS[language];

  const items: Array<{ id: NavTab; label: string; icon: typeof Home }> = [
    { id: 'home', label: t.navHomeSearch, icon: Home },
    { id: 'track', label: t.navTrackPdf, icon: FileDown },
    { id: 'guide', label: t.navGuidePolicy, icon: BookOpen },
    { id: 'admin', label: t.navAdmin, icon: Lock },
  ];

  return (
    <nav
      aria-label="Mobile Quick Navigation"
      className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_10px_rgba(15,23,42,0.06)]"
    >
      <div className="grid grid-cols-4 h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNav(item.id)}
              className={`flex flex-col items-center justify-center px-1 min-h-[44px] transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#213D77] bg-[#F4F7FC]/80'
                  : 'text-slate-500 hover:text-[#213D77]'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${
                  isActive ? 'text-[#FB792B]' : 'text-slate-500'
                }`}
              />
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
