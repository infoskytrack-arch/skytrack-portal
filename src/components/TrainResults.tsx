import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Info,
  RefreshCw,
  ShieldAlert,
  TrainFront,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import {
  QUOTA_OPTIONS,
  TRAVEL_CLASSES,
  type ClassAvailabilityQuote,
  type LanguageCode,
  type QuotaType,
  type SelectableClassCode,
  type Station,
  type TrainSchedule,
  type TravelClassCode,
} from '../types';
import {
  formatReadableDate,
  formatInrAmount,
  getFutureIsoDate,
  getTodayIsoDate,
} from '../utils/bookingFormat';
import {
  addDaysToIsoDate,
  calculateRailwayDistanceKm,
  computeArrivalMeta,
  formatDeviceClockTime,
  getDaysUntilJourney,
  getTrainAvailabilityQuotes,
  sortClassesForDisplay,
} from '../utils/fareAndAvailabilityEngine';

interface TrainResultsProps {
  language: LanguageCode;
  fromStation: Station;
  toStation: Station;
  journeyDate: string;
  quota: QuotaType;
  initialClassFilter: TravelClassCode;
  trains: TrainSchedule[];
  isAdvanceOpeningPriority?: boolean;
  onDateChange: (nextDate: string) => void;
  onQuotaChange: (nextQuota: QuotaType) => void;
  onBackToSearch: () => void;
  onGoHome: () => void;
  onRequestBooking: (
    train: TrainSchedule,
    selectedClass: SelectableClassCode,
    quote?: ClassAvailabilityQuote,
    distanceKm?: number,
    customTrainNote?: string
  ) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const PREFERRED_TIME_WINDOWS = [
  'Any Time',
  'Morning (5:00 AM – 12:00 PM)',
  'Afternoon (12:00 PM – 5:00 PM)',
  'Evening (5:00 PM – 9:00 PM)',
  'Night / Overnight (9:00 PM – 5:00 AM)',
] as const;

export function TrainResults({
  language,
  fromStation,
  toStation,
  journeyDate,
  quota,
  initialClassFilter,
  trains,
  isAdvanceOpeningPriority = false,
  onDateChange,
  onQuotaChange,
  onBackToSearch,
  onRequestBooking,
}: TrainResultsProps) {
  const t = TRANSLATIONS[language];

  const [classFilter, setClassFilter] = useState<TravelClassCode>(initialClassFilter);
  const [expandedTrains, setExpandedTrains] = useState<Record<string, boolean>>({});
  const [refreshingTrain, setRefreshingTrain] = useState<Record<string, boolean>>({});
  const [checkTimestamp, setCheckTimestamp] = useState<Date>(() => new Date());

  // Custom train card state
  const [selectedCustomClass, setSelectedCustomClass] = useState<SelectableClassCode>('3A');
  const [customTrainNote, setCustomTrainNote] = useState('');
  const [preferredTimeWindow, setPreferredTimeWindow] = useState<string>(
    PREFERRED_TIME_WINDOWS[0]
  );

  useEffect(() => {
    setClassFilter(initialClassFilter);
    setExpandedTrains({});
    setRefreshingTrain({});
    if (initialClassFilter !== 'ALL') {
      setSelectedCustomClass(initialClassFilter as SelectableClassCode);
    } else {
      setSelectedCustomClass('3A');
    }
  }, [fromStation.code, toStation.code, initialClassFilter]);

  useEffect(() => {
    setCheckTimestamp(new Date());
  }, [quota, journeyDate, fromStation.code, toStation.code]);

  const todayIso = getTodayIsoDate();
  const maxDate120 = getFutureIsoDate(120);
  const routeDistanceKm = calculateRailwayDistanceKm(fromStation, toStation);
  const daysAway = getDaysUntilJourney(journeyDate, checkTimestamp);
  const localHour = checkTimestamp.getHours();
  const formattedLocalTime = formatDeviceClockTime(checkTimestamp);

  const filteredTrains = trains.filter((train) => {
    if (train.isCustomOption) return true;
    if (classFilter === 'ALL') return true;
    return train.classes.includes(classFilter as SelectableClassCode);
  });

  const scheduledCount = filteredTrains.filter((tr) => !tr.isCustomOption).length;

  function handleToggleAvailability(trainNumber: string) {
    const currentlyOpen = Boolean(expandedTrains[trainNumber]);
    if (currentlyOpen) {
      setExpandedTrains((prev) => ({ ...prev, [trainNumber]: false }));
      return;
    }

    setRefreshingTrain((prev) => ({ ...prev, [trainNumber]: true }));
    setCheckTimestamp(new Date());
    window.setTimeout(() => {
      setRefreshingTrain((prev) => ({ ...prev, [trainNumber]: false }));
      setExpandedTrains((prev) => ({ ...prev, [trainNumber]: true }));
    }, 180);
  }

  function handleRefreshAvailability(trainNumber: string) {
    setRefreshingTrain((prev) => ({ ...prev, [trainNumber]: true }));
    setCheckTimestamp(new Date());
    window.setTimeout(() => {
      setRefreshingTrain((prev) => ({ ...prev, [trainNumber]: false }));
    }, 200);
  }

  function handleShiftDate(delta: number) {
    const candidate = addDaysToIsoDate(journeyDate, delta);
    if (candidate < todayIso) {
      onDateChange(todayIso);
      return;
    }
    if (candidate > maxDate120) {
      onDateChange(maxDate120);
      return;
    }
    onDateChange(candidate);
  }

  function composeCustomNote(): string | undefined {
    const parts: string[] = [];
    if (customTrainNote.trim()) {
      parts.push(customTrainNote.trim());
    }
    if (preferredTimeWindow && preferredTimeWindow !== 'Any Time') {
      parts.push(`Preferred Time: ${preferredTimeWindow}`);
    }
    return parts.length > 0 ? parts.join(' | ') : undefined;
  }

  return (
    <div id="train-results-section" className="bg-slate-50 min-h-[calc(100vh-140px)] pb-12">
      {/* Original SKY TRACK Route Summary & Controls Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-3.5">
          {/* Top Row: Back Button + Route Summary + Date Picker */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onBackToSearch}
                className="min-h-[40px] px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-[#213D77] text-xs font-bold rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backToSearch}</span>
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg font-extrabold text-[#213D77] tracking-tight">
                  <span>
                    {fromStation.name} ({fromStation.code})
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#FB792B] shrink-0" />
                  <span>
                    {toStation.name} ({toStation.code})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-600 mt-0.5">
                  <span className="font-mono font-semibold tabular-nums">
                    {formatReadableDate(journeyDate)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    ~{routeDistanceKm.toLocaleString('en-IN')} km rail distance
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {scheduledCount} scheduled {scheduledCount === 1 ? 'train' : 'trains'} found
                  </span>
                  {isAdvanceOpeningPriority && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#FB792B] inline-flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>60-Day Advance Opening Priority</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Inline Date Adjuster */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                disabled={journeyDate <= todayIso}
                aria-label="Previous Day"
                className="h-10 w-9 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#213D77] absolute left-2.5 top-3 pointer-events-none" />
                <input
                  type="date"
                  aria-label="Change Journey Date"
                  min={todayIso}
                  max={maxDate120}
                  value={journeyDate}
                  onChange={(e) => e.target.value && onDateChange(e.target.value)}
                  className="h-10 pl-8 pr-2.5 text-xs sm:text-sm font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                disabled={journeyDate >= maxDate120}
                aria-label="Next Day"
                className="h-10 w-9 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Second Row: Quota Switcher + Class Filter */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Quota:</span>
              {QUOTA_OPTIONS.map((q) => {
                const active = quota === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onQuotaChange(q)}
                    className={`h-8 px-3 rounded-md text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#213D77] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="results-class-filter"
                className="text-xs font-bold text-slate-500 whitespace-nowrap"
              >
                Class:
              </label>
              <select
                id="results-class-filter"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value as TravelClassCode)}
                className="h-8 px-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
              >
                {TRAVEL_CLASSES.map((cls) => (
                  <option key={cls.code} value={cls.code}>
                    {cls.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Quota & Live Fare Notice Strip */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4">
        {quota === 'SENIOR CITIZEN' ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-900">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Senior Citizen / Lower Berth Quota:</strong> Distance-based
              class fares are displayed for reference, and current quota status is{' '}
              <span className="font-bold">NOT AVAILABLE</span>. Switch to{' '}
              <button
                type="button"
                onClick={() => onQuotaChange('GENERAL')}
                className="underline font-bold text-[#213D77] cursor-pointer"
              >
                GENERAL
              </button>{' '}
              quota to request booking with lower berth preference.
            </div>
          </div>
        ) : quota === 'TATKAL' || quota === 'PREMIUM TATKAL' ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-950">
            <Clock className="w-4 h-4 text-[#FB792B] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">{quota} Live Window ({formattedLocalTime}):</strong>{' '}
              {localHour < 10
                ? 'Checked before 10:00 AM opening window — Tatkal quota seats are currently showing AVAILABLE. Submit your SKY TRACK desk request early for priority booking.'
                : 'Checked after 10:00 AM Tatkal opening — live quota has moved into Tatkal Waiting List (TQWL). Dynamic Tatkal surcharge is included in fares below.'}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#F4F7FC] border border-[#213D77]/15 rounded-lg flex items-start gap-2.5 text-xs text-slate-700">
            <Info className="w-4 h-4 text-[#213D77] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-[#213D77]">
                All-India IRCTC Fare &amp; Availability Preview:
              </strong>{' '}
              Click <span className="font-bold">Check Availability</span> on any train to inspect
              distance-calibrated class fares and live-style seat status (
              {daysAway <= 7
                ? `Short-notice journey in ${Math.max(0, daysAway)} day(s) — showing current WL / RAC trend`
                : daysAway >= 15
                ? `Advance journey (${daysAway} days away) — high seat availability across classes`
                : `${daysAway} days away — mixed availability across classes`}
              ). Final confirmed PNR &amp; fare are issued by our SKY TRACK Mumbai desk.
            </div>
          </div>
        )}
      </div>

      {/* Train Results Cards List */}
      <section aria-label="Train Search Results" className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
        {filteredTrains.map((train) => {
          const isExpanded = Boolean(expandedTrains[train.trainNumber]);
          const isRefreshing = Boolean(refreshingTrain[train.trainNumber]);
          const orderedClasses = sortClassesForDisplay(train.classes);
          const { distanceKm, quotes } = getTrainAvailabilityQuotes(
            train,
            fromStation,
            toStation,
            journeyDate,
            quota,
            checkTimestamp
          );

          // Optional Custom Train Request Card at Bottom
          if (train.isCustomOption) {
            const customQuote =
              quotes.find((q) => q.classCode === selectedCustomClass) ?? quotes[0];

            return (
              <article
                key="CUSTOM-TRAIN-CARD"
                className="bg-white border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="bg-[#F4F7FC] border-b border-slate-200 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrainFront className="w-4 h-4 text-[#FB792B]" />
                    <h3 className="text-sm sm:text-base font-extrabold text-[#213D77]">
                      {train.trainName}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Can&apos;t see your preferred train? Request manually
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="custom-time-window"
                        className="block text-xs font-bold text-[#213D77] mb-1.5"
                      >
                        Preferred Departure Time (Optional)
                      </label>
                      <select
                        id="custom-time-window"
                        value={preferredTimeWindow}
                        onChange={(e) => setPreferredTimeWindow(e.target.value)}
                        className="w-full h-10 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                      >
                        {PREFERRED_TIME_WINDOWS.map((win) => (
                          <option key={win} value={win}>
                            {win}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="custom-train-input"
                        className="block text-xs font-bold text-[#213D77] mb-1.5"
                      >
                        Preferred Train Name / Number (Optional)
                      </label>
                      <input
                        id="custom-train-input"
                        type="text"
                        value={customTrainNote}
                        onChange={(e) => setCustomTrainNote(e.target.value)}
                        placeholder="e.g., 12951 Rajdhani or Any Superfast"
                        className="w-full h-10 px-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#213D77]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {quotes.map((q) => {
                        const active = selectedCustomClass === q.classCode;
                        return (
                          <button
                            key={`custom-${q.classCode}`}
                            type="button"
                            onClick={() => setSelectedCustomClass(q.classCode)}
                            className={`px-3 py-1.5 rounded-md border text-left transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#213D77] border-[#213D77] text-white'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-[#213D77]'
                            }`}
                          >
                            <div className="font-mono text-xs font-bold">{q.classCode}</div>
                            <div
                              className={`font-mono text-[11px] font-semibold tabular-nums ${
                                active ? 'text-white/85' : 'text-slate-600'
                              }`}
                            >
                              {formatInrAmount(q.totalFare)}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!customQuote?.isBookable}
                      onClick={() =>
                        customQuote &&
                        onRequestBooking(
                          train,
                          customQuote.classCode,
                          customQuote,
                          routeDistanceKm,
                          composeCustomNote()
                        )
                      }
                      className="h-10 px-6 rounded-md bg-[#FB792B] hover:bg-[#E06319] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {customQuote?.isBookable ? 'Request Custom Train' : 'NOT AVAILABLE'}
                    </button>
                  </div>
                </div>
              </article>
            );
          }

          const arrivalMeta = computeArrivalMeta(
            journeyDate,
            train.departureTime,
            train.duration
          );

          return (
            <article
              key={`${train.trainNumber}-${train.fromCode}-${train.toCode}`}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.04)]"
            >
              {/* SKY TRACK Train Card Header Strip */}
              <div className="bg-[#F4F7FC] border-b border-slate-200 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
                  <span className="font-mono text-xs sm:text-sm font-extrabold text-white bg-[#213D77] px-2 py-0.5 rounded tabular-nums">
                    {train.trainNumber}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#213D77] tracking-tight truncate">
                    {train.trainName}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    · {train.trainType}
                  </span>
                </div>

                {/* Running Days M T W T F S S */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium hidden sm:inline">Runs On:</span>
                  <div className="flex items-center gap-1 font-mono" aria-label="Running days">
                    {DAY_LABELS.map((day, idx) => (
                      <span
                        key={`${train.trainNumber}-day-${idx}`}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold ${
                          train.runsOn[idx]
                            ? 'bg-white text-[#213D77] border border-slate-200'
                            : 'text-slate-300'
                        }`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Train Card Body: Departure / Duration / Arrival + Check Availability */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Departure */}
                  <div className="md:col-span-4">
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums leading-none">
                      {train.departureTime}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#213D77] mt-1">
                      {train.fromName} ({train.fromCode})
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {arrivalMeta.departureDateLabel}
                    </div>
                  </div>

                  {/* Duration & Distance Connector */}
                  <div className="md:col-span-4 flex flex-col items-center text-center">
                    <div className="font-mono text-xs font-bold text-slate-700 tabular-nums">
                      {train.duration}
                      {arrivalMeta.dayOffset > 0 && (
                        <span className="text-[#FB792B] ml-1.5">
                          (+{arrivalMeta.dayOffset} {arrivalMeta.dayOffset === 1 ? 'Day' : 'Days'})
                        </span>
                      )}
                    </div>
                    <div className="w-full flex items-center my-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#213D77] shrink-0" />
                      <div className="flex-1 h-[2px] bg-slate-200" />
                      <span className="w-2 h-2 rounded-full bg-[#FB792B] shrink-0" />
                    </div>
                    <div className="font-mono text-[11px] font-medium text-slate-500 tabular-nums">
                      {distanceKm.toLocaleString('en-IN')} km · {quota}
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="md:col-span-4 md:text-right">
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums leading-none">
                      {train.arrivalTime}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#213D77] mt-1">
                      {train.toName} ({train.toCode})
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {arrivalMeta.arrivalDateLabel}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row: Available Class Summary + Check Availability Button */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 mr-1">Classes:</span>
                    {orderedClasses.map((cls) => (
                      <span
                        key={`${train.trainNumber}-tag-${cls}`}
                        className="font-mono text-xs font-bold text-[#213D77] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {isExpanded && (
                      <button
                        type="button"
                        onClick={() => handleRefreshAvailability(train.trainNumber)}
                        disabled={isRefreshing}
                        className="h-9 px-3 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-[#213D77] text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(train.trainNumber)}
                      disabled={isRefreshing}
                      className={`h-9 px-4 rounded-md text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                        isExpanded
                          ? 'bg-slate-100 hover:bg-slate-200 text-[#213D77] border border-slate-300'
                          : 'bg-[#213D77] hover:bg-[#182D59] text-white'
                      }`}
                    >
                      {isRefreshing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking...</span>
                        </>
                      ) : isExpanded ? (
                        <>
                          <span>Hide Availability</span>
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Check Availability &amp; Fare</span>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Horizontal Class Fare & Availability Cards */}
              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-[#213D77]">
                      Class-wise Fare &amp; Availability ({quota} · {formatReadableDate(journeyDate)})
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Checked {formattedLocalTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {quotes.map((quote) => {
                      const isDisabled = !quote.isBookable;
                      const statusClass =
                        quote.statusCategory === 'AVAILABLE'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : quote.statusCategory === 'NOT_AVAILABLE'
                          ? 'text-red-700 bg-red-50 border-red-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200';

                      return (
                        <div
                          key={`${train.trainNumber}-cls-${quote.classCode}`}
                          className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-sm font-extrabold text-[#213D77]">
                                {quote.classCode}
                              </span>
                              <span className="font-mono text-base font-extrabold text-slate-900 tabular-nums">
                                {formatInrAmount(quote.totalFare)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {quote.classLabel}
                            </div>
                            {quote.surchargeNote && (
                              <div className="text-[10px] font-semibold text-[#FB792B] mt-0.5">
                                {quote.surchargeNote}
                              </div>
                            )}
                          </div>

                          <div
                            className={`px-2 py-1.5 rounded border text-center font-mono text-xs font-extrabold tabular-nums ${statusClass}`}
                          >
                            {quote.statusText}
                          </div>

                          <button
                            type="button"
                            disabled={isDisabled}
                            aria-disabled={isDisabled}
                            onClick={() => {
                              if (isDisabled) return;
                              onRequestBooking(train, quote.classCode, quote, distanceKm);
                            }}
                            className={`w-full h-9 rounded-md text-xs font-extrabold tracking-wide transition-colors ${
                              isDisabled
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-[#FB792B] hover:bg-[#E06319] text-white cursor-pointer'
                            }`}
                          >
                            {isDisabled ? 'NOT AVAILABLE' : 'BOOK'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}

export function getTravelClassLabel(code: SelectableClassCode): string {
  return TRAVEL_CLASSES.find((c) => c.code === code)?.label ?? code;
}
