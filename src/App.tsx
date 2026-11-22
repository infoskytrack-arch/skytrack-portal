import { useState } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  Bus,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileDown,
  Mail,
  MessageCircle,
  Phone,
  Plane,
  Search,
  ShieldCheck,
  TrainFront,
} from 'lucide-react';
import { AdminPortalView } from './components/AdminPortalView';
import {
  BookingFormScreen,
  ConfirmationReceiptScreen,
  type BookingScreenContext,
} from './components/BookingRequestView';
import { Header, MobileBottomNav, type NavTab } from './components/Header';
import { PopularRoutesSection } from './components/PopularRoutesSection';
import { StationAutocomplete } from './components/StationAutocomplete';
import { TrackTicketView } from './components/TrackTicketView';
import { TrainResults } from './components/TrainResults';
import {
  BUS_CITIES,
  BUS_COACH_PREFERENCES,
  BUS_TIME_WINDOWS,
  FLIGHT_BAGGAGE_MEAL_OPTIONS,
  FLIGHT_CABIN_CLASSES,
  MAJOR_AIRPORTS,
} from './data/airportsAndCities';
import { findStationByCode, formatStationLabel } from './data/stations';
import { findTrainsForRoute } from './data/trains';
import { TRANSLATIONS } from './i18n/translations';
import {
  AGENCY_CONTACT,
  QUOTA_OPTIONS,
  TRAVEL_CLASSES,
  type BookingRequestRecord,
  type LanguageCode,
  type QuotaType,
  type ServiceType,
  type Station,
  type TrainSchedule,
  type TravelClassCode,
} from './types';
import {
  getFutureIsoDate,
  getTodayIsoDate,
  getTomorrowIsoDate,
} from './utils/bookingFormat';

type AppScreen =
  | 'home' // Step 1: Compact Search Screen
  | 'results' // Step 2: Dedicated Train Results Screen
  | 'booking' // Step 3: Dedicated Passenger & Payment Screen
  | 'confirmation' // Step 4: Dedicated Confirmation Receipt Screen
  | 'track' // Track & Download PDF Screen
  | 'guide' // How It Works, Trust Badges, Popular Routes & Policy Screen
  | 'admin'; // Admin Ticket Upload Portal

interface ActiveSearchState {
  from: Station;
  to: Station;
  journeyDate: string;
  travelClass: TravelClassCode;
  quota: QuotaType;
  trains: TrainSchedule[];
  isAdvanceOpeningPriority: boolean;
}

const QUICK_ROUTES: Array<{ label: string; from: string; to: string }> = [
  { label: 'HWH → CSMT', from: 'HWH', to: 'CSMT' },
  { label: 'HWH → JP', from: 'HWH', to: 'JP' },
  { label: 'HWH → ST', from: 'HWH', to: 'ST' },
  { label: 'HWH → ADI', from: 'HWH', to: 'ADI' },
];

