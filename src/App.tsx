import { useState } from 'react';
import {
  ArrowLeftRight,
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
  | 'home' // Step 1: SKY TRACK Home Search Screen
  | 'results' // Step 2: Train Results & Live Fare/Availability Screen
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

const QUICK_CORRIDORS = [
  { label: 'Howrah → Mumbai', from: 'HWH', to: 'CSMT' },
  { label: 'Howrah → Jaipur', from: 'HWH', to: 'JP' },
  { label: 'Howrah → Surat', from: 'HWH', to: 'ST' },
  { label: 'Howrah → Ahmedabad', from: 'HWH', to: 'ADI' },
  { label: 'Mumbai → New Delhi', from: 'MMCT', to: 'NDLS' },
] as const;

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
      setSearchError('Please select both From Station and To Station.');
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
    setFromStation(from);
    setToStation(to);
    setJourneyDate(date);
    setTravelClass(cls);
    setQuota(q);
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
            STEP 1: ORIGINAL SKY TRACK HOME SEARCH HERO & BOOKING DESK
           ============================================================ */}
        {screen === 'home' && (
          <section className="relative overflow-hidden bg-[#182D59]">
            {/* Full-bleed Indian Railways Express Hero Backdrop */}
            <div className="absolute inset-0">
              {!heroImgErr ? (
                <img
                  src="/src/assets/images/hero_indian_railways_express_1795296231782.jpg"
                  alt="Indian Railways express train traveling across India"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgErr(true)}
                  className="w-full h-full object-cover object-center opacity-35"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#182D59] via-[#213D77] to-[#122245]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#182D59]/92 via-[#213D77]/82 to-[#182D59]/88" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 lg:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                {/* LEFT COLUMN: SKY TRACK Multi-Service Booking Search Card */}
                <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                  {/* Service Selector Tabs (Train / Flight / Bus) */}
                  <div
                    role="tablist"
                    aria-label="Select Travel Service"
                    className="grid grid-cols-3 bg-[#F4F7FC] border-b border-slate-200"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={serviceTab === 'train'}
                      onClick={() => setServiceTab('train')}
                      className={`py-3 px-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        serviceTab === 'train'
                          ? 'bg-white text-[#213D77] border-[#FB792B]'
                          : 'text-slate-600 border-transparent hover:text-[#213D77]'
                      }`}
                    >
                      <TrainFront className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t.tabTrain}</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={serviceTab === 'flight'}
                      onClick={() => setServiceTab('flight')}
                      className={`py-3 px-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        serviceTab === 'flight'
                          ? 'bg-white text-[#213D77] border-[#FB792B]'
                          : 'text-slate-600 border-transparent hover:text-[#213D77]'
                      }`}
                    >
                      <Plane className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t.tabFlight}</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={serviceTab === 'bus'}
                      onClick={() => setServiceTab('bus')}
                      className={`py-3 px-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        serviceTab === 'bus'
                          ? 'bg-white text-[#213D77] border-[#FB792B]'
                          : 'text-slate-600 border-transparent hover:text-[#213D77]'
                      }`}
                    >
                      <Bus className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t.tabBus}</span>
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                    {/* TAB 1: TRAIN TICKET SEARCH */}
                    {serviceTab === 'train' && (
                      <form onSubmit={handleTrainSearchSubmit} className="space-y-4">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <h2 className="text-lg sm:text-xl font-extrabold text-[#213D77] tracking-tight">
                              {t.bookTrainTitle}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">{t.bookTrainSub}</p>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#FB792B] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded whitespace-nowrap">
                            All-India Rail
                          </span>
                        </div>

                        {/* From / Swap / To */}
                        <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-end">
                          <div className="sm:col-span-5">
                            <StationAutocomplete
                              label={t.fromStation}
                              placeholder="Enter origin station or code"
                              selectedStation={fromStation}
                              onSelect={setFromStation}
                              excludeCode={toStation?.code}
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-center sm:pb-0.5">
                            <button
                              type="button"
                              onClick={handleSwapStations}
                              aria-label="Swap From and To Stations"
                              title="Swap Stations"
                              className="w-10 h-10 rounded-md bg-slate-100 hover:bg-[#213D77] text-[#213D77] hover:text-white border border-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="sm:col-span-5">
                            <StationAutocomplete
                              label={t.toStation}
                              placeholder="Enter destination station or code"
                              selectedStation={toStation}
                              onSelect={setToStation}
                              excludeCode={fromStation?.code}
                            />
                          </div>
                        </div>

                        {/* Date / Class / Quota */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label
                              htmlFor="journey-date"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
                            >
                              {t.journeyDate}
                            </label>
                            <div className="relative">
                              <Calendar className="w-4 h-4 text-[#213D77] absolute left-3 top-3.5 pointer-events-none" />
                              <input
                                id="journey-date"
                                type="date"
                                min={getTodayIsoDate()}
                                max={maxFutureDate120}
                                value={journeyDate}
                                onChange={(e) => setJourneyDate(e.target.value)}
                                className="w-full h-11 pl-9 pr-2.5 text-sm font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77] focus:ring-2 focus:ring-[#213D77]/15"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="travel-class"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
                            >
                              {t.allClasses}
                            </label>
                            <select
                              id="travel-class"
                              value={travelClass}
                              onChange={(e) => setTravelClass(e.target.value as TravelClassCode)}
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77] focus:ring-2 focus:ring-[#213D77]/15"
                            >
                              {TRAVEL_CLASSES.map((cls) => (
                                <option key={cls.code} value={cls.code}>
                                  {cls.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="travel-quota"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
                            >
                              {t.quota}
                            </label>
                            <select
                              id="travel-quota"
                              value={quota}
                              onChange={(e) => setQuota(e.target.value as QuotaType)}
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77] focus:ring-2 focus:ring-[#213D77]/15"
                            >
                              {QUOTA_OPTIONS.map((q) => (
                                <option key={q} value={q}>
                                  {q}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Tatkal Timing Notice */}
                        {isTatkalQuota && (
                          <div
                            role="status"
                            className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5 text-xs text-amber-950"
                          >
                            <Clock className="w-4 h-4 text-[#FB792B] shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold">{t.tatkalAlertTitle}:</strong>{' '}
                              <span>
                                {t.tatkalAcRule} · {t.tatkalNonAcRule}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Festival / 60-Day Advance Opening Priority Checkbox */}
                        <label className="flex items-center gap-2.5 p-2.5 bg-[#F4F7FC] border border-slate-200 rounded-md cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAdvanceOpeningPriority}
                            onChange={(e) => {
                              const next = e.target.checked;
                              setIsAdvanceOpeningPriority(next);
                              if (next && journeyDate === getTomorrowIsoDate()) {
                                setJourneyDate(getFutureIsoDate(60));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#213D77] focus:ring-[#213D77]"
                          />
                          <CalendarClock className="w-4 h-4 text-[#FB792B] shrink-0" />
                          <span className="text-xs font-semibold text-[#213D77]">
                            Festival / 60-Day Advance Opening Priority Request
                          </span>
                        </label>

                        {searchError && (
                          <div
                            role="alert"
                            className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs font-semibold text-red-700"
                          >
                            {searchError}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full h-12 rounded-md bg-[#FB792B] hover:bg-[#E06319] text-white text-sm sm:text-base font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <Search className="w-4 h-4" />
                          <span>{t.searchTrainsBtn}</span>
                        </button>

                        {/* Quick Search Corridors */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500 mr-1">
                            {t.quickSearch}
                          </span>
                          {QUICK_CORRIDORS.map((c) => (
                            <button
                              key={`${c.from}-${c.to}`}
                              type="button"
                              onClick={() => handleCorridorShortcut(c.from, c.to)}
                              className="px-2 py-1 text-[11px] font-semibold text-[#213D77] bg-slate-100 hover:bg-[#213D77] hover:text-white rounded transition-colors cursor-pointer"
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </form>
                    )}

                    {/* TAB 2: FLIGHT TICKET REQUEST */}
                    {serviceTab === 'flight' && (
                      <form onSubmit={handleFlightSubmit} className="space-y-4">
                        <datalist id="skytrack-airports-list">
                          {MAJOR_AIRPORTS.map((ap) => (
                            <option
                              key={ap.code}
                              value={`${ap.city} (${ap.code}) — ${ap.airportName}`}
                            />
                          ))}
                        </datalist>

                        <div className="pb-2 border-b border-slate-100">
                          <h2 className="text-lg sm:text-xl font-extrabold text-[#213D77] tracking-tight">
                            {t.bookFlightTitle}
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">{t.bookFlightSub}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-end">
                          <div className="sm:col-span-5">
                            <label
                              htmlFor="flight-from"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
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
                              placeholder="e.g., Kolkata (CCU)"
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-center sm:pb-0.5">
                            <button
                              type="button"
                              onClick={handleSwapAirports}
                              aria-label="Swap Airports"
                              className="w-10 h-10 rounded-md bg-slate-100 hover:bg-[#213D77] text-[#213D77] hover:text-white border border-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="sm:col-span-5">
                            <label
                              htmlFor="flight-to"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
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
                              placeholder="e.g., Mumbai (BOM)"
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="flight-date"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
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
                              className="w-full h-11 px-3 text-sm font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="flight-return-date"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
                            >
                              {t.returnDateOptional}
                            </label>
                            <input
                              id="flight-return-date"
                              type="date"
                              min={flightDate || getTodayIsoDate()}
                              value={flightReturnDate}
                              onChange={(e) => setFlightReturnDate(e.target.value)}
                              className="w-full h-11 px-3 text-sm font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="flight-class"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
                            >
                              {t.cabinClass}
                            </label>
                            <select
                              id="flight-class"
                              value={flightClass}
                              onChange={(e) => setFlightClass(e.target.value)}
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
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
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
                            >
                              {t.baggageMealPref}
                            </label>
                            <select
                              id="flight-pref"
                              value={flightPreference}
                              onChange={(e) => setFlightPreference(e.target.value)}
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
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
                            className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs font-semibold text-red-700"
                          >
                            {flightError}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full h-12 rounded-md bg-[#FB792B] hover:bg-[#E06319] text-white text-sm sm:text-base font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <Plane className="w-4 h-4" />
                          <span>{t.continueFlightBtn}</span>
                        </button>
                      </form>
                    )}

                    {/* TAB 3: BUS TICKET REQUEST */}
                    {serviceTab === 'bus' && (
                      <form onSubmit={handleBusSubmit} className="space-y-4">
                        <datalist id="skytrack-bus-cities">
                          {BUS_CITIES.map((city) => (
                            <option key={city} value={city} />
                          ))}
                        </datalist>

                        <div className="pb-2 border-b border-slate-100">
                          <h2 className="text-lg sm:text-xl font-extrabold text-[#213D77] tracking-tight">
                            {t.bookBusTitle}
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">{t.bookBusSub}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-end">
                          <div className="sm:col-span-5">
                            <label
                              htmlFor="bus-from"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
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
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                            />
                          </div>

                          <div className="sm:col-span-1 flex justify-center sm:pb-0.5">
                            <button
                              type="button"
                              onClick={handleSwapBusCities}
                              aria-label="Swap Cities"
                              className="w-10 h-10 rounded-md bg-slate-100 hover:bg-[#213D77] text-[#213D77] hover:text-white border border-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="sm:col-span-5">
                            <label
                              htmlFor="bus-to"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
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
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label
                              htmlFor="bus-date"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
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
                              className="w-full h-11 px-3 text-sm font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="bus-coach"
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
                            >
                              {t.busCoachPref}
                            </label>
                            <select
                              id="bus-coach"
                              value={busCoach}
                              onChange={(e) => setBusCoach(e.target.value)}
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
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
                              className="block text-xs font-bold text-[#213D77] mb-1.5"
                            >
                              {t.boardingTimePref}
                            </label>
                            <select
                              id="bus-window"
                              value={busTimeWindow}
                              onChange={(e) => setBusTimeWindow(e.target.value)}
                              className="w-full h-11 px-3 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
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
                            className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs font-semibold text-red-700"
                          >
                            {busError}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full h-12 rounded-md bg-[#FB792B] hover:bg-[#E06319] text-white text-sm sm:text-base font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                          <Bus className="w-4 h-4" />
                          <span>{t.continueBusBtn}</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: Original SKY TRACK Brand Hero Copy & Direct Desk Actions */}
                <div className="lg:col-span-5 text-white flex flex-col justify-between gap-6 py-2 lg:py-4">
                  <div className="space-y-4">
                    <div className="text-xs font-bold tracking-wider text-[#FB792B]">
                      {t.heroKicker}
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-tight tracking-tight text-white text-balance">
                      {t.heroHeadline}
                    </h1>
                    <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                      {t.heroDesc}
                    </p>

                    <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-white/90">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FB792B] shrink-0 mt-0.5" />
                        <span>{t.heroPoint1}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FB792B] shrink-0 mt-0.5" />
                        <span>{t.heroPoint2}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FB792B] shrink-0 mt-0.5" />
                        <span>{t.heroPoint3}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Direct Support & Download Ticket Action Block */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg p-4 space-y-3">
                    <div className="text-xs font-semibold text-white/85">{t.urgentHelpLabel}</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-mono font-bold text-white">
                      <a
                        href={`tel:+${AGENCY_CONTACT.primaryPhoneRaw}`}
                        className="inline-flex items-center gap-1.5 hover:text-[#FB792B] transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[#FB792B]" />
                        <span>{AGENCY_CONTACT.primaryPhoneDisplay}</span>
                      </a>
                      <a
                        href={`tel:+${AGENCY_CONTACT.secondaryPhoneRaw}`}
                        className="inline-flex items-center gap-1.5 hover:text-[#FB792B] transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[#FB792B]" />
                        <span>{AGENCY_CONTACT.secondaryPhoneDisplay}</span>
                      </a>
                    </div>

                    <div className="pt-1 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => navigateToScreen('track')}
                        className="flex-1 min-h-[42px] px-4 rounded-md bg-white hover:bg-slate-100 text-[#213D77] text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <FileDown className="w-4 h-4 text-[#FB792B]" />
                        <span>{t.downloadTicketBtn}</span>
                      </button>

                      <a
                        href={`https://wa.me/${AGENCY_CONTACT.primaryPhoneRaw}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[42px] px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{t.whatsappAgent}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            STEP 2: TRAIN RESULTS & LIVE FARE/AVAILABILITY SCREEN
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
            onDateChange={(nextDate) => {
              setJourneyDate(nextDate);
              setSearchResult((prev) => (prev ? { ...prev, journeyDate: nextDate } : prev));
            }}
            onQuotaChange={(nextQuota) => {
              setQuota(nextQuota);
              setSearchResult((prev) => (prev ? { ...prev, quota: nextQuota } : prev));
            }}
            onBackToSearch={() => navigateToScreen('home')}
            onGoHome={() => navigateToScreen('home')}
            onRequestBooking={(train, selectedClass, quote, distanceKm, customTrainNote) => {
              const prefParts: string[] = [];
              if (quote) {
                prefParts.push(
                  `Est. IRCTC Fare: ₹${quote.totalFare.toLocaleString('en-IN')} (${quote.statusText})`
                );
              }
              if (customTrainNote) {
                prefParts.push(customTrainNote);
              }

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
                extraPreferences: prefParts.join(' | ').slice(0, 195) || undefined,
                estimatedFare: quote?.totalFare,
                availabilityStatus: quote?.statusText,
                distanceKm,
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

      {/* Quiet Compact Footer */}
      <footer className="no-print hidden md:block bg-[#182D59] text-white/85 border-t border-[#213D77]">
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