function scrollToTopNow() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [serviceTab, setServiceTab] = useState<ServiceType>('train');
  const [heroImgErr, setHeroImgErr] = useState(false);

  const t = TRANSLATIONS[language];

  // Train Search Form State (Step 1)
  const [fromStation, setFromStation] = useState<Station | null>(
    () => findStationByCode('HWH') ?? null
  );
  const [toStation, setToStation] = useState<Station | null>(
    () => findStationByCode('CSMT') ?? null
  );
  const [journeyDate, setJourneyDate] = useState<string>(() => getTomorrowIsoDate());
  const [travelClass, setTravelClass] = useState<TravelClassCode>('ALL');
  const [quota, setQuota] = useState<QuotaType>('GENERAL');
  const [isAdvanceOpeningPriority, setIsAdvanceOpeningPriority] = useState(false);
  const [searchError, setSearchError] = useState('');

  const maxFutureDate120 = getFutureIsoDate(120);

  // Flight Request Form State (Step 1)
  const [flightFrom, setFlightFrom] = useState('Kolkata (CCU) — Netaji Subhas Chandra Bose Intl');
  const [flightTo, setFlightTo] = useState('Mumbai (BOM) — Chhatrapati Shivaji Maharaj Intl');
  const [flightDate, setFlightDate] = useState<string>(() => getTomorrowIsoDate());
  const [flightReturnDate, setFlightReturnDate] = useState('');
  const [flightClass, setFlightClass] = useState<string>(FLIGHT_CABIN_CLASSES[0]);
  const [flightPreference, setFlightPreference] = useState<string>(FLIGHT_BAGGAGE_MEAL_OPTIONS[0]);
  const [flightError, setFlightError] = useState('');

  // Bus Request Form State (Step 1)
  const [busFrom, setBusFrom] = useState('Mumbai');
  const [busTo, setBusTo] = useState('Surat');
  const [busDate, setBusDate] = useState<string>(() => getTomorrowIsoDate());
  const [busCoach, setBusCoach] = useState<string>(BUS_COACH_PREFERENCES[0]);
  const [busTimeWindow, setBusTimeWindow] = useState<string>(BUS_TIME_WINDOWS[3]);
  const [busError, setBusError] = useState('');

  // Step 2, 3, 4 & Track States
  const [searchResult, setSearchResult] = useState<ActiveSearchState | null>(null);
  const [bookingContext, setBookingContext] = useState<BookingScreenContext | null>(null);
  const [confirmedRecord, setConfirmedRecord] = useState<BookingRequestRecord | null>(null);
  const [trackPrefillMobile, setTrackPrefillMobile] = useState('');

  const isTatkalQuota = quota === 'TATKAL' || quota === 'PREMIUM TATKAL';

  const activeNavTab: NavTab =
    screen === 'track'
      ? 'track'
      : screen === 'guide'
      ? 'guide'
      : screen === 'admin'
      ? 'admin'
      : 'home';

  function navigateToScreen(next: AppScreen) {
    setScreen(next);
    scrollToTopNow();
  }

  function handleSelectTopNav(tab: NavTab) {
    if (tab === 'home') {
      setScreen('home');
    } else if (tab === 'track') {
      setScreen('track');
    } else if (tab === 'guide') {
      setScreen('guide');
    } else if (tab === 'admin') {
      setScreen('admin');
    }
    scrollToTopNow();
  }

  function runTrainSearch(
    from: Station | null,
    to: Station | null,
    date: string,
    cls: TravelClassCode,
    q: QuotaType
  ) {
    setSearchError('');
    if (!from || !to) {
      setSearchError('Please select both "From" and "To" stations from the list.');
      return;
    }
    if (from.code === to.code) {
      setSearchError('Origin and destination stations cannot be the same.');
      return;
    }
    if (!date) {
      setSearchError('Please select a journey date.');
      return;
    }

    const trains = findTrainsForRoute(from, to, cls);
    setSearchResult({
      from,
      to,
      journeyDate: date,
      travelClass: cls,
      quota: q,
      trains,
      isAdvanceOpeningPriority,
    });
    setServiceTab('train');
    navigateToScreen('results');
  }

  function handleTrainSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    runTrainSearch(fromStation, toStation, journeyDate, travelClass, quota);
  }

  function handleFlightSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFlightError('');
    if (!flightFrom.trim() || !flightTo.trim()) {
      setFlightError('Please select both departure and destination airports.');
      return;
    }
    if (flightFrom.trim() === flightTo.trim()) {
      setFlightError('Departure and destination airports cannot be the same.');
      return;
    }
    if (!flightDate) {
      setFlightError('Please select a journey date.');
      return;
    }

    setBookingContext({
      serviceType: 'flight',
      trainNumber: 'FLIGHT',
      trainName: `Flight Request (${flightClass})`,
      fromLabel: flightFrom.trim(),
      toLabel: flightTo.trim(),
      defaultBoarding: flightFrom.trim(),
      journeyDate: flightDate,
      returnDate: flightReturnDate || undefined,
      travelClass: flightClass,
      quota: 'GENERAL',
      extraPreferences: flightPreference,
      isAdvanceOpeningPriority,
    });
    navigateToScreen('booking');
  }

  function handleBusSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusError('');
    if (!busFrom.trim() || !busTo.trim()) {
      setBusError('Please enter both origin and destination cities.');
      return;
    }
    if (busFrom.trim().toLowerCase() === busTo.trim().toLowerCase()) {
      setBusError('Origin and destination cities cannot be the same.');
      return;
    }
    if (!busDate) {
      setBusError('Please select a journey date.');
      return;
    }

    setBookingContext({
      serviceType: 'bus',
      trainNumber: 'BUS',
      trainName: `Bus Request (${busCoach})`,
      fromLabel: busFrom.trim(),
      toLabel: busTo.trim(),
      defaultBoarding: busFrom.trim(),
      journeyDate: busDate,
      travelClass: busCoach,
      quota: 'GENERAL',
      extraPreferences: `Departure Window: ${busTimeWindow}`,
      isAdvanceOpeningPriority,
    });
    navigateToScreen('booking');
  }

  function handleSwapStations() {
    setFromStation(toStation);
    setToStation(fromStation);
  }

  function handleSwapAirports() {
    setFlightFrom(flightTo);
    setFlightTo(flightFrom);
  }

  function handleSwapBusCities() {
    setBusFrom(busTo);
    setBusTo(busFrom);
  }

  function handleCorridorShortcut(fromCode: string, toCode: string) {
    const f = findStationByCode(fromCode) ?? null;
    const tStation = findStationByCode(toCode) ?? null;
    setFromStation(f);
    setToStation(tStation);
    runTrainSearch(f, tStation, journeyDate, travelClass, quota);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeNav={activeNavTab}
        language={language}
        onLanguageChange={setLanguage}
        onSelectNav={handleSelectTopNav}
      />

      <main className="flex-1 pb-16 md:pb-0">
        {/* ============================================================
            STEP 1: COMPACT HOME / SEARCH VIEW (Zero Endless Scrolling)
           ============================================================ */}
        {screen === 'home' && (
          <section className="relative overflow-hidden bg-[#213D77] min-h-[calc(100vh-140px)] flex items-center">
            {/* Background Train Photography with Contrast Scrim */}
            <div className="absolute inset-0">
              {!heroImgErr ? (
                <img
                  src="/src/assets/images/hero_indian_railways_express_1795296231782.jpg"
                  alt="Indian Railways Express train travelling through scenic Western Ghats"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgErr(true)}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#213D77] via-[#1C3569] to-[#122447]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#182D59]/92 via-[#213D77]/80 to-[#182D59]/62" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 lg:py-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
                {/* Left: Festival / 60-Day Advance Opening Toggle + Multi-Service Tabs + IRCTC-Style Search Card */}
                <div className="lg:col-span-7 flex flex-col">
                  {/* Festival / 60-Day Advance Opening Priority Banner / Toggle */}
                  <button
                    type="button"
                    aria-pressed={isAdvanceOpeningPriority}
                    onClick={() => {
                      const next = !isAdvanceOpeningPriority;
                      setIsAdvanceOpeningPriority(next);
                      // If turning ON and currently set to tomorrow, suggest 60 days ahead automatically for convenience
                      if (next && journeyDate === getTomorrowIsoDate()) {
                        setJourneyDate(getFutureIsoDate(60));
                      }
                    }}
                    className={`mb-2.5 w-full text-left px-3.5 py-2.5 rounded-md border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isAdvanceOpeningPriority
                        ? 'bg-amber-50 border-[#FB792B] text-[#182D59] shadow-sm'
                        : 'bg-white/10 hover:bg-white/15 border-white/25 text-white'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <CalendarClock
                        className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
                          isAdvanceOpeningPriority ? 'text-[#FB792B]' : 'text-[#FB792B]'
                        }`}
                      />
                      <div className="text-xs leading-snug">
                        <span className="font-bold">
                          Planning for Durga Puja, Chhath, Holi, or 60-Day Advance Opening?{' '}
                        </span>
                        <span
                          className={
                            isAdvanceOpeningPriority
                              ? 'font-extrabold text-[#FB792B]'
                              : 'text-amber-200 font-semibold'
                          }
                        >
                          Pre-Book Your Priority Request Now
                        </span>
                        {isAdvanceOpeningPriority && (
                          <div className="text-[11px] font-semibold text-[#213D77] mt-0.5">
                            [ADVANCE OPENING PRIORITY] Active · Choose any date up to 120 days ahead
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-extrabold whitespace-nowrap ${
                        isAdvanceOpeningPriority
                          ? 'bg-[#FB792B] text-white'
                          : 'bg-white text-[#213D77]'
                      }`}
                    >
                      {isAdvanceOpeningPriority ? 'PRIORITY ON' : 'ACTIVATE'}
                    </span>
                  </button>

                  {/* IRCTC-Style Multi-Service Tabs */}
                  <div
                    role="tablist"
                    aria-label="Travel Service Type"
                    className="grid grid-cols-3 gap-1.5 mb-1.5"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={serviceTab === 'train'}
                      onClick={() => setServiceTab('train')}
                      className={`min-h-[42px] px-2 sm:px-3 py-2 rounded-t-md text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                        serviceTab === 'train'
                          ? 'bg-white text-[#213D77] shadow-sm'
                          : 'bg-[#182D59]/85 text-white/90 hover:bg-[#182D59] border border-white/15'
                      }`}
                    >
                      <TrainFront
                        className={`w-4 h-4 shrink-0 ${
                          serviceTab === 'train' ? 'text-[#FB792B]' : 'text-white/80'
                        }`}
                      />
                      <span className="truncate">{t.tabTrain}</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={serviceTab === 'flight'}
                      onClick={() => setServiceTab('flight')}
                      className={`min-h-[42px] px-2 sm:px-3 py-2 rounded-t-md text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                        serviceTab === 'flight'
                          ? 'bg-white text-[#213D77] shadow-sm'
                          : 'bg-[#182D59]/85 text-white/90 hover:bg-[#182D59] border border-white/15'
                      }`}
                    >
                      <Plane
                        className={`w-4 h-4 shrink-0 ${
                          serviceTab === 'flight' ? 'text-[#FB792B]' : 'text-white/80'
                        }`}
                      />
                      <span className="truncate">{t.tabFlight}</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={serviceTab === 'bus'}
                      onClick={() => setServiceTab('bus')}
                      className={`min-h-[42px] px-2 sm:px-3 py-2 rounded-t-md text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                        serviceTab === 'bus'
                          ? 'bg-white text-[#213D77] shadow-sm'
                          : 'bg-[#182D59]/85 text-white/90 hover:bg-[#182D59] border border-white/15'
                      }`}
                    >
                      <Bus
                        className={`w-4 h-4 shrink-0 ${
                          serviceTab === 'bus' ? 'text-[#FB792B]' : 'text-white/80'
                        }`}
                      />
                      <span className="truncate">{t.tabBus}</span>
                    </button>
                  </div>

                  {/* Main Search Card Body */}
                  <div className="bg-white rounded-b-lg rounded-tr-lg shadow-xl border border-slate-200 overflow-hidden flex-1 flex flex-col justify-between">
                    {/* TAB 1: TRAIN TICKET REQUEST */}
                    {serviceTab === 'train' && (
                      <>
                        <div>
                          <div className="bg-[#213D77] text-white px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <TrainFront className="w-4 h-4 sm:w-5 sm:h-5 text-[#FB792B] shrink-0" />
                              <h1 className="text-base sm:text-lg font-extrabold tracking-wide">
                                {t.bookTrainTitle}
                              </h1>
                            </div>
                            <span className="text-[11px] sm:text-xs font-medium text-white/85 whitespace-nowrap">
                              {t.bookTrainSub}
                            </span>
                          </div>

                          <form
                            onSubmit={handleTrainSearchSubmit}
                            className="p-4 sm:p-5 space-y-4"
                          >
                            {/* From / Swap / To */}
                            <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 sm:gap-3 items-end">
                              <div className="sm:col-span-5">
                                <StationAutocomplete
                                  label={t.fromStation}
                                  placeholder="Type city, station name or code"
                                  selectedStation={fromStation}
                                  onSelect={setFromStation}
                                  excludeCode={toStation?.code}
                                />
                              </div>

                              <div className="sm:col-span-1 flex justify-center sm:pb-1">
                                <button
                                  type="button"
                                  onClick={handleSwapStations}
                                  aria-label="Swap From and To stations"
                                  title="Swap stations"
                                  className="w-9 h-9 rounded-full border border-slate-300 bg-slate-50 hover:bg-[#213D77] hover:text-white hover:border-[#213D77] text-[#213D77] flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <ArrowLeftRight className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="sm:col-span-5">
                                <StationAutocomplete
                                  label={t.toStation}
                                  placeholder="Type city, station name or code"
                                  selectedStation={toStation}
                                  onSelect={setToStation}
                                  excludeCode={fromStation?.code}
                                />
                              </div>
                            </div>

                            {/* Date, Class, Quota */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label
                                  htmlFor="journey-date"
                                  className="block text-xs font-semibold text-[#213D77] mb-1"
                                >
                                  {t.journeyDate}
                                </label>
                                <div className="relative">
                                  <Calendar className="w-4 h-4 text-[#213D77] absolute left-3 top-3 pointer-events-none" />
                                  <input
                                    id="journey-date"
                                    type="date"
                                    min={getTodayIsoDate()}
                                    max={maxFutureDate120}
                                    value={journeyDate}
                                    onChange={(e) => setJourneyDate(e.target.value)}
                                    className={`w-full h-10 sm:h-11 pl-9 pr-3 text-sm font-mono font-medium text-slate-900 bg-white border rounded-md focus:outline-none focus:border-[#213D77] ${
                                      isAdvanceOpeningPriority
                                        ? 'border-[#FB792B] ring-2 ring-[#FB792B]/20'
                                        : 'border-slate-300'
                                    }`}
                                  />
                                </div>
                              </div>

                              <div>
                                <label
                                  htmlFor="travel-class"
                                  className="block text-xs font-semibold text-[#213D77] mb-1"
                                >
                                  {t.allClasses}
                                </label>
                                <select
                                  id="travel-class"
                                  value={travelClass}
                                  onChange={(e) =>
                                    setTravelClass(e.target.value as TravelClassCode)
                                  }
                                  className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                                >
                                  <option value="ALL">{t.allClasses}</option>
                                  {TRAVEL_CLASSES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label
                                  htmlFor="travel-quota"
                                  className="block text-xs font-semibold text-[#213D77] mb-1"
                                >
                                  {t.quota}
                                </label>
                                <select
                                  id="travel-quota"
                                  value={quota}
                                  onChange={(e) => setQuota(e.target.value as QuotaType)}
                                  className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                                >
                                  {QUOTA_OPTIONS.map((q) => (
                                    <option key={q} value={q}>
                                      {q}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Tatkal & Premium Tatkal Timing Alert Banner */}
                            {isTatkalQuota && (
                              <div
                                role="status"
                                className="p-3 bg-amber-50 border border-amber-300 rounded-md space-y-1"
                              >
                                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950">
                                  <Clock className="w-4 h-4 text-[#FB792B] shrink-0" />
                                  <span>{t.tatkalAlertTitle}</span>
                                </div>
                                <ul className="space-y-0.5 text-[11px] sm:text-xs text-amber-950/90 leading-snug pl-5 list-disc">
                                  <li>{t.tatkalAcRule}</li>
                                  <li>{t.tatkalNonAcRule}</li>
                                </ul>
                              </div>
                            )}

                            {searchError && (
                              <div
                                role="alert"
                                className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-700"
                              >
                                {searchError}
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                              <button
                                type="submit"
                                className="h-12 px-7 bg-[#FB792B] hover:bg-[#E06319] text-white text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Search className="w-4 h-4" />
                                <span>{t.searchTrainsBtn}</span>
                              </button>

                              <div className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-[#213D77] shrink-0" />
                                <span>{t.zeroUpfrontNote}</span>
                              </div>
                            </div>
                          </form>
                        </div>

                        {/* Quick Popular Corridor Shortcuts */}
                        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-semibold text-slate-600 mr-1">
                            {t.quickSearch}
                          </span>
                          {QUICK_ROUTES.map((qr) => (
                            <button
                              key={qr.label}
                              type="button"
                              onClick={() => handleCorridorShortcut(qr.from, qr.to)}
                              className="px-2.5 py-1 font-mono font-semibold text-[#213D77] bg-white border border-slate-300 hover:border-[#213D77] hover:bg-[#213D77] hover:text-white rounded transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {qr.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* TAB 2: FLIGHT TICKET REQUEST */}
                    {serviceTab === 'flight' && (
                      <div>
                        <div className="bg-[#213D77] text-white px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-[#FB792B] shrink-0" />
                            <h1 className="text-base sm:text-lg font-extrabold tracking-wide">
                              {t.bookFlightTitle}
                            </h1>
                          </div>
                          <span className="text-[11px] sm:text-xs font-medium text-white/85 whitespace-nowrap">
                            {t.bookFlightSub}
                          </span>
                        </div>

                        <form onSubmit={handleFlightSubmit} className="p-4 sm:p-5 space-y-4">
                          <datalist id="skytrack-airports-list">
                            {MAJOR_AIRPORTS.map((ap) => (
                              <option
                                key={ap.code}
                                value={`${ap.city} (${ap.code}) — ${ap.airportName}`}
                              />
                            ))}
                          </datalist>

                          <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 sm:gap-3 items-end">
                            <div className="sm:col-span-5">
                              <label
                                htmlFor="flight-from"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.fromAirport}
                              </label>
                              <input
                                id="flight-from"
                                list="skytrack-airports-list"
                                type="text"
                                required
                                value={flightFrom}
                                onChange={(e) => setFlightFrom(e.target.value)}
                                placeholder="e.g., Kolkata (CCU) or Mumbai (BOM)"
                                className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-center sm:pb-1">
                              <button
                                type="button"
                                onClick={handleSwapAirports}
                                aria-label="Swap departure and destination airports"
                                className="w-9 h-9 rounded-full border border-slate-300 bg-slate-50 hover:bg-[#213D77] hover:text-white hover:border-[#213D77] text-[#213D77] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="sm:col-span-5">
                              <label
                                htmlFor="flight-to"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.toAirport}
                              </label>
                              <input
                                id="flight-to"
                                list="skytrack-airports-list"
                                type="text"
                                required
                                value={flightTo}
                                onChange={(e) => setFlightTo(e.target.value)}
                                placeholder="e.g., Mumbai (BOM) or Delhi (DEL)"
                                className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="flight-date"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.journeyDate}
                              </label>
                              <input
                                id="flight-date"
                                type="date"
                                required
                                min={getTodayIsoDate()}
                                max={maxFutureDate120}
                                value={flightDate}
                                onChange={(e) => setFlightDate(e.target.value)}
                                className="w-full h-10 sm:h-11 px-3 text-sm font-mono font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="flight-return-date"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.returnDateOptional}
                              </label>
                              <input
                                id="flight-return-date"
                                type="date"
                                min={flightDate || getTodayIsoDate()}
                                value={flightReturnDate}
                                onChange={(e) => setFlightReturnDate(e.target.value)}
                                className="w-full h-10 sm:h-11 px-3 text-sm font-mono font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="flight-class"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.cabinClass}
                              </label>
                              <select
                                id="flight-class"
                                value={flightClass}
                                onChange={(e) => setFlightClass(e.target.value)}
                                className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              >
                                {FLIGHT_CABIN_CLASSES.map((cls) => (
                                  <option key={cls} value={cls}>
                                    {cls}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor="flight-pref"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.baggageMealPref}
                              </label>
                              <select
                                id="flight-pref"
                                value={flightPreference}
                                onChange={(e) => setFlightPreference(e.target.value)}
                                className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              >
                                {FLIGHT_BAGGAGE_MEAL_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {flightError && (
                            <div
                              role="alert"
                              className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-700"
                            >
                              {flightError}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                            <button
                              type="submit"
                              className="h-12 px-7 bg-[#FB792B] hover:bg-[#E06319] text-white text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <Plane className="w-4 h-4" />
                              <span>{t.continueFlightBtn}</span>
                            </button>

                            <div className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-[#213D77] shrink-0" />
                              <span>{t.zeroUpfrontNote}</span>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* TAB 3: BUS TICKET REQUEST */}
                    {serviceTab === 'bus' && (
                      <div>
                        <div className="bg-[#213D77] text-white px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Bus className="w-4 h-4 sm:w-5 sm:h-5 text-[#FB792B] shrink-0" />
                            <h1 className="text-base sm:text-lg font-extrabold tracking-wide">
                              {t.bookBusTitle}
                            </h1>
                          </div>
                          <span className="text-[11px] sm:text-xs font-medium text-white/85 whitespace-nowrap">
                            {t.bookBusSub}
                          </span>
                        </div>

                        <form onSubmit={handleBusSubmit} className="p-4 sm:p-5 space-y-4">
                          <datalist id="skytrack-bus-cities">
                            {BUS_CITIES.map((city) => (
                              <option key={city} value={city} />
                            ))}
                          </datalist>

                          <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 sm:gap-3 items-end">
                            <div className="sm:col-span-5">
                              <label
                                htmlFor="bus-from"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.fromCity}
                              </label>
                              <input
                                id="bus-from"
                                list="skytrack-bus-cities"
                                type="text"
                                required
                                value={busFrom}
                                onChange={(e) => setBusFrom(e.target.value)}
                                placeholder="e.g., Mumbai"
                                className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-center sm:pb-1">
                              <button
                                type="button"
                                onClick={handleSwapBusCities}
                                aria-label="Swap origin and destination cities"
                                className="w-9 h-9 rounded-full border border-slate-300 bg-slate-50 hover:bg-[#213D77] hover:text-white hover:border-[#213D77] text-[#213D77] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="sm:col-span-5">
                              <label
                                htmlFor="bus-to"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.toCity}
                              </label>
                              <input
                                id="bus-to"
                                list="skytrack-bus-cities"
                                type="text"
                                required
                                value={busTo}
                                onChange={(e) => setBusTo(e.target.value)}
                                placeholder="e.g., Surat or Pune"
                                className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label
                                htmlFor="bus-date"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.journeyDate}
                              </label>
                              <input
                                id="bus-date"
                                type="date"
                                required
                                min={getTodayIsoDate()}
                                max={maxFutureDate120}
                                value={busDate}
                                onChange={(e) => setBusDate(e.target.value)}
                                className="w-full h-10 sm:h-11 px-3 text-sm font-mono font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="bus-coach"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.busCoachPref}
                              </label>
                              <select
                                id="bus-coach"
                                value={busCoach}
                                onChange={(e) => setBusCoach(e.target.value)}
                                className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              >
                                {BUS_COACH_PREFERENCES.map((coach) => (
                                  <option key={coach} value={coach}>
                                    {coach}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor="bus-window"
                                className="block text-xs font-semibold text-[#213D77] mb-1"
                              >
                                {t.boardingTimePref}
                              </label>
                              <select
                                id="bus-window"
                                value={busTimeWindow}
                                onChange={(e) => setBusTimeWindow(e.target.value)}
                                className="w-full h-10 sm:h-11 px-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                              >
                                {BUS_TIME_WINDOWS.map((win) => (
                                  <option key={win} value={win}>
                                    {win}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {busError && (
                            <div
                              role="alert"
                              className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-700"
                            >
                              {busError}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                            <button
                              type="submit"
                              className="h-12 px-7 bg-[#FB792B] hover:bg-[#E06319] text-white text-sm font-bold rounded-md inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <Bus className="w-4 h-4" />
                              <span>{t.continueBusBtn}</span>
                            </button>

                            <div className="text-[11px] sm:text-xs text-slate-600 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-[#213D77] shrink-0" />
                              <span>{t.zeroUpfrontNote}</span>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Compact Agency Highlights & Quick Screen Jumps (Desktop + Clean Mobile Summary) */}
                <div className="lg:col-span-5 flex flex-col justify-between text-white py-1">
                  <div className="space-y-3.5">
                    <div className="text-[11px] sm:text-xs font-bold tracking-wider text-[#FB792B]">
                      {t.heroKicker}
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
                      {t.heroHeadline}
                    </h2>
                    <p className="text-xs sm:text-base text-white/90 leading-relaxed">
                      {t.heroDesc}
                    </p>

                    <ul className="hidden sm:block space-y-2 pt-1 text-sm text-white/95">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FB792B] shrink-0 mt-1" />
                        <span>{t.heroPoint1}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FB792B] shrink-0 mt-1" />
                        <span>{t.heroPoint2}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FB792B] shrink-0 mt-1" />
                        <span>{t.heroPoint3}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Quick Jump Actions (No Scrolling Needed) */}
                  <div className="mt-5 pt-4 border-t border-white/20 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => navigateToScreen('track')}
                        className="min-h-[40px] px-3.5 py-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#FB792B]" />
                        <span>{t.downloadTicketBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateToScreen('guide')}
                        className="min-h-[40px] px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#FB792B]" />
                        <span>{t.navGuidePolicy}</span>
                      </button>
                    </div>

                    <div className="text-[11px] sm:text-xs text-white/80 font-mono tabular-nums">
                      {t.urgentHelpLabel} {AGENCY_CONTACT.primaryPhoneDisplay} ·{' '}
                      {AGENCY_CONTACT.secondaryPhoneDisplay}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            STEP 2: DEDICATED TRAIN RESULTS SCREEN
           ============================================================ */}
        {screen === 'results' && searchResult && (
          <TrainResults
            language={language}
            fromStation={searchResult.from}
            toStation={searchResult.to}
            journeyDate={searchResult.journeyDate}
            quota={searchResult.quota}
            initialClassFilter={searchResult.travelClass}
            trains={searchResult.trains}
            isAdvanceOpeningPriority={searchResult.isAdvanceOpeningPriority}
            onBackToSearch={() => navigateToScreen('home')}
            onGoHome={() => navigateToScreen('home')}
            onRequestBooking={(train, selectedClass, customTrainNote) => {
              setBookingContext({
                serviceType: 'train',
                trainNumber: train.trainNumber,
                trainName:
                  train.isCustomOption && customTrainNote
                    ? customTrainNote
                    : train.trainName,
                fromLabel: formatStationLabel(searchResult.from),
                toLabel: formatStationLabel(searchResult.to),
                defaultBoarding:
                  train.isCustomOption ||
                  train.routeStops?.includes(searchResult.from.code)
                    ? formatStationLabel(searchResult.from)
                    : `${train.fromName} - ${train.fromCode}`,
                journeyDate: searchResult.journeyDate,
                travelClass: selectedClass,
                quota: searchResult.quota,
                isAdvanceOpeningPriority: searchResult.isAdvanceOpeningPriority,
              });
              navigateToScreen('booking');
            }}
          />
        )}

        {/* ============================================================
            STEP 3: DEDICATED PASSENGER BOOKING & PAYMENT SCREEN
           ============================================================ */}
        {screen === 'booking' && bookingContext && (
          <BookingFormScreen
            context={bookingContext}
            language={language}
            hasTrainResults={Boolean(searchResult)}
            onBack={() =>
              navigateToScreen(
                bookingContext.serviceType === 'train' && searchResult ? 'results' : 'home'
              )
            }
            onExitHome={() => navigateToScreen('home')}
            onSubmitted={(record) => {
              setConfirmedRecord(record);
              navigateToScreen('confirmation');
            }}
          />
        )}

        {/* ============================================================
            STEP 4: DEDICATED CONFIRMATION RECEIPT SCREEN
           ============================================================ */}
        {screen === 'confirmation' && confirmedRecord && (
          <ConfirmationReceiptScreen
            record={confirmedRecord}
            language={language}
            onBookAnotherHome={() => {
              setConfirmedRecord(null);
              setBookingContext(null);
              navigateToScreen('home');
            }}
            onTrackRequest={(mobile) => {
              setTrackPrefillMobile(mobile);
              navigateToScreen('track');
            }}
          />
        )}

        {/* ============================================================
            TRACK & DOWNLOAD PDF SCREEN
           ============================================================ */}
        {screen === 'track' && (
          <TrackTicketView
            initialMobile={trackPrefillMobile}
            onOpenAdmin={() => navigateToScreen('admin')}
            onGoHome={() => navigateToScreen('home')}
          />
        )}

        {/* ============================================================
            HOW IT WORKS, TRUST BADGES, POPULAR ROUTES & POLICY SCREEN
           ============================================================ */}
        {screen === 'guide' && (
          <PopularRoutesSection
            language={language}
            onSelectCorridor={handleCorridorShortcut}
            onGoHome={() => navigateToScreen('home')}
          />
        )}

        {/* ============================================================
            ADMIN TICKET UPLOAD PORTAL SCREEN
           ============================================================ */}
        {screen === 'admin' && <AdminPortalView />}
      </main>

      {/* Quiet Compact Footer (Desktop visible; compact above bottom bar on mobile) */}
      <footer className="no-print hidden md:block bg-[#182D59] text-white/85 border-t border-[#122447]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-row items-center justify-between gap-6 text-xs">
          <div className="space-y-1">
            <div className="text-sm font-extrabold tracking-tight text-white">
              SKY TRACK — MSME Udyam Registered Travel Agency
            </div>
            <div className="text-white/75">{AGENCY_CONTACT.fullAddress}</div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={`tel:+${AGENCY_CONTACT.primaryPhoneRaw}`}
              className="inline-flex items-center gap-1.5 hover:text-[#FB792B] transition-colors font-mono"
            >
              <Phone className="w-3.5 h-3.5 text-[#FB792B]" />
              <span>{AGENCY_CONTACT.primaryPhoneDisplay}</span>
            </a>
            <a
              href={`tel:+${AGENCY_CONTACT.secondaryPhoneRaw}`}
              className="inline-flex items-center gap-1.5 hover:text-[#FB792B] transition-colors font-mono"
            >
              <Phone className="w-3.5 h-3.5 text-[#FB792B]" />
              <span>{AGENCY_CONTACT.secondaryPhoneDisplay}</span>
            </a>
            <a
              href={`mailto:${AGENCY_CONTACT.email}`}
              className="inline-flex items-center gap-1.5 hover:text-[#FB792B] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#FB792B]" />
              <span>{AGENCY_CONTACT.email}</span>
            </a>
            <a
              href={`https://wa.me/${AGENCY_CONTACT.primaryPhoneRaw}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Desk</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Quick Bar */}
      <MobileBottomNav
        activeNav={activeNavTab}
        language={language}
        onSelectNav={handleSelectTopNav}
      />
    </div>
  );
}
